#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2026 LKS Next
# Copyright (c) 2026 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

"""
PCF Consumption Manager - Data Consumer operations for PCF data exchange.

Reference:
    - CX-0136 PCF Exchange Standard
    - CX-0002 Digital Twins in Catena-X
"""

from typing import Dict, Any, List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from urllib.parse import quote

from tractusx_sdk.dataspace.services.connector import BaseConnectorConsumerService
from tractusx_sdk.extensions.notification_api.models import Notification, NotificationHeader, NotificationContent

from managers.config.log_manager import LoggingManager
from managers.config.config_manager import ConfigManager
from managers.metadata_database.manager import RepositoryManagerFactory
from models.metadata_database.pcf import PcfExchangeDirection, PcfExchangeStatus
from models.metadata_database.notification.models import NotificationDirection
from services.notifications.notifications_management_service import NotificationsManagementService
from tools.constants import PCF
from tools.edr_tools import remove_existing_edr

logger = LoggingManager.get_logger(__name__)

# Asset type used to identify PCF exchange assets in EDC catalogs (CX-0136)
PCF_EXCHANGE_ASSET_TYPE = "https://w3id.org/catenax/taxonomy#PcfExchange"


class PcfConsumptionManager:
    """
    Manages PCF consumption operations for data consumers.

    This manager handles:
    - Creating PCF request records in the metadata database
    - Discovering the data provider's connector endpoints
    - Browsing catalogs for ``PcfExchange`` assets
    - Negotiating contracts and sending GET requests via EDC data plane
    - Creating notifications for PCF request events

    PCF Request Flow (CX-0136):
        1. Data consumer creates a PCF request via this consumption manager
        2. The request record is stored in the database with PENDING status
        3. The provider's connector endpoints are discovered via BPN
        4. For each connector, the SDK's ``do_get_by_dct_type()`` handles catalog
           filtering, contract negotiation, and GET request in a single call
        5. A notification is created for the outgoing request event
    """

    def __init__(
        self,
        notification_service: Optional[NotificationsManagementService] = None,
    ) -> None:
        """Initialize the consumption manager with notification service."""
        self._notification_service = notification_service or NotificationsManagementService()
        self._own_bpn = ConfigManager.get_config("bpn", default=None)

        # EDC connector services are imported lazily from the connector module
        # to avoid circular imports at module load time.
        self._connector_consumer_manager = None
        self._consumer_connector_service: Optional[BaseConnectorConsumerService] = None

    def send_pcf_request(
        self,
        manufacturer_part_id: Optional[str] = None,
        customer_part_id: Optional[str] = None,
        requesting_bpn: str = "",
        target_bpn: Optional[str] = None,
        message: Optional[str] = None,
        list_policies: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Create and send a new PCF request to a data provider.

        The request is stored locally in the database, then sent to the target
        provider through the EDC dataspace connector. The provider's
        ``footprintExchange/{requestId}`` endpoint is called via an EDC GET
        request after discovering the connector, browsing the catalog for a
        ``PcfExchange`` asset, and negotiating a contract.

        For synchronous data exchange (data pull), see PCF Standard CX-0136, chapter 5.2.

        Args:
            manufacturer_part_id: Manufacturer's part identifier.
            customer_part_id: Customer's part identifier.
            requesting_bpn: Business Partner Number of the requesting party.
            target_bpn: Business Partner Number of the target supplier.
            message: Optional message accompanying the request.

        Returns:
            Dictionary with the created request details.

        Raises:
            ValueError: If neither manufacturerPartId nor customerPartId is provided,
                        or if target_bpn is not specified, or if the EDC exchange fails.
        """
        if not manufacturer_part_id and not customer_part_id:
            raise ValueError("At least one of manufacturerPartId or customerPartId must be provided")

        if not target_bpn:
            raise ValueError("targetBpn is required to send a PCF request")

        request_id = str(uuid4())
        logger.info(f"Creating PCF request {request_id} from BPN {requesting_bpn} to BPN {target_bpn}")

        # Store the PCF request record in the metadata database
        self._store_request_record(
            request_id=request_id,
            requesting_bpn=requesting_bpn,
            responding_bpn=target_bpn,
            manufacturer_part_id=manufacturer_part_id,
            customer_part_id=customer_part_id,
            message=message,
        )

        # Send the PCF request to the target provider via EDC data plane
        self._send_pcf_request_via_edc(
            request_id=request_id,
            target_bpn=target_bpn,
            manufacturer_part_id=manufacturer_part_id,
            customer_part_id=customer_part_id,
            message=message,
            list_policies=list_policies,
        )

        # Create notification for the outgoing PCF request
        self._notify_pcf_request(
            request_id=request_id,
            requesting_bpn=requesting_bpn,
            target_bpn=target_bpn,
            message=message,
        )

        now = datetime.now(timezone.utc).isoformat()
        response_data = {
            "requestId": request_id,
            "manufacturerPartId": manufacturer_part_id,
            "customerPartId": customer_part_id,
            "requestingBpn": requesting_bpn,
            "targetBpn": target_bpn,
            "status": PcfExchangeStatus.PENDING.value,
            "createdAt": now,
            "message": message,
        }

        logger.info(f"PCF request {request_id} sent successfully to BPN {target_bpn}")
        return response_data

    def _store_request_record(
        self,
        request_id: str,
        requesting_bpn: str,
        responding_bpn: str,
        manufacturer_part_id: Optional[str] = None,
        customer_part_id: Optional[str] = None,
        message: Optional[str] = None,
    ) -> None:
        """
        Store the PCF request record in the metadata database with PENDING status.

        Args:
            request_id: Unique identifier for the PCF request.
            requesting_bpn: BPN of the requesting party (consumer).
            responding_bpn: BPN of the target provider.
            manufacturer_part_id: Manufacturer's part identifier.
            customer_part_id: Customer's part identifier.
            message: Optional message for the exchange record.

        Raises:
            ValueError: If storing the exchange record fails.
        """
        try:
            with RepositoryManagerFactory.create() as repo_manager:
                repo_manager.pcf_repository.create_new(
                    request_id=UUID(request_id),
                    direction=PcfExchangeDirection.OUTGOING,
                    status=PcfExchangeStatus.PENDING,
                    requesting_bpn=requesting_bpn,
                    responding_bpn=responding_bpn,
                    manufacturer_part_id=manufacturer_part_id,
                    customer_part_id=customer_part_id,
                    message=message,
                )
                logger.info(f"Created PCF exchange record for request {request_id} with status PENDING")
        except Exception as e:
            logger.error(f"Failed to store PCF request {request_id}: {str(e)}")
            raise ValueError(f"Failed to store PCF request: {str(e)}")

    def _get_connector_services(self):
        """
        Lazily import connector services to avoid circular imports at module load.

        Returns:
            Tuple of (connector_consumer_manager, consumer_connector_service).
        """
        if self._connector_consumer_manager is None:
            from connector import connector_consumer_manager, consumer_connector_service
            self._connector_consumer_manager = connector_consumer_manager
            self._consumer_connector_service = consumer_connector_service
        return self._connector_consumer_manager, self._consumer_connector_service

    def _send_pcf_request_via_edc(
        self,
        request_id: str,
        target_bpn: str,
        manufacturer_part_id: Optional[str] = None,
        customer_part_id: Optional[str] = None,
        message: Optional[str] = None,
        list_policies: Optional[List[Dict]] = None,
    ) -> None:
        """
        Send a PCF request to the data provider through the EDC dataspace connector.

        Uses the SDK's ``do_get_by_dct_type()`` which handles the full EDC flow
        (catalog filtering by dct_type → contract negotiation → EDR → HTTP GET)
        in a single call. Each discovered connector is tried until one succeeds.

        Args:
            request_id: The PCF request ID (used in the GET path).
            target_bpn: BPN of the target data provider.
            manufacturer_part_id: Manufacturer's part identifier (sent as query param).
            customer_part_id: Customer's part identifier (sent as query param).
            message: Optional message (sent as query param).

        Raises:
            ValueError: If no connectors are found or the data transfer fails
                        on all discovered connectors.
        """
        connector_consumer_manager, consumer_connector_service = self._get_connector_services()

        if not connector_consumer_manager or not consumer_connector_service:
            raise ValueError(
                "EDC connector services are not available. "
                "Cannot send PCF request via dataspace."
            )

        # Step 1: Discover connector endpoints for the target BPN
        logger.info(f"[PCF Consumption] Discovering connectors for BPN [{target_bpn}]")

        with RepositoryManagerFactory.create() as repos:
            remove_existing_edr(repos, target_bpn, "ichub:asset:pcf-exchange:%")

        connectors: List[str] = connector_consumer_manager.get_connectors(target_bpn)
        if not connectors:
            raise ValueError(
                f"No connector endpoints found for BPN [{target_bpn}]. "
                "Cannot send PCF request via EDC."
            )
        logger.info(
            f"[PCF Consumption] Found {len(connectors)} connector(s) for BPN [{target_bpn}]"
        )

        # Build query parameters per CX-0136 footprintExchange GET spec
        params: Dict[str, str] = {}
        if manufacturer_part_id:
            params["manufacturerPartId"] = manufacturer_part_id
        if customer_part_id:
            params["customerPartId"] = customer_part_id
        if message:
            params["message"] = quote(message, safe="")

        get_path = f"/{request_id}"

        # Step 2: Try each connector — do_get_by_dct_type handles catalog
        #         filtering, contract negotiation, and GET in a single call
        last_error: Optional[Exception] = None
        for connector_url in connectors:
            try:
                logger.info(
                    f"[PCF Consumption] Attempting do_get_by_dct_type on "
                    f"[{connector_url}] path=[{get_path}]"
                )
                response = consumer_connector_service.do_get_by_dct_type(
                    counter_party_id=target_bpn,
                    counter_party_address=connector_url,
                    dct_type=PCF_EXCHANGE_ASSET_TYPE,
                    policies=list_policies,
                    path=get_path,
                    params=params if params else None,
                )

                if response.status_code in (200, 202):
                    logger.info(
                        f"[PCF Consumption] PCF request sent successfully via EDC "
                        f"for request [{request_id}] (HTTP {response.status_code})"
                    )
                    self._update_status_to_delivered(request_id)
                    return

                logger.warning(
                    f"[PCF Consumption] EDC GET returned status "
                    f"{response.status_code} on [{connector_url}]: {response.text}"
                )
                last_error = ValueError(
                    f"EDC data transfer failed with status {response.status_code}"
                )

            except Exception as e:
                logger.warning(
                    f"[PCF Consumption] Failed on connector [{connector_url}]: {e}"
                )
                last_error = e

        raise ValueError(
            f"Failed to send PCF request via EDC to any connector for "
            f"BPN [{target_bpn}]: {last_error}"
        )

    def _update_status_to_delivered(self, request_id: str) -> None:
        """
        Update the PCF exchange record status from PENDING to DELIVERED after
        the request has been successfully transmitted via EDC.

        Args:
            request_id: The PCF request ID to update.
        """
        try:
            with RepositoryManagerFactory.create() as repo_manager:
                repo_manager.pcf_repository.update_status(
                    UUID(request_id), PcfExchangeStatus.DELIVERED
                )
                logger.info(f"Updated PCF exchange status to DELIVERED for request {request_id}")
        except Exception as e:
            # Status update failure should not block the main flow
            logger.error(f"Failed to update status to DELIVERED for request {request_id}: {str(e)}")

    def _notify_pcf_request(
        self,
        request_id: str,
        requesting_bpn: str,
        target_bpn: str,
        message: Optional[str] = None,
    ) -> None:
        """
        Create a notification for the outgoing PCF request event.

        Args:
            request_id: The request ID being sent.
            requesting_bpn: BPN of the requesting party.
            target_bpn: BPN of the target provider.
            message: Optional message for the notification.
        """
        if not self._own_bpn:
            logger.warning(
                f"Cannot create notification for PCF request {request_id}: "
                "bpn not configured in configuration.yml"
            )
            return

        try:
            notification_type = "PCF_REQUEST_SENT"
            default_message = f"PCF data request sent to {target_bpn}"
            context = f"IndustryCore-PCF-{notification_type}:1.0.0"

            header = NotificationHeader(
                message_id=uuid4(),
                context=context,
                sender_bpn=self._own_bpn,
                receiver_bpn=self._own_bpn,
            )

            content_data = {
                "notificationType": notification_type,
                "requestId": request_id,
                "requestingBpn": requesting_bpn,
                "targetBpn": target_bpn,
                "message": message or default_message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            content = NotificationContent(**content_data)

            notification = Notification(header=header, content=content)
            self._notification_service.create_notification(
                notification=notification,
                direction=NotificationDirection.OUTGOING,
                use_case=PCF,
            )

            logger.info(f"Created PCF notification for request {request_id}: type={notification_type}")

        except Exception as e:
            # Notification creation failure should not block the main flow
            logger.error(f"Failed to create PCF notification for request {request_id}: {str(e)}")


# Module-level singleton for convenience
consumption_manager = PcfConsumptionManager()

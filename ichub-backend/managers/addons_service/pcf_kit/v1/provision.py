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
PCF Provision Manager - Data Provider operations for PCF data exchange.

Reference:
    - CX-0136 PCF Exchange Standard
    - CX-0002 Digital Twins in Catena-X
"""

from typing import Dict, Any, List, Optional
from uuid import UUID, NAMESPACE_URL, uuid4, uuid5
from datetime import datetime, timezone

from tractusx_sdk.dataspace.services.connector import BaseConnectorConsumerService
from tractusx_sdk.extensions.notification_api.models import Notification, NotificationHeader, NotificationContent

from managers.config.log_manager import LoggingManager
from managers.config.config_manager import ConfigManager
from managers.enablement_services.submodel_service_manager import SubmodelServiceManager
from managers.metadata_database.manager import RepositoryManagerFactory
from models.metadata_database.pcf import PcfExchangeDirection, PcfExchangeStatus
from models.metadata_database.notification.models import NotificationDirection
from services.notifications.notifications_management_service import NotificationsManagementService
from tools.constants import PCF

logger = LoggingManager.get_logger(__name__)

# PCF semantic ID constant (Catena-X PCF aspect model v9.0.0)
PCF_SEMANTIC_ID = "urn:samm:io.catenax.pcf:9.0.0#Pcf"

# Asset type used to identify PCF exchange assets in EDC catalogs (CX-0136)
PCF_EXCHANGE_ASSET_TYPE = "https://w3id.org/catenax/taxonomy#PcfExchange"


def _pcf_submodel_id(manufacturer_part_id: str) -> UUID:
    """Derive a deterministic UUID for a manufacturer part ID.

    Uses UUID5 with NAMESPACE_URL so the same part always maps to the
    same submodel document in the submodel service.
    """
    return uuid5(NAMESPACE_URL, manufacturer_part_id)


class PcfProvisionManager:
    """
    Manages PCF provision operations for data providers.

    This manager handles:
    - Validating PCF data against the Catena-X schema
    - Storing PCF payloads in the submodel service
    - Tracking exchange status in the metadata database
    - Creating notifications for PCF response events
    - Sending PCF data to the requesting party via EDC (discovery, negotiation, transfer)

    PCF Response Flow (CX-0136):
        1. Data consumer sends a PCF request (handled by exchange manager)
        2. Data provider reviews the incoming request (via management endpoints)
        3. Data provider responds with PCF data via this provision manager
        4. The response is validated, stored locally, and sent via EDC
        5. The exchange status is updated in the database

    EDC Data Exchange Flow:
        1. Discover connector endpoints for the requesting BPN
        2. For each connector, the SDK's ``do_put()`` with a dct_type filter handles
           catalog filtering, contract negotiation, and PUT in a single call
        3. The PCF data is sent via EDC data plane PUT to ``/{requestId}``

    PCF Update Flow:
        Updates are ONLY feasible for PCF responses that have been previously
        delivered at least once. Proactive updates without a prior request are
        NOT achievable with the current Catena-X PCF specification version.
    """

    def __init__(
        self,
        submodel_service: Optional[SubmodelServiceManager] = None,
        notification_service: Optional[NotificationsManagementService] = None,
    ) -> None:
        """Initialize the provision manager with submodel and notification services."""
        self._submodel_service = submodel_service or SubmodelServiceManager()
        self._notification_service = notification_service or NotificationsManagementService()
        self._own_bpn = ConfigManager.get_config("bpn", default=None)

        # EDC connector services are imported lazily from the connector module
        # to avoid circular imports at module load time.
        self._connector_consumer_manager = None
        self._consumer_connector_service: Optional[BaseConnectorConsumerService] = None

    def send_or_update_pcf_response(
        self,
        request_id: str,
        responding_bpn: str,
        status: str = "delivered",
        message: Optional[str] = None,
        list_policies: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Send or update a PCF response for a given request.

        If the exchange record already has delivered/updated status, this is treated
        as an update. Otherwise, it is a first-time delivery.

        The PCF payload is always retrieved from the product-scoped store keyed
        by ``manufacturerPartId``.  This means the PCF document must have been
        uploaded beforehand (e.g. via the PCF store endpoint).

        For synchronous data exchange (data pull), see PCF Standard CX-0136, chapter 5.2.

        Args:
            request_id: The ID of the PCF request being responded to.
            responding_bpn: Business Partner Number of the responding party.
            status: Status of the response (default: delivered).
            message: Optional message accompanying the response.

        Returns:
            Dictionary with the response details and whether it was created or updated.

        Raises:
            ValueError: If the request is not found, no manufacturerPartId is
                        associated, or no PCF data exists for the product.
        """
        logger.info(f"Processing PCF provision response for request {request_id}")

        # Retrieve the exchange record to get the requesting BPN and manufacturer part ID
        exchange_entity = self._get_exchange_entity(request_id)
        is_update = exchange_entity is not None and exchange_entity.status in (
            PcfExchangeStatus.DELIVERED,
            PcfExchangeStatus.UPDATED,
        )

        manufacturer_part_id = (
            exchange_entity.manufacturer_part_id if exchange_entity else None
        )
        if not manufacturer_part_id:
            raise ValueError(
                f"No manufacturerPartId associated with request {request_id}. "
                "Cannot retrieve PCF data without a part identifier."
            )

        # Retrieve the PCF payload from the product-scoped store
        pcf_data = self._retrieve_pcf_data(manufacturer_part_id)
        if not pcf_data:
            raise ValueError(
                f"No PCF data found for manufacturerPartId [{manufacturer_part_id}]. "
                "Ensure a PCF has been stored before responding to a request."
            )
        logger.info(
            f"Retrieved PCF data for manufacturerPartId [{manufacturer_part_id}]"
        )

        # Send the PCF data to the requesting party via EDC data plane
        if exchange_entity and exchange_entity.requesting_bpn:
            self._send_pcf_via_edc(
                request_id=request_id,
                requesting_bpn=exchange_entity.requesting_bpn,
                pcf_data=pcf_data,
                is_update=is_update,
                manufacturer_part_id=manufacturer_part_id,
                list_policies=list_policies,
            )
        else:
            logger.warning(
                f"No requesting BPN found for request {request_id}. "
                "Skipping EDC data exchange — PCF data stored locally only."
            )

        # Create notification for the PCF response
        self._notify_pcf_response(request_id, responding_bpn, is_update, message)

        now = datetime.now(timezone.utc).isoformat()
        response_data = {
            "requestId": request_id,
            "respondingBpn": responding_bpn,
            "status": PcfExchangeStatus.UPDATED.value if is_update else PcfExchangeStatus.DELIVERED.value,
            "message": message,
            "isUpdate": is_update,
            "manufacturerPartId": manufacturer_part_id,
            "updatedAt": now,
        }

        logger.info(
            f"PCF response for request {request_id} "
            f"{'updated' if is_update else 'delivered'} successfully"
        )

        return response_data

    def _get_exchange_entity(self, request_id: str):
        """
        Retrieve the PCF exchange entity from the database.

        Args:
            request_id: The request ID to look up.

        Returns:
            The PcfExchangeEntity if found, otherwise None.
        """
        try:
            with RepositoryManagerFactory.create() as repo_manager:
                return repo_manager.pcf_repository.find_by_request_id(UUID(request_id))
        except Exception as e:
            logger.debug(f"Could not retrieve exchange record for request {request_id}: {str(e)}")
        return None

    def _retrieve_pcf_data(self, manufacturer_part_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a previously stored PCF document for a given manufacturer part.

        Args:
            manufacturer_part_id: The manufacturer part ID.

        Returns:
            The PCF payload if found, otherwise None.
        """
        submodel_id = _pcf_submodel_id(manufacturer_part_id)
        try:
            return self._submodel_service.get_twin_aspect_document(
                submodel_id=submodel_id,
                semantic_id=PCF_SEMANTIC_ID,
            )
        except Exception as e:
            logger.debug(
                f"No existing PCF found for manufacturerPartId "
                f"[{manufacturer_part_id}]: {e}"
            )
            return None

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

    def _send_pcf_via_edc(
        self,
        request_id: str,
        requesting_bpn: str,
        pcf_data: Dict[str, Any],
        is_update: bool = False,
        manufacturer_part_id: Optional[str] = None,
        list_policies: Optional[List[Dict]] = None,
    ) -> None:
        """
        Send PCF data to the requesting party through the EDC dataspace connector.

        Uses the SDK's ``do_put()`` with a ``PcfExchange`` dct_type filter
        expression, which handles the full EDC flow (catalog filtering →
        contract negotiation → EDR → HTTP PUT) in a single call.
        Each discovered connector is tried until one succeeds.

        Args:
            request_id: The PCF request ID (used as the PUT path).
            requesting_bpn: BPN of the party that requested the PCF data.
            pcf_data: The validated PCF payload to send.
            is_update: Whether this is an update to a previously delivered response.
            manufacturer_part_id: The manufacturer part ID (used for pcf_location).

        Raises:
            ValueError: If no connectors are found or the data transfer fails
                        on all discovered connectors.
        """
        connector_consumer_manager, consumer_connector_service = self._get_connector_services()

        if not connector_consumer_manager or not consumer_connector_service:
            raise ValueError(
                "EDC connector services are not available. "
                "Cannot send PCF data via dataspace."
            )

        # Step 1: Discover connector endpoints for the requesting BPN
        logger.info(f"[PCF Provision] Discovering connectors for BPN [{requesting_bpn}]")
        connectors: List[str] = connector_consumer_manager.get_connectors(requesting_bpn)
        if not connectors:
            raise ValueError(
                f"No connector endpoints found for BPN [{requesting_bpn}]. "
                "Cannot send PCF data via EDC."
            )
        logger.info(
            f"[PCF Provision] Found {len(connectors)} connector(s) for BPN [{requesting_bpn}]"
        )

        # Build the filter expression for PcfExchange asset type
        filter_expression = [
            consumer_connector_service.get_filter_expression(
                key=consumer_connector_service.DEFAULT_DCT_TYPE_KEY,
                operator="=",
                value=PCF_EXCHANGE_ASSET_TYPE,
            )
        ]

        put_path = f"/{request_id}"
        if is_update:
            put_path += "?update=true"

        # Step 2: Try each connector — do_put handles catalog filtering,
        #         contract negotiation, and PUT in a single call
        last_error: Optional[Exception] = None
        for connector_url in connectors:
            try:
                logger.info(
                    f"[PCF Provision] Attempting do_put on "
                    f"[{connector_url}] path=[{put_path}]"
                )
                response = consumer_connector_service.do_put(
                    counter_party_id=requesting_bpn,
                    counter_party_address=connector_url,
                    filter_expression=filter_expression,
                    path=put_path,
                    json=pcf_data,
                    policies=list_policies,
                )

                if response.status_code in (200, 201, 204):
                    logger.info(
                        f"[PCF Provision] PCF data sent successfully via EDC "
                        f"for request [{request_id}] (HTTP {response.status_code})"
                    )
                    self._update_exchange_record(
                        request_id, is_update, manufacturer_part_id=manufacturer_part_id
                    )
                    return

                logger.warning(
                    f"[PCF Provision] EDC PUT returned status "
                    f"{response.status_code} on [{connector_url}]: {response.text}"
                )
                last_error = ValueError(
                    f"EDC data transfer failed with status {response.status_code}"
                )

            except Exception as e:
                logger.warning(
                    f"[PCF Provision] Failed on connector [{connector_url}]: {e}"
                )
                last_error = e

        raise ValueError(
            f"Failed to send PCF data via EDC to any connector for "
            f"BPN [{requesting_bpn}]: {last_error}"
        )

    def _update_exchange_record(
        self,
        request_id: str,
        is_update: bool,
        message: Optional[str] = None,
        manufacturer_part_id: Optional[str] = None,
    ) -> None:
        """
        Update the PCF exchange record in the metadata database.

        For first-time deliveries, the PCF location and DELIVERED status are set.
        The ``pcf_location`` points to the submodel document keyed by
        ``manufacturer_part_id`` so that all exchanges for the same product
        share the same PCF payload reference.
        For updates, only the status is changed to UPDATED.

        Args:
            request_id: The request ID of the exchange.
            is_update: Whether this is an update to a previously delivered response.
            message: Optional message for the exchange record.
            manufacturer_part_id: The manufacturer part ID (used in pcf_location).

        Raises:
            ValueError: If the exchange record is not found or the update fails.
        """
        try:
            with RepositoryManagerFactory.create() as repo_manager:
                entity = repo_manager.pcf_repository.find_by_request_id(UUID(request_id))

                if not entity:
                    logger.warning(
                        f"No exchange record found for request {request_id}. "
                        "The request may not have been received through the exchange endpoint."
                    )
                    return

                if is_update:
                    repo_manager.pcf_repository.update_status(
                        UUID(request_id), PcfExchangeStatus.UPDATED, message
                    )
                    logger.info(f"Updated PCF exchange status to UPDATED for request {request_id}")
                else:
                    pcf_location = f"submodel://{PCF_SEMANTIC_ID}/{manufacturer_part_id}"
                    repo_manager.pcf_repository.update_pcf_location(UUID(request_id), pcf_location)
                    repo_manager.pcf_repository.update_status(
                        UUID(request_id), PcfExchangeStatus.DELIVERED, message
                    )
                    logger.info(
                        f"PCF exchange {request_id} marked as DELIVERED "
                        f"with location: {pcf_location}"
                    )

        except Exception as e:
            logger.error(f"Failed to update exchange record for request {request_id}: {str(e)}")
            raise ValueError(f"Failed to update exchange record: {str(e)}")

    def _notify_pcf_response(
        self,
        request_id: str,
        responding_bpn: str,
        is_update: bool,
        message: Optional[str] = None,
    ) -> None:
        """
        Create a notification for the PCF response event.

        Args:
            request_id: The request ID being responded to.
            responding_bpn: BPN of the responding party.
            is_update: Whether this is an update notification.
            message: Optional message for the notification.
        """
        if not self._own_bpn:
            logger.warning(
                f"Cannot create notification for PCF response {request_id}: "
                "bpn not configured in configuration.yml"
            )
            return

        try:
            notification_type = "PCF_RESPONSE_SENT" if not is_update else "PCF_UPDATE_SENT"
            default_message = (
                f"PCF data update sent by {responding_bpn}" if is_update
                else f"PCF data response sent by {responding_bpn}"
            )
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
                "respondingBpn": responding_bpn,
                "isUpdate": is_update,
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

            logger.info(f"Created PCF notification for response {request_id}: type={notification_type}")

        except Exception as e:
            # Notification creation failure should not block the main flow
            logger.error(f"Failed to create PCF notification for response {request_id}: {str(e)}")


# Module-level singleton for convenience
provision_manager = PcfProvisionManager()

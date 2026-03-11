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
PCF Exchange Manager - EDC-level operations for PCF data exchange.

Reference:
    - CX-0136 PCF Exchange Standard
    - CX-0002 Digital Twins in Catena-X
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
from uuid import UUID, NAMESPACE_URL, uuid5
from tractusx_sdk.dataspace.tools.validate_submodels import submodel_schema_finder

from managers.addons_service.pcf_kit.v1.notifications import pcf_notification_manager
from managers.config.log_manager import LoggingManager
from managers.config.config_manager import ConfigManager
from managers.enablement_services.submodel_service_manager import SubmodelServiceManager
from managers.metadata_database.manager import RepositoryManagerFactory
from models.metadata_database.pcf import PcfExchangeDirection, PcfExchangeStatus
from tools.json_validator import json_validator_draft_aware

logger = LoggingManager.get_logger(__name__)

# PCF semantic ID constant (Catena-X PCF aspect model v9.0.0)
PCF_SEMANTIC_ID = "urn:samm:io.catenax.pcf:9.0.0#Pcf"


def _pcf_submodel_id(manufacturer_part_id: str) -> UUID:
    """Derive a deterministic UUID for a manufacturer part ID.

    Uses UUID5 with NAMESPACE_URL so the same part always maps to the
    same submodel document in the submodel service.
    """
    return uuid5(NAMESPACE_URL, manufacturer_part_id)


class PcfExchangeManager:
    """
    Manages PCF (Product Carbon Footprint) Data Exchange operations.
    
    This manager handles the storage, retrieval, and exchange of PCF data
    between business partners via EDC.
    """

    def __init__(
        self,
        submodel_service: Optional[SubmodelServiceManager] = None
    ) -> None:
        """Initialize the exchange manager with the submodel service."""
        self._submodel_service = submodel_service or SubmodelServiceManager()
        self._own_bpn = ConfigManager.get_config("bpn", default=None)



    def request_pcf(
        self,
        request_id: str,
        edc_bpn: str,
        manufacturer_part_id: Optional[str] = None,
        customer_part_id: Optional[str] = None,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Receive a PCF data request from a data consumer via EDC data plane.
        
        This endpoint is called when a data consumer requests the PCF submodel
        of a serialized part. The edc_bpn is automatically set by EDC during
        the data transfer.
        
        Flow:
            1. Validate input parameters
            2. Store PCF request record in database with PENDING status
            3. Create a notification informing about the incoming PCF request
            4. Return confirmation (actual PCF data exchange happens asynchronously)
        
        Args:
            request_id: Unique identifier for the PCF request
            edc_bpn: Business Partner Number of the requesting party (set by EDC)
            manufacturer_part_id: Manufacturer's part identifier
            customer_part_id: Customer's part identifier  
            message: Optional message accompanying the request
            
        Returns:
            Dict containing request confirmation details
            
        Raises:
            ValueError: If neither manufacturerPartId nor customerPartId is provided
            ValueError: If storing the request fails
        """
        if not manufacturer_part_id and not customer_part_id:
            raise ValueError("At least one of manufacturerPartId or customerPartId must be provided")
        
        logger.info(f"Processing PCF request {request_id} from BPN {edc_bpn}")
        
        try:
            # Store PCF request in database
            with RepositoryManagerFactory.create() as repo_manager:
                # Create new PCF exchange record with PENDING status
                repo_manager.pcf_repository.create_new(
                    request_id=UUID(request_id),
                    direction=PcfExchangeDirection.INCOMING,
                    status=PcfExchangeStatus.PENDING,
                    requesting_bpn=edc_bpn,
                    responding_bpn=self._own_bpn,
                    manufacturer_part_id=manufacturer_part_id,
                    customer_part_id=customer_part_id,
                    message=message
                )
                logger.info(f"Created PCF exchange record for request {request_id} with status PENDING")
                
        except Exception as e:
            logger.error(f"Failed to store PCF request {request_id}: {str(e)}")
            raise ValueError(f"Failed to store PCF request: {str(e)}")
        
        # Create notification for the incoming PCF request
        if self._own_bpn:
            pcf_notification_manager.create_pcf_notification(
                sender_bpn=edc_bpn,
                receiver_bpn=self._own_bpn,
                notification_type="PCF_REQUEST_RECEIVED",
                request_id=request_id,
                manufacturer_part_id=manufacturer_part_id,
                customer_part_id=customer_part_id,
                message=message or f"PCF data request received from {edc_bpn}"
            )
        else:
            logger.warning(
                f"Cannot create notification for PCF request {request_id}: "
                "bpn not configured in configuration.yml"
            )
        
        logger.info(f"PCF request {request_id} created successfully")
        
        return {
            "status": "PCF request received",
            "requestId": request_id,
            "manufacturerPartId": manufacturer_part_id,
            "customerPartId": customer_part_id,
            "message": "Request stored. PCF data will be provided after approval."
        }

    def submit_pcf_response(
        self,
        request_id: str,
        pcf_data: Dict[str, Any],
        edc_bpn: str,
        is_update: bool = False,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Receive PCF response or update via EDC data plane.
        
        This endpoint handles incoming PCF data from data providers, either as
        a response to an existing request or as an update to previously shared
        data. The edc_bpn is automatically set by EDC during the data transfer.
        
        Implement Production Flow:
            1. Validate PCF data against Catena-X schema
            2. Store PCF data in database
            3. Update request status
            4. Create notification informing about the received PCF data:
               - If is_update=False: notification text for "new PCF response received"
               - If is_update=True: notification text for "PCF data update received"
            5. Log data exchange for compliance
        
        Args:
            request_id: ID of the PCF request being responded to
            pcf_data: PCF data payload (should match Catena-X PCF schema)
            edc_bpn: Business Partner Number of the responding party (set by EDC)
            is_update: Whether this is an update to existing data
            message: Optional message accompanying the response
            
        Returns:
            Dict containing response confirmation details
            
        Raises:
            ValueError: If PCF data validation fails
        """
        logger.info(
            f"Processing PCF {'update' if is_update else 'response'} "
            f"for request {request_id} from BPN {edc_bpn}"
        )
        
        # Validate PCF data structure (basic validation)
        if not pcf_data:
            raise ValueError("PCF data cannot be empty")
        
        try:
            # submodel_schema_finder returns {'status': ..., 'schema': <actual_schema>}
            pcf_schema_result = submodel_schema_finder("urn:samm:io.catenax.pcf:9.0.0#Pcf")
            # Use draft-aware validator (PCF schema uses Draft-04, not Draft-07)
            json_validator_draft_aware(pcf_schema_result['schema'], pcf_data)
            logger.info(f"PCF data for request {request_id} validated successfully against schema")
        except Exception as e:
            logger.error(f"PCF data validation failed for request {request_id}: {str(e)}")
            raise ValueError(f"PCF data validation failed: {str(e)}")
        

        try:
            self._store_and_update_pcf(request_id, pcf_data, is_update)
        except Exception as e:
            logger.error(f"Failed to store PCF data for request {request_id}: {str(e)}")
            raise ValueError(f"Failed to store PCF data: {str(e)}")
        
        # Create notification for the received PCF data
        if self._own_bpn:
            notification_type = "PCF_DATA_UPDATE_RECEIVED" if is_update else "PCF_RESPONSE_RECEIVED"
            notification_message = (
                f"PCF data update received from {edc_bpn}" if is_update 
                else f"PCF data response received from {edc_bpn}"
            )
            pcf_notification_manager.create_pcf_notification(
                sender_bpn=edc_bpn,
                receiver_bpn=self._own_bpn,
                notification_type=notification_type,
                request_id=request_id,
                message=message or notification_message,
                is_update=is_update
            )
        else:
            logger.warning(
                f"Cannot create notification for PCF response {request_id}: "
                "bpn not configured in configuration.yml"
            )

        logger.info(f"PCF data for request {request_id} processed successfully")
        
        return {
            "status": "PCF data received successfully",
            "requestId": request_id,
            "isUpdate": is_update
        }

    def _store_and_update_pcf(
        self,
        request_id: str,
        pcf_data: Dict[str, Any],
        is_update: bool,
    ) -> None:
        """
        Store the PCF payload in the submodel service and update the exchange
        record status.

        The payload is keyed by ``manufacturer_part_id`` (product-scoped).

        Args:
            request_id: The PCF request ID.
            pcf_data: The validated PCF payload.
            is_update: Whether this is an update to previously shared data.
        """
        with RepositoryManagerFactory.create() as repo_manager:
            entity = repo_manager.pcf_repository.find_by_request_id(UUID(request_id))

        if not entity or not entity.manufacturer_part_id:
            raise ValueError(
                f"No manufacturerPartId found for request {request_id}. "
                "Cannot store PCF data without a part identifier."
            )

        manufacturer_part_id = entity.manufacturer_part_id
        submodel_id = _pcf_submodel_id(manufacturer_part_id)
        pcf_location = f"submodel://{PCF_SEMANTIC_ID}/{manufacturer_part_id}"

        logger.info(
            f"Storing PCF data for request {request_id} "
            f"(submodel_id={submodel_id})"
        )
        self._submodel_service.upload_twin_aspect_document(
            submodel_id=submodel_id,
            semantic_id=PCF_SEMANTIC_ID,
            payload=pcf_data,
        )

        with RepositoryManagerFactory.create() as repo_manager:
            if is_update:
                repo_manager.pcf_repository.update_status(
                    request_id, PcfExchangeStatus.UPDATED
                )
                logger.info(f"Updated PCF exchange status to UPDATED for request {request_id}")
            else:
                repo_manager.pcf_repository.update_pcf_location(request_id, pcf_location)
                logger.info(f"Stored PCF data location for request {request_id}: {pcf_location}")
                repo_manager.pcf_repository.update_status(
                    request_id, PcfExchangeStatus.DELIVERED
                )
                logger.info(f"Updated PCF exchange status to DELIVERED for request {request_id}")


# Module-level singleton for convenience
exchange_manager = PcfExchangeManager()

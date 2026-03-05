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

from managers.config.log_manager import LoggingManager
from managers.enablement_services.submodel_service_manager import SubmodelServiceManager

logger = LoggingManager.get_logger(__name__)


class PcfExchangeManager:
    """
    Manages PCF (Product Carbon Footprint) Data Exchange operations.
    
    This manager handles the storage, retrieval, and exchange of PCF data
    between business partners via EDC.
    """

    def __init__(self, submodel_service: Optional[SubmodelServiceManager] = None) -> None:
        """Initialize the exchange manager with submodel service."""
        self._submodel_service = submodel_service or SubmodelServiceManager()

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
        
        TODO: Implement Production Flow:
            1. Create a notification informing about the incoming PCF request
            2. Check if the requesting participant (edc_bpn) is already allowed
               to consume this PCF data
            3. If allowed: automatically send the PCF response back to consumer
            4. If not allowed: wait for admin decision via the notification system (Another endpoint will handle this)
               - Admin can approve/reject the request
               - On approval, send PCF response to consumer
        
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
        """
        if not manufacturer_part_id and not customer_part_id:
            raise ValueError("At least one of manufacturerPartId or customerPartId must be provided")
        
        logger.info(f"Processing PCF request {request_id} from BPN {edc_bpn}")
        
        # Create request record
        request_data = {
            "requestId": request_id,
            "manufacturerPartId": manufacturer_part_id,
            "customerPartId": customer_part_id,
            "requestingBpn": edc_bpn,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "message": message
        }
        
        # TODO: Store request in submodel service
        # self._submodel_service.upload_twin_aspect_document(
        #     submodel_id=uuid.UUID(request_id),
        #     semantic_id="urn:samm:io.catenax.pcf:request",
        #     payload=request_data
        # )
        
        # TODO: Production implementation should:
        # 1. Create notification for the incoming PCF request
        # 2. Check if edc_bpn is pre-approved for this data
        # 3. If approved: fetch PCF data and send response automatically
        # 4. If not approved: await admin decision via notification
        
        logger.info(f"PCF request {request_id} created successfully")
        
        return {
            "status": "PCF request initiated",
            "requestId": request_id,
            "manufacturerPartId": manufacturer_part_id,
            "customerPartId": customer_part_id,
            "message": "Request will be processed asynchronously via EDC"
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
        
        TODO: Implement Production Flow:
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
        
        # Production implementation should:
        # 1. Validate PCF data against Catena-X schema
        # 2. Store PCF data in database
        # 3. Update request status
        # 4. Trigger notifications if needed
        # 5. Log data exchange for compliance
        
        # Store response in mock storage
        response_data = {
            "requestId": request_id,
            "pcfData": pcf_data,
            "respondingBpn": edc_bpn,
            "isUpdate": is_update,
            "message": message,
            "receivedAt": datetime.now(timezone.utc).isoformat()
        }
        
        # TODO: Store response in submodel service
        # self._submodel_service.upload_twin_aspect_document(
        #     submodel_id=uuid.UUID(request_id),
        #     semantic_id="urn:samm:io.catenax.pcf:response",
        #     payload=response_data
        # )
        
        # TODO: Update request status if exists (via submodel service)
        # try:
        #     request_data = self._submodel_service.get_twin_aspect_document(...)
        #     request_data["status"] = "completed"
        #     self._submodel_service.upload_twin_aspect_document(...)
        #     logger.info(f"Updated request {request_id} status to completed")
        # except NotFoundError:
        #     pass
        
        logger.info(f"PCF data for request {request_id} processed successfully")
        
        return {
            "status": "PCF data received successfully",
            "requestId": request_id,
            "isUpdate": is_update
        }

# Module-level singleton for convenience
exchange_manager = PcfExchangeManager()

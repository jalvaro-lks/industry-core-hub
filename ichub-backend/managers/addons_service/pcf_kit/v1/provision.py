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

from typing import Dict, Any, Optional
from datetime import datetime, timezone

from managers.config.log_manager import LoggingManager
from managers.enablement_services.submodel_service_manager import SubmodelServiceManager

logger = LoggingManager.get_logger(__name__)


class PcfProvisionManager:
    """
    Manages PCF provision operations for data providers.

    This manager handles sending PCF responses to data consumers.
    """

    def __init__(self, submodel_service: Optional[SubmodelServiceManager] = None) -> None:
        """Initialize the provision manager with submodel service."""
        self._submodel_service = submodel_service or SubmodelServiceManager()

    def send_or_update_pcf_response(
        self,
        request_id: str,
        pcf_data: Dict[str, Any],
        responding_bpn: str,
        status: str = "delivered",
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send or update a PCF response for a given request.

        If a response for the request_id already exists, it will be updated.
        Otherwise, a new response will be created.

        TODO: Implement PCF Response Flow (CX-0136):
            1. Receive PCF request from data consumer via EDC (footprintExchange endpoint)
            2. Data provider processes the request and prepares PCF data
            3. Send PCF response back to the consumer via EDC

        TODO: Implement PCF Update Flow:
            - Updates are ONLY feasible for PCF responses that have been previously
              requested at least once (see PCF Request flow)
            - Proactive updates without a prior request are NOT achievable with the
              current Catena-X PCF specification version
            - The update flag indicates this is a modification to previously shared data

        For synchronous data exchange (data pull), see PCF Standard CX-0136, chapter 5.2.

        Args:
            request_id: The ID of the PCF request being responded to.
            pcf_data: PCF data payload matching the Catena-X PCF aspect model.
            responding_bpn: Business Partner Number of the responding party.
            status: Status of the response (default: delivered).
            message: Optional message accompanying the response.

        Returns:
            Dictionary with the response details and whether it was created or updated.
        """
        # TODO: Check if response exists in submodel service
        # try:
        #     existing = self._submodel_service.get_twin_aspect_document(...)
        #     is_update = True
        # except NotFoundError:
        #     is_update = False
        is_update = False
        now = datetime.now(timezone.utc).isoformat()

        if is_update:
            logger.info(f"Updating PCF response for request {request_id}")
            # TODO: Update response in submodel service
            response_data = {
                "requestId": request_id,
                "pcfData": pcf_data,
                "respondingBpn": responding_bpn,
                "status": status,
                "message": message,
                "updatedAt": now,
            }
        else:
            logger.info(f"Creating PCF response for request {request_id}")
            response_data = {
                "requestId": request_id,
                "pcfData": pcf_data,
                "respondingBpn": responding_bpn,
                "status": status,
                "message": message,
                "createdAt": now,
                "updatedAt": now,
            }
            # TODO: Store response in submodel service
            # self._submodel_service.upload_twin_aspect_document(...)

        # TODO: Update associated request status to completed if exists
        # Use submodel service to update the request status

        logger.info(f"PCF response for request {request_id} {'updated' if is_update else 'created'} successfully")

        return {
            **response_data,
            "isUpdate": is_update,
        }


provision_manager = PcfProvisionManager()

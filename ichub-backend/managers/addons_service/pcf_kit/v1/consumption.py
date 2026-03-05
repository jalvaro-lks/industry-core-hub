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

from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from managers.config.log_manager import LoggingManager
from managers.enablement_services.submodel_service_manager import SubmodelServiceManager

logger = LoggingManager.get_logger(__name__)


class PcfConsumptionManager:
    """
    Manages PCF consumption operations for data consumers.

    This manager handles sending PCF requests to data providers.
    """

    def __init__(self, submodel_service: Optional[SubmodelServiceManager] = None) -> None:
        """Initialize the consumption manager with submodel service."""
        self._submodel_service = submodel_service or SubmodelServiceManager()

    def send_pcf_request(
        self,
        manufacturer_part_id: Optional[str] = None,
        customer_part_id: Optional[str] = None,
        requesting_bpn: str = "",
        target_bpn: Optional[str] = None,
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create and send a new PCF request to a data provider.

        TODO: Implement PCF Request Flow (CX-0136):
            1. Identify the EDC PCF asset via the decentralized Digital Twin Registry (dDTR)
            2. Data providers register their dDTR(s) as EDC assets per CX-0002 standard
            3. Look up the digital twin with the related PCF submodel
            4. Extract the EDC asset containing the PCF request endpoint from the submodel
            5. Initiate the PCF data query via EDC

        TODO: Implement Fallback Flow:
            If no matching material twin or PCF submodel exists, fall back to
            a direct lookup of an EDC asset containing the PCF request endpoint
            from the EDC catalog of the data provider's BPNL.

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
            ValueError: If neither manufacturerPartId nor customerPartId is provided.
        """
        if not manufacturer_part_id and not customer_part_id:
            raise ValueError("At least one of manufacturerPartId or customerPartId must be provided")

        request_id = str(uuid.uuid4())
        logger.info(f"Creating PCF request {request_id} from BPN {requesting_bpn}")

        request_data = {
            "requestId": request_id,
            "manufacturerPartId": manufacturer_part_id,
            "customerPartId": customer_part_id,
            "requestingBpn": requesting_bpn,
            "targetBpn": target_bpn,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "message": message,
        }

        # TODO: Store request in submodel service
        # self._submodel_service.upload_twin_aspect_document(
        #     submodel_id=uuid.UUID(request_id),
        #     semantic_id="urn:samm:io.catenax.pcf:request",
        #     payload=request_data
        # )
        logger.info(f"PCF request {request_id} created successfully")

        return request_data


consumption_manager = PcfConsumptionManager()

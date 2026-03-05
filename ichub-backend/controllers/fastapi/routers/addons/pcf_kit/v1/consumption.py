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

"""PCF Consumption API - Data Consumer endpoints for requesting PCF data."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from controllers.fastapi.routers.authentication.auth_api import get_authentication_dependency
from managers.addons_service.pcf_kit.v1 import consumption_manager
from models.services.addons.pcf_kit.v1.management import SendPcfRequestModel


router = APIRouter(
    prefix="/consumption",
    tags=["PCF KIT Microservices"],
    dependencies=[Depends(get_authentication_dependency())],
)


@router.post("/requests")
async def send_pcf_request(body: SendPcfRequestModel):
    """
    Send a new PCF request to a data provider.

    Initiates a PCF data exchange as a data consumer. At least one of
    manufacturerPartId or customerPartId must be provided.
    """
    try:
        result = consumption_manager.send_pcf_request(
            manufacturer_part_id=body.manufacturer_part_id,
            customer_part_id=body.customer_part_id,
            requesting_bpn=body.requesting_bpn,
            target_bpn=body.target_bpn,
            message=body.message,
        )
        return JSONResponse(status_code=201, content=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating PCF request: {str(e)}")

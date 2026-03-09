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

"""PCF Provision API - Data Provider endpoints for responding to PCF requests."""

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import JSONResponse

from controllers.fastapi.routers.authentication.auth_api import get_authentication_dependency
from managers.addons_service.pcf_kit.v1 import provision_manager
from models.services.addons.pcf_kit.v1.management import SendOrUpdatePcfResponseModel


router = APIRouter(
    prefix="/provision",
    tags=["PCF KIT Microservices"],
    dependencies=[Depends(get_authentication_dependency())],
)


@router.put("/responses/{requestId}")
async def send_or_update_pcf_response(
    body: SendOrUpdatePcfResponseModel,
    request_id: str = Path(..., alias="requestId"),
):
    """
    Send or update a PCF response as a data provider.

    Responds to PCF data requests from data consumers. Supports both initial
    responses (201) and updates to previously shared data (200).
    """
    try:
        result = provision_manager.send_or_update_pcf_response(
            request_id=request_id,
            responding_bpn=body.responding_bpn,
            status=body.status.value if body.status else "delivered",
            message=body.message,
        )
        status_code = 200 if result.get("isUpdate") else 201
        return JSONResponse(status_code=status_code, content=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Bad Request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending/updating PCF response: {str(e)}")

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

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from controllers.fastapi.routers.authentication.auth_api import get_authentication_dependency
from managers.addons_service.pcf_kit.v1 import management_manager


router = APIRouter(
    tags=["PCF KIT Microservices"],
    dependencies=[Depends(get_authentication_dependency())],
)


@router.get("/management/requests")
async def get_all_pcf_requests(
    status: Optional[str] = Query(None, description="Filter by request status (e.g., pending, completed)"),
    manufacturer_part_id: Optional[str] = Query(None, alias="manufacturerPartId", description="Filter by manufacturer part ID"),
    customer_part_id: Optional[str] = Query(None, alias="customerPartId", description="Filter by customer part ID"),
    requesting_bpn: Optional[str] = Query(None, alias="requestingBpn", description="Filter by requesting BPN"),
):
    """Retrieve all PCF requests from the management service with optional filters."""
    try:
        return management_manager.get_all_requests(
            status=status,
            manufacturer_part_id=manufacturer_part_id,
            customer_part_id=customer_part_id,
            requesting_bpn=requesting_bpn,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving PCF requests: {str(e)}")


@router.get("/management/responses")
async def get_all_pcf_responses(
    status: Optional[str] = Query(None, description="Filter by response status"),
    request_id: Optional[str] = Query(None, alias="requestId", description="Filter by associated request ID"),
):
    """Retrieve all PCF responses from the management service with optional filters."""
    try:
        return management_manager.get_all_responses(
            status=status,
            request_id=request_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving PCF responses: {str(e)}")


@router.get("/management/requests/{requestId}")
async def get_pcf_request_by_id(request_id: str = Path(..., alias="requestId")):
    """Retrieve a single PCF request by ID from the management service."""
    try:
        request_data = management_manager.get_pcf_request(request_id)
        if not request_data:
            raise HTTPException(status_code=404, detail=f"PCF request '{request_id}' not found")
        return request_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving PCF request: {str(e)}")


@router.get("/management/responses/{requestId}")
async def get_pcf_response_by_id(request_id: str = Path(..., alias="requestId")):
    """Retrieve a single PCF response by request ID from the management service."""
    try:
        response_data = management_manager.get_pcf_response(request_id)
        if not response_data:
            raise HTTPException(status_code=404, detail=f"PCF response for '{request_id}' not found")
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving PCF response: {str(e)}")

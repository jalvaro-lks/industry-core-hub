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

"""PCF Exchange API - EDC-level endpoints for PCF data exchange."""

from typing import Optional
from fastapi import APIRouter, Depends, Header, Query, HTTPException, Path
from fastapi.responses import JSONResponse

from controllers.fastapi.routers.authentication.auth_api import get_authentication_dependency
from managers.addons_service.pcf_kit.v1 import exchange_manager

router = APIRouter(
    prefix="/footprintExchange",
    tags=["PCF KIT Microservices"],
    dependencies=[Depends(get_authentication_dependency())]
)


EDC_BPN_DESCRIPTION = "The caller's Catena-X BusinessPartnerNumber"
MESSAGE_DESCRIPTION = "URL encoded, max 250 chars"


@router.put("/{requestId}")
async def put_pcf_with_path_id(
    body: dict,
    request_id: str = Path(..., alias="requestId"),
    edc_bpn: str = Header(..., description=EDC_BPN_DESCRIPTION),
    message: Optional[str] = Query(None, description=MESSAGE_DESCRIPTION),
    update: bool = Query(False, description="Whether this is an update to an existing request")
):
    """
    PCF Response / Update endpoint.

    This endpoint accepts PCF data as a response to an open request or as an update
    to an existing request. The PCF data should match the Catena-X aspect model
    urn:samm:io.catenax.pcf:9.0.0#Pcf.

    Args:
        request_id: The ID of the footprint request or response
        body: PCF data matching the Catena-X PCF aspect model (9.0.0)
        edc_bpn: The caller's Catena-X BusinessPartnerNumber (automatically set by EDC)
        message: Optional URL encoded message (max 250 chars)
        update: Whether this is an update to an existing request (default: False)

    Returns:
        JSONResponse with status code 200 for success

    Raises:
        HTTPException: 400 for bad request
    """
    try:
        # Delegate to manager to handle PCF response/update
        result = exchange_manager.submit_pcf_response(
            request_id=request_id,
            pcf_data=body,
            edc_bpn=edc_bpn,
            is_update=update,
            message=message
        )
        
        return JSONResponse(
            status_code=200,
            content=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Bad Request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/{requestId}")
async def request_pcf(
    request_id: str = Path(..., alias="requestId"),
    edc_bpn: str = Header(..., description=EDC_BPN_DESCRIPTION),
    manufacturer_part_id: Optional[str] = Query(None, description="Manufacturer part ID"),
    customer_part_id: Optional[str] = Query(None, description="Customer part ID"),
    message: Optional[str] = Query(None, description=MESSAGE_DESCRIPTION)
):
    """
    PCF Request endpoint.

    Request a footprint for a product. At least one of manufacturerPartId or 
    customerPartId must be provided. This initiates an asynchronous PCF data 
    exchange with the supplier.

    Args:
        request_id: The ID of the footprint request
        edc_bpn: The caller's Catena-X BusinessPartnerNumber (automatically set by EDC)
        manufacturer_part_id: Manufacturer's part identifier
        customer_part_id: Customer's part identifier
        message: Optional URL encoded message (max 250 chars)

    Returns:
        JSONResponse with status code 200 for success

    Raises:
        HTTPException: 400 if both IDs are missing, 404 if request not found
    """
    # Validate that at least one part ID is provided
    if not manufacturer_part_id and not customer_part_id:
        raise HTTPException(
            status_code=400,
            detail="At least one of manufacturerPartId or customerPartId must be provided"
        )

    try:
        # Delegate to manager to handle PCF request
        result = exchange_manager.request_pcf(
            request_id=request_id,
            edc_bpn=edc_bpn,
            manufacturer_part_id=manufacturer_part_id,
            customer_part_id=customer_part_id,
            message=message
        )
        
        return JSONResponse(
            status_code=202,
            content=result
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Bad Request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

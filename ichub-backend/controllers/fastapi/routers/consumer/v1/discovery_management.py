#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 Contributors to the Eclipse Foundation
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

from fastapi import APIRouter, Body, Header
from fastapi import Depends
from connector import connector_manager
import json

from requests import Session

from fastapi.responses import Response
from tractusx_sdk.dataspace.tools.http_tools import HttpTools
#from services.consumer import ConnectionService
from models.services.consumer.discovery_management import (
    DiscoverRegistriesRequest,
    DiscoverShellsRequest,
    DiscoverShellRequest
)

from typing import Optional, List
from tools.exceptions import exception_responses
router = APIRouter(prefix="/discover", tags=["Part Discovery Management"])
#connection_service = ConnectionService()

from dtr import dtr_manager


@router.get("/registries")
async def discover_registries(request: DiscoverRegistriesRequest) -> Response:
    ## Check if the api key is present and if it is authenticated
    return dtr_manager.consumer.get_dtrs(bpn=request.counter_party_id)

@router.post("/shells")
async def discover_shells(search_request: DiscoverShellsRequest) -> Response:
    """
    Discover digital twin shells using query specifications.
    
    This endpoint discovers available DTRs for the given BPN, negotiates access,
    and searches for shells matching the provided query specifications using
    the /lookup/shellsByAssetLink API.
    
    Args:
        search_request: Request containing counter_party_id (BPN) and query_spec
        
    Returns:
        Response containing discovered shells and metadata
    """
    # Convert query_spec from Pydantic models to JSON serializable format
    query_spec_dict = [
        {"name": spec.name, "value": spec.value} 
        for spec in search_request.query_spec
    ]
    
    # Call the DTR manager's discover_shells method
    result = dtr_manager.consumer.discover_shells(
        counter_party_id=search_request.counter_party_id, 
        query_spec=query_spec_dict,
        limit=search_request.limit,
        cursor=search_request.cursor
    )
    
    # Return the response as JSON
    return Response(
        content=json.dumps(result, indent=2),
        media_type="application/json",
        status_code=200
    )
    
@router.post("/shell")
async def discover_shell(search_request: DiscoverShellRequest) -> Response:
    """
    Discover digital twin shells using query specifications.
    
    This endpoint discovers available DTRs for the given BPN, negotiates access,
    and searches for shells matching the provided query specifications using
    the /lookup/shellsByAssetLink API.
    
    Args:
        search_request: Request containing counter_party_id (BPN) and query_spec
        
    Returns:
        Response containing discovered shells and metadata
    """
    
    # Call the DTR manager's discover_shells method
    result = dtr_manager.consumer.discover_shell(
        counter_party_id=search_request.counter_party_id, 
        id=search_request.id
    )
    
    # Return the response as JSON
    return Response(
        content=json.dumps(result, indent=2),
        media_type="application/json",
        status_code=200
    )
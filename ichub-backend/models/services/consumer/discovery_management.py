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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

from pydantic import BaseModel, Field

from typing import List, Optional, Any, Dict

class DiscoverRegistriesRequest(BaseModel):
    counter_party_id: str = Field(alias="counterPartyId", description="The counter party ID of the part.")


class DiscoverShellRequest(DiscoverRegistriesRequest):
    id: str = Field(alias="id", description="The ID of the AAS.")


class QuerySpec(BaseModel):
    name: str = Field(..., description="The name of the query specification.")
    value: str = Field(..., description="The value of the query specification.")


class DiscoverShellsRequest(DiscoverRegistriesRequest):
    query_spec: List[QuerySpec] = Field(..., alias="querySpec", description="The query specifications for discovering shells.")
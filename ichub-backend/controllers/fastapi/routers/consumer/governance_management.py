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
# Unless required by routerlicable law or agreed in writing, software
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

from sqlmodel import Session, select

from tractusx_sdk.dataspace.tools.http_tools import HttpTools
from services.consumer.governance_management_service import GovernanceService

from typing import Optional, List
from tools.exceptions import exception_responses
router = APIRouter(prefix="/governance", tags=["Governance Management"])
governance_service = GovernanceService()


@router.post("/validate-policy")
def validate_policy(payload: dict):
    return governance_service.validate_policy(payload)
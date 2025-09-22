#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 LKS Next
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

from fastapi import APIRouter
from fastapi.responses import RedirectResponse, HTMLResponse
from managers.authentication.extended_oauth2_manager import ExtendedOAuth2Manager
from managers.config.config_manager import ConfigManager

auth_manager = ExtendedOAuth2Manager(
    auth_url=ConfigManager.get("authorization.keycloak.auth_url"),
    realm=ConfigManager.get("authorization.keycloak.realm"),
    clientid=ConfigManager.get("authorization.keycloak.client_id")
)

REDIRECT_URI = ConfigManager.get("hostname") + "/callback"
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/login")
def login():
    return RedirectResponse(auth_manager.get_authorization_url(REDIRECT_URI))

@router.get("/callback")
def callback(code: str):
    tokens = auth_manager.exchange_code_for_token(code, REDIRECT_URI)
    userinfo = auth_manager.userinfo(tokens["access_token"])
    return HTMLResponse(f"""
        <h1>Welcome {userinfo.get("preferred_username")}</h1>
        <p>Access Token: {tokens["access_token"][:50]}...</p>
    """)

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
# Unless required by applicable law or agreed in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################

from typing import List, Dict
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from tractusx_sdk.extensions.notification_api.models import (
    Notification)

from controllers.fastapi.routers.authentication.auth_api import get_authentication_dependency
from services.notifications.notifications_management_service import NotificationsManagementService
from models.metadata_database.notification.models import NotificationStatus, NotificationDirection


notification_management_service = NotificationsManagementService()

router = APIRouter(
    prefix="/notifications-management",
    tags=["Notifications Management"],
    dependencies=[Depends(get_authentication_dependency())]
)

@router.post("/notifications")
async def get_all_notifications(bpn: str, status: NotificationStatus = None, offset: int = 0, limit: int = 10) -> List[Notification]:
    return notification_management_service.get_all_notifications(bpn=bpn, status=status, offset=offset, limit=limit)

@router.post("/notification")
async def send_notification(notification: Notification, endpoint_path: str, provider_bpn: str, provider_dsp_url: str, list_policies: List[Dict]) -> Response:
    notification_management_service.create_notification(notification, direction=NotificationDirection.OUTGOING)
    success = notification_management_service.send_notification(notification, endpoint_path, provider_bpn, provider_dsp_url, list_policies)
    if success:
        return Response(status_code=201)
    else:
        return Response(status_code=400)

@router.put("/notification/status")
async def update_notification_status(message_id: str, status: NotificationStatus) -> Response:
    success = notification_management_service.update_notification_status(message_id, status)
    if success:
        return Response(status_code=200)
    else:
        return Response(status_code=404)

@router.delete("/notification")
async def delete_notification(message_id: str) -> Response:
    success = notification_management_service.delete_notification(message_id)
    if success:
        return Response(status_code=204)
    else:
        return Response(status_code=404)

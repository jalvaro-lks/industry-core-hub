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

from uuid import UUID
from typing import List, Optional

from tractusx_sdk.extensions.notification_api.models import Notification
from tractusx_sdk.extensions.notification_api import NotificationConsumerService, NotificationError
from tractusx_sdk.dataspace.services.connector.base_connector_consumer import BaseConnectorConsumerService

from managers.config.log_manager import LoggingManager
from managers.metadata_database.manager import RepositoryManagerFactory
from models.metadata_database.notification.models import NotificationStatus, NotificationDirection, NotificationEntity

from connector import connector_manager

logger = LoggingManager.get_logger(__name__)

class NotificationsManagementService():
    """
    Service class for managing notifications.
    """

    def __init__(self):
        self.connector_consumer_service: BaseConnectorConsumerService = connector_manager.consumer.connector_service

    def create_notification(self, notification: Notification, direction: NotificationDirection, use_case: str = None) -> NotificationEntity:
        """
        Create a new notification in the system.
        """
        status: NotificationStatus = None
        if direction == NotificationDirection.INCOMING:
            logger.info(f"Creating incoming notification with ID: {notification.header.message_id}")
            status = NotificationStatus.RECEIVED
        elif direction == NotificationDirection.OUTGOING:
            logger.info(f"Creating outgoing notification with ID: {notification.header.message_id}")
            status = NotificationStatus.PENDING
        
        with RepositoryManagerFactory().create() as repos:
            notification_data = repos.notification_repository.create_new(
                notification=notification,
                direction=direction,
                status=status,
                use_case=use_case
            )
            return notification_data

    def update_notification_status(self, message_id: UUID, new_status: NotificationStatus) -> Optional[NotificationEntity]:
        """
        Update the status of an existing notification identified by its message_id.
        """
        with RepositoryManagerFactory().create() as repos:
            db_obj = repos.notification_repository.update_status(message_id=message_id, new_status=new_status)
            return db_obj
        
    def get_all_notifications(self, bpn: str, status: Optional[NotificationStatus] = None, use_case: Optional[str] = None, offset: int = 0, limit: int = 100) -> List[NotificationEntity]:
        """
        Retrieve all notifications from the database, optionally filtered by BPN, status, and use_case, with pagination support.
        """
        with RepositoryManagerFactory().create() as repos:
            notifications = repos.notification_repository.find_by_bpn(bpn=bpn, status=status, use_case=use_case, offset=offset, limit=limit)
            return notifications
        
    def delete_notification(self, message_id: UUID) -> bool:
        """
        Delete a notification from the database by its message_id.
        """
        with RepositoryManagerFactory().create() as repos:
            success = repos.notification_repository.delete_by_message_id(message_id=message_id)
            return success

    def send_notification(self, notification: Notification, endpoint_url: str, provider_bpn: str, provider_dsp_url: str, list_policies: List[Dict]) -> None:
        """
        Send a notification to the specified endpoint using the connector consumer service.
        """
        try:
            notification_service = NotificationConsumerService(
                self.connector_consumer_service,
                verbose=True
            )

            result = notification_service.send_notification(
                provider_bpn=provider_bpn,
                provider_dsp_url=provider_dsp_url,
                notification=notification,
                endpoint_path=endpoint_url,
                policies=list_policies
            )
            logger.info(f"Notification sent with result: {result}")
            return result

        except NotificationError:
            raise
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            raise NotificationError(f"Failed to send notification: {e}")

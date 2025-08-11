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

from tractusx_sdk.dataspace.managers.connection import PostgresMemoryRefreshConnectionManager
from tractusx_sdk.dataspace.services.discovery import ConnectorDiscoveryService, DiscoveryFinderService
from database import engine
from managers.enablement_services import ConnectorManager
from managers.enablement_services.consumer import ConnectorConsumerManager
from managers.enablement_services.provider import ConnectorProviderManager
from managers.config.config_manager import ConfigManager
from tractusx_sdk.dataspace.managers import OAuth2Manager
import logging

logger = logging.getLogger("connector")
logger.setLevel(logging.INFO)

# Create the connection manager for the provider
connection_manager = PostgresMemoryRefreshConnectionManager(engine=engine, logger=logger, verbose=True)

# Create the provider manager
connector_provider_manager = ConnectorProviderManager(connection_manager=connection_manager)

discovery_oauth = OAuth2Manager(
    auth_url=ConfigManager.get_config("discovery.oauth.url"),
    realm=ConfigManager.get_config("discovery.oauth.realm"),
    clientid=ConfigManager.get_config("discovery.oauth.client_id"),
    clientsecret=ConfigManager.get_config("discovery.oauth.client_secret"),
)

discovery_finder_service = DiscoveryFinderService(
    url=ConfigManager.get_config("discovery.discovery_finder.url"),
    oauth=discovery_oauth
)

# Create the connector discovery service for the consumer
connector_discovery_service = ConnectorDiscoveryService(
    oauth=discovery_oauth,
    discovery_finder_service=discovery_finder_service
)

# Create the consumer manager
connector_consumer_manager = ConnectorConsumerManager(
    connector_discovery=connector_discovery_service,
    expiration_time=60  # 60 minutes cache expiration
)

# Create the main connector manager
connector_manager = ConnectorManager(
    connector_consumer_manager=connector_consumer_manager,
    connector_provider_manager=connector_provider_manager
)

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

## Code originally from `industry-flag-service`
## License: Apache-2.0
## Source Code: https://github.com/eclipse-tractusx/tractusx-sdk-services/blob/feature/industry-flag-service/industry-flag-service/backend/managers/edcManager.py
## Renamed as ConnectorConsumerManager

from tractusx_sdk.dataspace.services.discovery import ConnectorDiscoveryService
from tractusx_sdk.dataspace.tools import op
from managers.config.log_manager import LoggingManager
from .base_connector_consumer_manager import BaseConnectorConsumerManager
from typing import List, Dict, Optional
logger = LoggingManager.get_logger(__name__)
import copy

import hashlib

class ConnectorConsumerManager(BaseConnectorConsumerManager):
    """
    Memory-based implementation of connector consumer management.
    
    This class provides in-memory caching of connector information with
    time-based expiration for Business Partner Numbers (BPNs).
    """ 
    
    ## Declare variables
    known_connectors: Dict
    catalog_timeout: int

    def __init__(self, connector_discovery: ConnectorDiscoveryService, expiration_time: int = 60):
        """
        Initialize the memory-based connector consumer manager.
        
        Args:
            dct_type (str): The data consumption type identifier
            connector_discovery (ConnectorDiscoveryService): Service for discovering connectors
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
        """
        super().__init__(connector_discovery, expiration_time)
        self.known_connectors = {}
        
    def add_connectors(self, bpn: str, connectors: List[str]) -> None:
        """
        Add connectors to the in-memory cache for a specific BPN.
        
        Implements time-based caching with automatic expiration. If connectors
        for the BPN already exist and haven't expired, no update is performed.
        
        Args:
            bpn (str): The Business Partner Number to associate connectors with
            connectors (List[str]): List of connector URLs/endpoints to cache
        """
        if bpn not in self.known_connectors:
            self.known_connectors[bpn] = {self.REFRESH_INTERVAL_KEY: op.get_future_timestamp(minutes=self.expiration_time)}

        if(self.REFRESH_INTERVAL_KEY not in self.known_connectors[bpn]):
            self.known_connectors[bpn][self.REFRESH_INTERVAL_KEY] = op.get_future_timestamp(minutes=self.expiration_time)
        
        if(self.CONNECTOR_LIST_KEY in self.known_connectors[bpn]) and (len(self.known_connectors[bpn][self.CONNECTOR_LIST_KEY]) > 0) and (not op.is_interval_reached(self.known_connectors[bpn][self.REFRESH_INTERVAL_KEY])):
            return
        
        self.known_connectors[bpn][self.CONNECTOR_LIST_KEY] = op.get_future_timestamp(minutes=self.expiration_time)
        self.known_connectors[bpn][self.CONNECTOR_LIST_KEY] = connectors
        
        logger.info(f"[CONNECTOR Manager] [{bpn}] Added [{len(self.known_connectors[bpn][self.CONNECTOR_LIST_KEY])}] CONNECTORs to the cache! Next refresh at [{op.timestamp_to_datetime(self.known_connectors[bpn][self.REFRESH_INTERVAL_KEY])}] UTC")
        
    
    def is_connector_known(self, bpn: str, connector: str) -> bool:
        """
        Check if a specific connector is known/cached for the given BPN.
        
        Uses SHA3-256 hashing to generate connector IDs for comparison.
        
        Args:
            bpn (str): The Business Partner Number to check
            connector (str): The connector URL/endpoint to verify
            
        Returns:
            bool: True if the connector is known for the BPN, False otherwise
        """
        if bpn not in self.known_connectors:
            return False

        connector_id = hashlib.sha3_256(str(connector).encode('utf-8')).hexdigest()
        return connector_id in self.known_connectors[bpn]
    
    def get_connector_by_id(self, bpn: str, connector_id: str) -> Optional[str]:
        """
        Retrieve a specific connector by its ID for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector
            
        Returns:
            Optional[str]: The connector URL/endpoint if found, None otherwise
        """
        if bpn not in self.known_connectors or connector_id not in self.known_connectors[bpn]:
            return None
        
        return self.known_connectors[bpn][connector_id]

    
    def get_known_connectors(self) -> Dict:
        """
        Retrieve all known connectors from the in-memory cache.
        
        Returns:
            Dict: Complete cache dictionary containing all BPNs and their associated connectors
        """
        return self.known_connectors

    def delete_connector(self, bpn: str, connector_id: str) -> Dict:
        """
        Remove a specific connector from the in-memory cache.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector to remove
            
        Returns:
            Dict: Updated cache state after deletion
        """
        del self.known_connectors[bpn][connector_id]
        return self.known_connectors
        
    def purge_bpn(self, bpn: str) -> None:
        """
        Remove all connectors associated with a specific BPN from the cache.
        
        Args:
            bpn (str): The Business Partner Number to purge from cache
        """
        del self.known_connectors[bpn]
            
    def purge_cache(self) -> None:
        """
        Clear the entire in-memory connector cache.
        
        Resets the cache to an empty state, removing all cached connectors
        for all BPNs.
        """
        self.known_connectors = {}
    
    
    def get_connectors(self, bpn: str) -> List[str]:
        """
        Retrieve connectors for a specific BPN, with automatic discovery if not cached.
        
        First checks the in-memory cache for existing connectors. If cache is empty
        or expired, uses the connector discovery service to find and cache new
        connectors for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number to get connectors for
            
        Returns:
            List[str]: List of connector URLs/endpoints for the BPN
        """
        known_connectors: Dict = {}
        
        ## If the connectors are known then the cache is loaded
        if(bpn in self.known_connectors):
            known_connectors = copy.deepcopy(self.known_connectors[bpn])
        
        ## In case there is connectors, and the interval has not yet been reached
        if(known_connectors != {}) and (self.REFRESH_INTERVAL_KEY in known_connectors) and (not op.is_interval_reached(end_timestamp=known_connectors[self.REFRESH_INTERVAL_KEY])):
            return [connector_url for connector_id, connector_url in self.known_connectors[bpn].items()] ## Return the urls from the connectors
        
        logger.info(f"[CONNECTOR Manager] No cached CONNECTOR were found, discoverying CONNECTORs for bpn [{bpn}]...")
        
        connectors: Optional[List[str]] = self.connector_discovery.find_connector_by_bpn(bpn=bpn)
        if(connectors is None or len(connectors) == 0):
            return []
        
        self.add_connectors(bpn=bpn, connectors=connectors)
        
        return connectors
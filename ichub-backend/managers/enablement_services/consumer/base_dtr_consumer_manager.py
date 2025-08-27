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

## This file was created using an LLM (Claude Sonnet 4) and reviewed by a human committer

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, TYPE_CHECKING
import hashlib


if TYPE_CHECKING:
    from managers.enablement_services.connector_manager import BaseConnectorConsumerManager

class BaseDtrConsumerManager(ABC):
    """
    Abstract base class for managing DTR discovery and caching.
    
    This class defines the interface for DTR management, including
    DTR discovery, caching mechanisms, and BPN-based DTR retrieval.
    Implementations should provide concrete behavior for DTR storage
    and cache management strategies.
    """
    
    def __init__(self, connector_consumer_manager: 'BaseConnectorConsumerManager', expiration_time: int = 60, dct_type_id="dct:type", dct_type_key:str="'http://purl.org/dc/terms/type'.'@id'", operator:str="=", dct_type:str="https://w3id.org/catenax/taxonomy#DigitalTwinRegistry"):
        """
        Initialize the DTR consumer manager.
        
        Args:
            connector_consumer_manager (BaseConnectorConsumerManager): Connector manager with consumer capabilities
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
        """
        self.connector_consumer_manager = connector_consumer_manager
        self.expiration_time = expiration_time
        self.REFRESH_INTERVAL_KEY = "refresh_interval"
        self.DTR_DATA_KEY = "dtr_data"
        self.DTR_CONNECTOR_URL_KEY = "connector_url"
        self.DTR_ASSET_ID_KEY = "asset_id"
        self.DTR_POLICIES_KEY = "policies"
        self.dct_type_id = dct_type_id
        self.dct_type_key = dct_type_key
        self.operator = operator
        self.dct_type = dct_type
        # DCAT catalog constants from EDC catalog structure
        self.DCAT_DATASET_KEY = "dcat:dataset"
        self.ODRL_HAS_POLICY_KEY = "odrl:hasPolicy"
        self.ID_KEY = "@id"

    @abstractmethod
    def add_dtr(self, bpn: str, edc_url: str, asset_id: str, policies: List[str]) -> None:
        """
        Add DTR to the cache for a specific Business Partner Number (BPN).
        
        This method should store the provided DTR data associated with the given BPN,
        implementing appropriate caching logic including expiration handling.
        
        Args:
            bpn (str): The Business Partner Number to associate DTR with
            edc_url (str): URL of the EDC where the DTR is stored
            asset_id (str): Asset ID of the DTR
            policies (List[str]): List of policies for this DTR
            
        Returns:
            None
        """
        pass

    @abstractmethod
    def is_dtr_known(self, bpn: str, asset_id: str) -> bool:
        """
        Check if a specific DTR is known/cached for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number to check
            asset_id (str): The asset ID to verify
            
        Returns:
            bool: True if the DTR is known for the BPN, False otherwise
        """
        pass

    @abstractmethod
    def get_dtr_by_asset_id(self, bpn: str, asset_id: str) -> Optional[Dict]:
        """
        Retrieve a specific DTR by its asset ID for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number
            asset_id (str): The asset ID of the DTR
            
        Returns:
            Optional[Dict]: The DTR data if found, None otherwise
        """
        pass

    @abstractmethod
    def get_known_dtrs(self) -> Dict:
        """
        Retrieve all known DTRs from the cache.
        
        Returns:
            Dict: Complete cache dictionary containing all BPNs and their associated DTRs
        """
        pass

    @abstractmethod
    def delete_dtr(self, bpn: str, asset_id: str) -> Dict:
        """
        Remove a specific DTR from the cache.
        
        Args:
            bpn (str): The Business Partner Number
            asset_id (str): The asset ID of the DTR to remove
            
        Returns:
            Dict: Updated cache state after deletion
        """
        pass

    @abstractmethod
    def purge_bpn(self, bpn: str) -> None:
        """
        Remove all DTRs associated with a specific BPN from the cache.
        
        Args:
            bpn (str): The Business Partner Number to purge from cache
            
        Returns:
            None
        """
        pass

    @abstractmethod
    def purge_cache(self) -> None:
        """
        Clear the entire DTR cache.
        
        This method should remove all cached DTRs for all BPNs,
        effectively resetting the cache to an empty state.
        
        Returns:
            None
        """
        pass

    @abstractmethod
    def get_dtrs(self, bpn: str) -> Dict:
        """
        Retrieve DTRs for a specific BPN, with automatic discovery if not cached.
        
        This method should first check the cache for existing DTRs. If cache is empty
        or expired, it should use the connector discovery service to find and cache new
        DTRs for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number to get DTRs for
            
        Returns:
            Dict: DTR data for the BPN including edc_url, asset_id, and policies
        """
        pass

    @abstractmethod
    def discover_shells(self, counter_party_id: str, query_spec: List[Dict[str, str]]) -> Dict:
        """
        Discover digital twin shells using query specifications.
        
        This method discovers available DTRs for the given BPN, negotiates access,
        and searches for shells matching the provided query specifications using
        the /lookup/shellsByAssetLink API.
        
        Args:
            counter_party_id (str): The Business Partner Number to search
            query_spec (List[Dict[str, str]]): List of query specifications, each dict must contain:
                - "name": The name of the query parameter (e.g., "manufacturePartId", "bpn", "serialnr")
                - "value": The value to search for
                
                Example:
                [
                    {"name": "manufacturePartId", "value": "MPI7654"},
                    {"name": "bpn", "value": "BPNL0073928UJ879"},
                    {"name": "serialnr", "value": "DPPV-0001"}
                ]
            
        Returns:
            Dict: Search results containing matching digital twin shells with metadata
        """
        pass
    
    @abstractmethod
    def discover_shell(self, counter_party_id: str, id: str) -> Dict:
        """
        Discover a digital twin shell using its ID.
        
        This method discovers the DTR for the given BPN, negotiates access,
        and retrieves the shell matching the provided ID using the
        /lookup/shellsByAssetLink API.
        
        Args:
            counter_party_id (str): The Business Partner Number to search
            id (str): The ID of the shell to retrieve
            
        Returns:
            Dict: Search results containing the matching digital twin shell with metadata
        """
        
        pass
    
    def _is_cache_expired(self, bpn: str) -> bool:
        """
        Helper method to check if cache for a specific BPN has expired.
        
        This is a template method that implementations can override or use
        to determine cache expiration logic.
        
        Args:
            bpn (str): The Business Partner Number to check
            
        Returns:
            bool: True if cache is expired or doesn't exist, False otherwise
        """
        # This can be implemented by subclasses or remain as a helper
        return True

    def _generate_dtr_id(self, bpnl:str, connector_url:str, asset_id: str) -> str:
        """
        Generate a unique identifier for a DTR.
        
        This helper method can be used by implementations to create
        consistent DTR IDs.
        
        Args:
            bpnl (str): The Business Partner Number
            connector_url (str): The connector URL
            asset_id (str): The asset ID
            
        Returns:
            str: Unique identifier for the DTR
        """
        return hashlib.sha3_256(f"{bpnl}-{connector_url}-{asset_id}".encode('utf-8')).hexdigest()

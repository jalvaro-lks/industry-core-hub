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

import copy
import logging
import threading
import json
import base64
from typing import TYPE_CHECKING, Dict, List, Optional, Union, Any
from tractusx_sdk.dataspace.tools import op
from tractusx_sdk.dataspace.services.connector import BaseConnectorConsumerService
from tractusx_sdk.industry.services import AasService
from tractusx_sdk.industry.models.aas.v3 import SpecificAssetId
from managers.config.config_manager import ConfigManager
from managers.enablement_services.consumer.base_dtr_consumer_manager import BaseDtrConsumerManager
if TYPE_CHECKING:
    from managers.enablement_services.connector_manager import BaseConnectorConsumerManager
from requests import Response
from tractusx_sdk.dataspace.models.connector.base_catalog_model import BaseCatalogModel
from models.services.consumer.discovery_management import QuerySpec
from tractusx_sdk.dataspace.tools import HttpTools

class DtrConsumerMemoryManager(BaseDtrConsumerManager):
    """
    Memory-based implementation of DTR consumer management.
    
    This class provides in-memory caching of DTR information with
    time-based expiration for Business Partner Numbers (BPNs). Extends
    the base DTR consumer manager interface.
    """ 
    
    ## Declare variables
    known_dtrs: Dict
    logger: logging.Logger
    verbose: bool

    def __init__(self, connector_consumer_manager: 'BaseConnectorConsumerManager', expiration_time: int = 60, logger:logging.Logger=None, verbose:bool=False, dct_type_id="dct:type", dct_type_key:str="'http://purl.org/dc/terms/type'.'@id'", operator:str="=", dct_type:str="https://w3id.org/catenax/taxonomy#DigitalTwinRegistry"):
        """
        Initialize the memory-based DTR consumer manager.
        
        Args:
            connector_consumer_manager (BaseConnectorConsumerManager): Connector manager with consumer capabilities
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
        """
        super().__init__(connector_consumer_manager, expiration_time, dct_type_id=dct_type_id, dct_type_key=dct_type_key, operator=operator, dct_type=dct_type)
        self.known_dtrs = {}
        self.logger = logger if logger else None
        self.verbose = verbose
        self._lock = threading.RLock()
        
    def add_dtr(self, bpn: str, connector_url: str, asset_id: str, policies: List[str]) -> None:
        """
        Add DTR to the in-memory cache for a specific BPN.
        
        Supports multiple DTRs per BPN using asset_id as unique key.
        
        Args:
            bpn (str): The Business Partner Number to associate DTR with
            connector_url (str): URL of the EDC where the DTR is stored
            asset_id (str): Asset ID of the DTR (used as unique key)
            policies (List[str]): List of policies for this DTR
        """
        with self._lock:
            if bpn not in self.known_dtrs:
                self.known_dtrs[bpn] = {}

            # Always update the refresh interval timestamp
            self.known_dtrs[bpn][self.REFRESH_INTERVAL_KEY] = op.get_future_timestamp(minutes=self.expiration_time)
            
            # Initialize DTR dictionary if it doesn't exist
            if self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                self.known_dtrs[bpn][self.DTR_DATA_KEY] = {}
            
            # Check if this specific DTR already exists (avoid duplicates)
            if asset_id in self.known_dtrs[bpn][self.DTR_DATA_KEY]:
                if(self.logger and self.verbose):
                    self.logger.debug(f"[DTR Manager] [{bpn}] DTR with asset ID [{asset_id}] already cached, skipping duplicate")
                return
            
            # Add the new DTR using asset_id as key
            self.known_dtrs[bpn][self.DTR_DATA_KEY][asset_id] = self._create_dtr_cache_entry(connector_url=connector_url, asset_id=asset_id, policies=policies)

            if(self.logger and self.verbose):
                total_dtrs = len(self.known_dtrs[bpn][self.DTR_DATA_KEY])
                self.logger.info(f"[DTR Manager] [{bpn}] Added DTR to the cache! Asset ID: [{asset_id}] (Total DTRs: {total_dtrs}) Next refresh at [{op.timestamp_to_datetime(self.known_dtrs[bpn][self.REFRESH_INTERVAL_KEY])}] UTC")
            
        return

    def _create_dtr_cache_entry(self, connector_url: str, asset_id: str, policies: List[Union[str, Dict[str, Any]]]) -> dict:
        """
        Create a new DTR cache entry for a specific BPN.
        
        Args:
            bpn (str): The Business Partner Number to associate DTR with
            connector_url (str): URL of the EDC where the DTR is stored
            asset_id (str): Asset ID of the DTR
            policies (List[Union[str, Dict[str, Any]]]): List of policies for this DTR (cleaned of @id and @type)
        """

        return {
                    self.DTR_CONNECTOR_URL_KEY: connector_url,
                    self.DTR_ASSET_ID_KEY: asset_id,
                    self.DTR_POLICIES_KEY: policies
                }

    def is_dtr_known(self, bpn: str, asset_id: str) -> bool:
        """
        Check if a specific DTR is known/cached for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number to check
            asset_id (str): The asset ID to verify
            
        Returns:
            bool: True if the DTR is known for the BPN, False otherwise
        """
        with self._lock:
            if bpn not in self.known_dtrs:
                return False
            
            if self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return False
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if not isinstance(dtr_dict, dict):
                return False
                
            # O(1) lookup using asset_id as key
            return asset_id in dtr_dict

    def get_dtr_by_asset_id(self, bpn: str, asset_id: str) -> Optional[Dict]:
        """
        Retrieve a specific DTR by its asset ID for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number
            asset_id (str): The asset ID of the DTR
            
        Returns:
            Optional[Dict]: The DTR data if found, None otherwise
        """
        with self._lock:
            if bpn not in self.known_dtrs:
                return None
            
            if self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return None
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if not isinstance(dtr_dict, dict):
                return None
                
            # O(1) lookup using asset_id as key
            if asset_id in dtr_dict:
                return copy.deepcopy(dtr_dict[asset_id])
            
            return None

    def get_known_dtrs(self) -> Dict:
        """
        Retrieve all known DTRs from the cache.
        
        Returns:
            Dict: Complete cache dictionary containing all BPNs and their associated DTRs
        """
        with self._lock:
            return copy.deepcopy(self.known_dtrs)

    def delete_dtr(self, bpn: str, asset_id: str) -> Dict:
        """
        Remove a specific DTR from the cache.
        
        Args:
            bpn (str): The Business Partner Number
            asset_id (str): The asset ID of the DTR to remove
            
        Returns:
            Dict: Updated cache state after deletion
        """
        with self._lock:
            if bpn in self.known_dtrs and self.DTR_DATA_KEY in self.known_dtrs[bpn]:
                dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
                if isinstance(dtr_dict, dict) and asset_id in dtr_dict:
                    # O(1) deletion using asset_id as key
                    del dtr_dict[asset_id]
                    if(self.logger and self.verbose):
                        remaining_dtrs = len(dtr_dict)
                        self.logger.info(f"[DTR Manager] [{bpn}] Deleted DTR with asset ID [{asset_id}] from cache (Remaining DTRs: {remaining_dtrs})")
            
            return self.get_known_dtrs()

    def purge_bpn(self, bpn: str) -> None:
        """
        Remove all DTRs associated with a specific BPN from the cache.
        
        Args:
            bpn (str): The Business Partner Number to purge from cache
        """
        with self._lock:
            if bpn in self.known_dtrs:
                del self.known_dtrs[bpn]
                if(self.logger and self.verbose):
                    self.logger.info(f"[DTR Manager] [{bpn}] Purged all DTRs from cache")

    def purge_cache(self) -> None:
        """
        Clear the entire DTR cache.
        
        This method removes all cached DTRs for all BPNs,
        effectively resetting the cache to an empty state.
        """
        with self._lock:
            self.known_dtrs.clear()
            if(self.logger and self.verbose):
                self.logger.info("[DTR Manager] Purged entire DTR cache")

    def get_dtrs_by_connector(self, bpn: str, connector_url: str) -> List[Dict]:
        """
        Retrieve DTRs for a specific BPN from a specific connector.
        
        Args:
            bpn (str): The Business Partner Number
            connector_url (str): The connector URL to filter by
            
        Returns:
            List[Dict]: List of DTR data from the specified connector
        """
        with self._lock:
            if bpn not in self.known_dtrs or self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return []
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if not isinstance(dtr_dict, dict):
                return []
                
            # Filter DTRs by connector URL
            filtered_dtrs = [
                copy.deepcopy(dtr) for dtr in dtr_dict.values()
                if dtr.get(self.DTR_CONNECTOR_URL_KEY) == connector_url
            ]
            
            return filtered_dtrs

    def get_dtr_count(self, bpn: str) -> int:
        """
        Get the total number of DTRs cached for a specific BPN.
        
        Args:
            bpn (str): The Business Partner Number
            
        Returns:
            int: Number of DTRs cached for the BPN
        """
        with self._lock:
            if bpn not in self.known_dtrs or self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return 0
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if isinstance(dtr_dict, dict):
                return len(dtr_dict)
            
            return 0

    def get_all_connector_urls(self, bpn: str) -> List[str]:
        """
        Get all unique connector URLs that have DTRs for a specific BPN.
        
        Args:
            bpn (str): The Business Partner Number
            
        Returns:
            List[str]: List of unique connector URLs
        """
        with self._lock:
            if bpn not in self.known_dtrs or self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return []
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if not isinstance(dtr_dict, dict):
                return []
                
            # Extract unique connector URLs
            connector_urls = set()
            for dtr in dtr_dict.values():
                connector_url = dtr.get(self.DTR_CONNECTOR_URL_KEY)
                if connector_url:
                    connector_urls.add(connector_url)
            
            return list(connector_urls)

    def get_all_asset_ids(self, bpn: str) -> List[str]:
        """
        Get all asset IDs for DTRs cached for a specific BPN.
        
        Args:
            bpn (str): The Business Partner Number
            
        Returns:
            List[str]: List of asset IDs
        """
        with self._lock:
            if bpn not in self.known_dtrs or self.DTR_DATA_KEY not in self.known_dtrs[bpn]:
                return []
                
            dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
            if isinstance(dtr_dict, dict):
                return list(dtr_dict.keys())
            
            return []

    
    def get_catalog(self,  connector_service:BaseConnectorConsumerService, counter_party_id: str = None, counter_party_address: str = None,
                    request: BaseCatalogModel = None, timeout=60) -> dict | None:
        """
        Retrieves the EDC DCAT catalog. Allows to get the catalog without specifying the request, which can be overridden
        
        Parameters:
        counter_party_address (str): The URL of the EDC provider.
        request (BaseCatalogModel, optional): The request payload for the catalog API. If not provided, a default request will be used.

        Returns:
        dict | None: The EDC catalog as a dictionary, or None if the request fails.
        """
        ## Get EDC DCAT catalog

        ## Get catalog with configurable timeout
        response: Response = connector_service.catalogs.get_catalog(obj=request, timeout=timeout)
    
        ## In case the response code is not successfull or the response is null
        if response is None or response.status_code != 200:
            raise ConnectionError(
                f"[EDC Service] It was not possible to get the catalog from the EDC provider! Response code: [{response.status_code}]")
        return response.json()
    
        ## Get catalog request with filter
    def get_catalog_with_filter(self,  connector_service:BaseConnectorConsumerService, counter_party_id: str, counter_party_address: str, filter_expression: list[dict],
                                timeout: int = None) -> dict:
        """
        Retrieves a catalog from the EDC provider based on a specified filter.

        Parameters:
        counter_party_id (str): The identifier of the counterparty (Business Partner Number [BPN]).
        counter_party_address (str): The URL of the EDC provider.
        key (str): The key to filter the catalog entries by.
        value (str): The value to filter the catalog entries by.
        operator (str, optional): The comparison operator to use for filtering. Defaults to "=".

        Returns:
        dict: The catalog entries that match the specified filter.
        """
        return self.get_catalog(connector_service=connector_service, request=connector_service.get_catalog_request_with_filter(counter_party_id=counter_party_id,
                                                                             counter_party_address=counter_party_address,
                                                                             filter_expression=filter_expression),
                                timeout=timeout)
    
    def get_catalog_with_filter_parallel(self, connector_service:BaseConnectorConsumerService, counter_party_id: str, counter_party_address: str,
                                        filter_expression: list[dict], catalogs: dict = None,
                                        timeout: int = None) -> None:
        catalog = self.get_catalog_with_filter(connector_service=connector_service, counter_party_id=counter_party_id,
                                                                    counter_party_address=counter_party_address,
                                                                    filter_expression=filter_expression,
                                                                    timeout=timeout)
        catalogs[counter_party_address] = catalog
        
    def get_catalogs_by_filter_expression(self, connector_service:BaseConnectorConsumerService, counter_party_id: str, edcs: list, filter_expression: List[dict],
                                 timeout: int = None):

        ## Where the catalogs get stored
        catalogs: dict = {}
        threads: list[threading.Thread] = []
        for connector_url in edcs:
            thread = threading.Thread(target=self.get_catalog_with_filter_parallel, kwargs=
            {
                'connector_service': connector_service,
                'counter_party_id': counter_party_id,
                'counter_party_address': connector_url,
                'filter_expression': filter_expression,
                'timeout': timeout,
                'catalogs': catalogs
            }
                                      )
            thread.start()  ## Start thread
            threads.append(thread)

        ## Allow the threads to process
        for thread in threads:
            thread.join()  ## Waiting until they process

        
        return catalogs
    
    def get_dtrs(self, bpn: str, timeout:int=30) -> List[Dict]:
        """
        Retrieve DTRs for a specific BPN, with automatic discovery if not cached.
        
        This method first checks the cache for existing DTRs. If cache is empty
        or expired, it uses the connector manager to get connectors for the BPN,
        then queries each connector's catalog to find DTR assets.
        
        Args:
            bpn (str): The Business Partner Number to get DTRs for
            timeout (int): Timeout for catalog requests
            
        Returns:
            List[Dict]: List of DTR data for the BPN, each containing connector_url, asset_id, and policies
        """
        with self._lock:
            # Check if we have cached data that hasn't expired
            if bpn in self.known_dtrs and not self._is_cache_expired(bpn):
                if self.DTR_DATA_KEY in self.known_dtrs[bpn] and isinstance(self.known_dtrs[bpn][self.DTR_DATA_KEY], dict):
                    cached_dtrs_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
                    if len(cached_dtrs_dict) > 0:
                        if(self.logger and self.verbose):
                            self.logger.debug(f"[DTR Manager] [{bpn}] Returning {len(cached_dtrs_dict)} DTRs from cache. Next refresh at [{op.timestamp_to_datetime(self.known_dtrs[bpn][self.REFRESH_INTERVAL_KEY])}] UTC")
                        # Return list of DTR values
                        return [copy.deepcopy(dtr) for dtr in cached_dtrs_dict.values()]
            
            # Cache is expired or doesn't exist, discover DTRs
            if(self.logger and self.verbose):
                self.logger.info(f"[DTR Manager] No cached DTRs were found, discovering DTRs for bpn [{bpn}]...")
            
            # Get connectors from the connector manager
            try:
                connectors = self.connector_consumer_manager.get_connectors(bpn)
                if not connectors or len(connectors) == 0:
                    if(self.logger and self.verbose):
                        self.logger.warning(f"[DTR Manager] [{bpn}] No connectors found for DTR discovery")
                    return []
                
                if(self.logger and self.verbose):
                    self.logger.debug(f"[DTR Manager] [{bpn}] Found {len(connectors)} connectors, searching for DTR assets")
                
                # Search for DTR assets in each connector's catalog
                connector_service:BaseConnectorConsumerService = self.connector_consumer_manager.connector_service
                
                # Get catalogs in parallel from all the connectors 
                catalogs:dict = self.get_catalogs_by_filter_expression(
                                        connector_service=connector_service,
                                        edcs=connectors,
                                        counter_party_id=bpn,
                                        filter_expression=connector_service.get_filter_expression(
                                            key=self.dct_type_key,
                                            operator=self.operator,
                                            value=self.dct_type
                                        ),
                                        timeout=timeout
                                        ) 
            
                # Iterate over catalogs and extract DTR information
                for connector_url, catalog in catalogs.items():
                    if catalog and not catalog.get("error"):
                        # Get datasets from the catalog - using DCAT dataset key
                        datasets = catalog.get(self.DCAT_DATASET_KEY, [])
                        if not isinstance(datasets, list):
                            datasets = [datasets] if datasets else []
                        
                        for dataset in datasets:
                            if self._is_dtr_asset(dataset):
                                # Extract asset ID
                                asset_id = dataset.get(self.ID_KEY, "")
                                if not asset_id:
                                    continue
                                
                                # Extract policies
                                policies = self._extract_policies(dataset)
                                
                                # Create DTR data structure
                                self.add_dtr(bpn=bpn, connector_url=connector_url, asset_id=asset_id, policies=policies)

                                if(self.logger and self.verbose):
                                    self.logger.info(f"[DTR Manager] [{bpn}] Found DTR asset [{asset_id}] in connector [{connector_url}] added to cache")
                
                # Return the cached DTRs for this BPN
                if bpn in self.known_dtrs and self.DTR_DATA_KEY in self.known_dtrs[bpn]:
                    cached_dtrs_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
                    if isinstance(cached_dtrs_dict, dict):
                        cached_dtrs_list = list(cached_dtrs_dict.values())
                        if(self.logger and self.verbose):
                            self.logger.info(f"[DTR Manager] [{bpn}] Discovery complete. Found {len(cached_dtrs_list)} DTR(s) total")
                        return [copy.deepcopy(dtr) for dtr in cached_dtrs_list]
                    else:
                        return []
                else:
                    if(self.logger and self.verbose):
                        self.logger.info(f"[DTR Manager] [{bpn}] No DTR assets found in any connector catalogs")
                    return []
        
            except Exception as e:
                if(self.logger and self.verbose):
                    self.logger.error(f"[DTR Manager] [{bpn}] Error discovering DTRs: {e}")
                return []

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
            
        Returns:
            Dict: Search results containing matching digital twin shells with metadata
        """
        try:
            if(self.logger and self.verbose):
                self.logger.info(f"[DTR Manager] [{counter_party_id}] Starting shell discovery with {len(query_spec)} query parameters")
            
            # Step 1: Get available DTRs for the BPN
            dtrs = self.get_dtrs(counter_party_id)
            if not dtrs or len(dtrs) == 0:
                if(self.logger and self.verbose):
                    self.logger.warning(f"[DTR Manager] [{counter_party_id}] No DTRs found for shell discovery")
                return {"shells": [], "message": "No DTRs found for the specified BPN"}
            
            if(self.logger and self.verbose):
                self.logger.info(f"[DTR Manager] [{counter_party_id}] Found {len(dtrs)} DTR(s), starting shell search")
            
            # Step 2: Validate query specifications format
            if not query_spec:
                return {"shells": [], "message": "No query specifications provided"}
            
            # Step 3: Search each DTR for matching shells
            all_shells = []
            connector_service:BaseConnectorConsumerService = self.connector_consumer_manager.connector_service
            
            for dtr in dtrs:
                connector_url = dtr.get(self.DTR_CONNECTOR_URL_KEY)
                asset_id = dtr.get(self.DTR_ASSET_ID_KEY)
                policies = dtr.get(self.DTR_POLICIES_KEY, [])

                if not policies:
                    if(self.logger and self.verbose):
                        self.logger.warning(f"[DTR Manager] [{counter_party_id}] No policies found for DTR [{asset_id}]")
                    continue

                
                # Search for shells using the lookup API
                if(self.logger and self.verbose):
                    self.logger.debug(f"[DTR Manager] [{counter_party_id}] Calling /lookup/shellsByAssetLink on Connector [{connector_url}] DTR [{dtr.get(self.DTR_ASSET_ID_KEY)}]")
                print(json.dumps(query_spec))  # Debug output of query_spec
                
                # Use connector service do_post method instead of direct HTTP request
                dataplane_url, access_token = connector_service.do_dsp(
                    counter_party_id=counter_party_id,
                    counter_party_address=connector_url,
                    policies=policies,
                    filter_expression=connector_service.get_filter_expression(
                        key=self.dct_type_key,
                        operator=self.operator,
                        value=self.dct_type
                    )
                )
                print(f"[DTR Manager] [{counter_party_id}] Using Data Plane URL: {dataplane_url} + token [{access_token}]")
                
                 # TODO: Future implementation should use AAS service for shellsByAssetLink API support
                # aas_service = AasService(
                #     base_url=dataplane_url,
                #     token=access_token,
                #     base_lookup_url=dtr_endpoint,
                #     api_path="",
                #     edc_controlplane_hostname="",
                #     edc_controlplane_catalog_path="",
                #     edc_dataplane_hostname="",
                #     edc_dataplane_public_path=""
                # )
                
                # Use query_spec directly as it's already in the correct format for shell lookup
                # Each query_spec item has "name" and "value" properties as required by the DTR API
                
                response = HttpTools.do_post(
                    url=f"{dataplane_url}/lookup/shellsByAssetLink",
                    headers={
                        "Authorization": f"{access_token}"
                    },
                    json=query_spec
                )
               
                if response.status_code == 200:
                    shells_response = response.json()
                    print(shells_response)
                    
                    # Extract shell UUIDs from the response
                    shell_uuids = []
                    if isinstance(shells_response, dict) and 'result' in shells_response:
                        shell_uuids = shells_response.get('result', [])
                    elif isinstance(shells_response, list):
                        shell_uuids = shells_response
                    
                    # Fetch full shell descriptors for each UUID
                    if shell_uuids:
                        if(self.logger and self.verbose):
                            self.logger.info(f"[DTR Manager] [{counter_party_id}] Found {len(shell_uuids)} shell UUIDs, fetching descriptors")
                        
                        for shell_uuid in shell_uuids:
                            try:
                                # Encode the shell UUID in base64
                                encoded_shell_uuid = base64.b64encode(shell_uuid.encode('utf-8')).decode('utf-8')
                                
                                shell_response = HttpTools.do_get(
                                    url=f"{dataplane_url}/shell-descriptors/{encoded_shell_uuid}",
                                    headers={
                                        "Authorization": f"{access_token}"
                                    }
                                )
                                
                                if shell_response.status_code == 200:
                                    shell_descriptor = shell_response.json()
                                    all_shells.append(shell_descriptor)
                                    if(self.logger and self.verbose):
                                        self.logger.debug(f"[DTR Manager] [{counter_party_id}] Retrieved shell descriptor for UUID [{shell_uuid}] (encoded: {encoded_shell_uuid})")
                                else:
                                    if(self.logger and self.verbose):
                                        self.logger.warning(f"[DTR Manager] [{counter_party_id}] Failed to retrieve shell descriptor for UUID [{shell_uuid}]: {shell_response.status_code}")
                            except Exception as e:
                                if(self.logger and self.verbose):
                                    self.logger.error(f"[DTR Manager] [{counter_party_id}] Error retrieving shell descriptor for UUID [{shell_uuid}]: {e}")
                        
                        if(self.logger and self.verbose):
                            self.logger.info(f"[DTR Manager] [{counter_party_id}] Retrieved {len([s for s in all_shells if isinstance(s, dict)])} shell descriptors from DTR [{asset_id}]")
                    else:
                        if(self.logger and self.verbose):
                            self.logger.info(f"[DTR Manager] [{counter_party_id}] No shell UUIDs found in DTR [{asset_id}]")
                else:
                    if(self.logger and self.verbose):
                        self.logger.warning(f"[DTR Manager] [{counter_party_id}] Shell lookup failed for DTR [{asset_id}]: {response.status_code}")
            
            
            # Step 7: Return aggregated results
            result = {
                "shells": all_shells,
                "dtrs_searched": len(dtrs),
                "shells_found": len(all_shells),
                "query_spec": query_spec
            }
            
            if(self.logger and self.verbose):
                self.logger.info(f"[DTR Manager] [{counter_party_id}] Shell discovery complete. Found {len(all_shells)} shells across {len(dtrs)} DTRs")
            
            return result
            
        except Exception as e:
            error_msg = f"Error during shell discovery: {str(e)}"
            if(self.logger and self.verbose):
                self.logger.error(f"[DTR Manager] [{counter_party_id}] {error_msg}")
            return {"shells": [], "error": error_msg}

    def discover_shell(self, counter_party_id: str, aas_id: str) -> Dict:
        pass
        

    def _is_dtr_asset(self, dataset: Dict) -> bool:
        """
        Check if a dataset from a catalog is a DTR asset.
        
        Args:
            dataset (Dict): Dataset from the catalog
            
        Returns:
            bool: True if this is a DTR asset, False otherwise
        """
        # Look for DTR-specific properties in the dataset
        # This can be customized based on your DTR asset identification logic
        dct_type_property = dataset.get(self.dct_type_id, {})
        
        # Remove .'@id' from dct_type_key if it exists to get the base property name
        dct_type_key_base = self.dct_type_key.replace(f".'{self.ID_KEY}'", "") if f".'{self.ID_KEY}'" in self.dct_type_key else self.dct_type_key
        dct_type_expanded_property = dataset.get(dct_type_key_base, {})
    
        # Format 1: "dct:type": {"@id": "https://w3id.org/catenax/taxonomy#DigitalTwinRegistry"}
        if isinstance(dct_type_property, dict):
            type_id = dct_type_property.get(self.ID_KEY, "")
            if type_id == self.dct_type:
                return True
        elif isinstance(dct_type_property, str):
            if dct_type_property == self.dct_type:
                return True
            
        # Format 2: "http://purl.org/dc/terms/type": {"@id": "https://w3id.org/catenax/taxonomy#DigitalTwinRegistry"}
        if isinstance(dct_type_expanded_property, dict):
            type_id = dct_type_expanded_property.get(self.ID_KEY, "")
            if type_id == self.dct_type:
                return True
        elif isinstance(dct_type_expanded_property, str):
            if dct_type_expanded_property == self.dct_type:
                return True
        
        return False

    def _extract_policies(self, dataset: Dict) -> List[Union[str, Dict[str, Any]]]:
        """
        Extract policies from a dataset, excluding @id and @type metadata.
        
        Args:
            dataset (Dict): Dataset from the catalog
            
        Returns:
            List[Union[str, Dict[str, Any]]]: List of clean policy identifiers without @id and @type
        """
        policies = []
        
        # Extract policies from odrl:hasPolicy
        has_policy = dataset.get(self.ODRL_HAS_POLICY_KEY, [])

        if not isinstance(has_policy, list):
            has_policy = [has_policy]

        # Clean policies by removing @id and @type metadata
        for policy in has_policy:
            if isinstance(policy, dict):
                # Create a clean copy without @id and @type
                clean_policy = {k: v for k, v in policy.items() if k not in ["@id", "@type"]}
                if clean_policy:  # Only add if there's actual content after cleaning
                    policies.append(clean_policy)
            elif isinstance(policy, str):
                # If it's already a string (policy ID), keep it as is
                policies.append(policy)

        return policies

        return policies

    def _is_cache_expired(self, bpn: str) -> bool:
        """
        Check if cache for a specific BPN has expired.
        
        Implements the cache expiration logic by checking if the BPN exists
        in the cache and whether the refresh interval timestamp has been reached.
        
        Args:
            bpn (str): The Business Partner Number to check
            
        Returns:
            bool: True if cache is expired or doesn't exist, False otherwise
        """
        # If BPN is not in cache, consider it expired
        if bpn not in self.known_dtrs:
            return True
        
        # If no refresh interval is set, consider it expired
        if self.REFRESH_INTERVAL_KEY not in self.known_dtrs[bpn]:
            return True
        
        # Check if the refresh interval has been reached
        return op.is_interval_reached(self.known_dtrs[bpn][self.REFRESH_INTERVAL_KEY])

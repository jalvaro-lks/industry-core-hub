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

import copy
import hashlib
import logging
import threading
import json
import base64
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import TYPE_CHECKING, Dict, List, Optional, Union, Any
from tractusx_sdk.dataspace.tools import op
from tractusx_sdk.dataspace.services.connector import BaseConnectorConsumerService
from tractusx_sdk.industry.services import AasService
from tractusx_sdk.industry.models.aas.v3 import SpecificAssetId
from managers.config.config_manager import ConfigManager
from managers.enablement_services.consumer.base_dtr_consumer_manager import BaseDtrConsumerManager
from managers.enablement_services.consumer.dtr.pagination_manager import PaginationManager, DtrPaginationState, PageState
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
        self.shell_descriptors = {}  # Central storage for shell descriptors by shell ID
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
        Clear the entire DTR cache and shell descriptors.
        
        This method removes all cached DTRs for all BPNs and all shell descriptors,
        effectively resetting the cache to an empty state.
        """
        with self._lock:
            self.known_dtrs.clear()
            self.shell_descriptors.clear()
            if(self.logger and self.verbose):
                self.logger.info("[DTR Manager] Purged entire DTR cache and shell descriptors")

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

    def discover_shells(self, counter_party_id: str, query_spec: List[Dict[str, str]], limit: Optional[int] = None, cursor: Optional[str] = None) -> Dict:
        """
        Discover digital twin shells using query specifications with DTR tracking and pagination.
        """
        dtrs = self.get_dtrs(counter_party_id)
        if not dtrs:
            return {"shell_descriptors": [], "dtrs": [], "error": "No DTRs found"}
        
        if not query_spec:
            return {"shell_descriptors": [], "dtrs": [], "error": "No query specifications provided"}
        
        # Decode cursor or initialize
        if cursor:
            current_page = PaginationManager.decode_page_token(cursor)
            
            # Check if cursor is compatible with current limit
            if not PaginationManager.is_cursor_compatible(current_page, limit):
                # Cursor is incompatible - start fresh but use DTR cursors as starting point
                # This allows continuing from where we left off but with new limit
                return {
                    "shellDescriptors": [],
                    "dtrs": [],
                    "error": f"Cursor was created with limit {current_page.limit} but request has limit {limit}. Please start pagination from the beginning.",
                    "error": "LIMIT_MISMATCH"
                }
        else:
            # Initialize first page
            current_page = PageState(dtr_states={}, page_number=0, limit=limit)
        
        all_shells = []
        dtr_results = []
        connector_service = self.connector_consumer_manager.connector_service
        
        # Calculate per-DTR limit
        active_dtrs = len([dtr for dtr in dtrs if not current_page.dtr_states.get(dtr.get(self.DTR_ASSET_ID_KEY), DtrPaginationState("")).exhausted])
        per_dtr_limit = PaginationManager.distribute_limit(limit or 50, active_dtrs) if limit else None
        
        # Process DTRs
        new_dtr_states = {}
        for dtr in dtrs:
            asset_id = dtr.get(self.DTR_ASSET_ID_KEY)
            dtr_state = current_page.dtr_states.get(asset_id, DtrPaginationState(asset_id))
            
            if dtr_state.exhausted:
                new_dtr_states[asset_id] = dtr_state
                continue
            
            dtr = self._process_dtr_with_retry(
                connector_service, counter_party_id, dtr, query_spec,
                limit=per_dtr_limit, cursor=dtr_state.cursor
            )
            
            dtr_results.append(dtr)
            shells = dtr.get("shells", [])
            all_shells.extend(shells)
            
            # Update DTR state
            paging_metadata = dtr.get("paging_metadata", {})
            new_cursor = paging_metadata.get("cursor")
            new_dtr_states[asset_id] = DtrPaginationState(
                asset_id=asset_id,
                cursor=new_cursor,
                exhausted=not new_cursor
            )
            
            # Stop if we've reached the total limit
            if limit and len(all_shells) >= limit:
                all_shells = all_shells[:limit]
                break
        
        # Create new page state with reference to current page as previous
        new_page = PageState(
            dtr_states=new_dtr_states,
            page_number=current_page.page_number + 1,
            limit=limit,  # Store the limit used for this page
            previous_state=current_page  # Store current page as previous state
        )
        
        # Get shell descriptors
        shell_descriptors = [self.shell_descriptors.get(shell_id) for shell_id in all_shells if shell_id in self.shell_descriptors]
        
        # Generate pagination tokens - only include pagination if limit or cursor was provided
        pagination_enabled = limit is not None or cursor is not None
        
        response = {
            "shellDescriptors": shell_descriptors,
            "dtrs": dtr_results,
            "shellsFound": len(shell_descriptors)
        }
        
        if pagination_enabled:
            # Generate next cursor if there's more data
            has_more = PaginationManager.has_more_data(new_dtr_states)
            next_cursor = PaginationManager.encode_page_token(new_page) if has_more else None
            
            # Generate previous cursor if we have a previous state
            previous_cursor = None
            if current_page.previous_state is not None:
                previous_cursor = PaginationManager.encode_page_token(current_page.previous_state)
            elif current_page.page_number > 0:
                # For cases where we don't have previous_state but page_number > 0
                # This shouldn't happen with proper implementation, but as a fallback
                # we create an empty previous state
                empty_previous = PageState(
                    dtr_states={}, 
                    page_number=current_page.page_number - 1,
                    limit=limit
                )
                previous_cursor = PaginationManager.encode_page_token(empty_previous)
            
            pagination = {
                "page": new_page.page_number
            }
            if next_cursor:
                pagination["next"] = next_cursor
            if previous_cursor:
                pagination["previous"] = previous_cursor
                
            response["pagination"] = pagination
        
        return response

    def _process_dtr_parallel(self, connector_service, counter_party_id: str, dtr: Dict, query_spec: List[Dict], dtr_results: List, limit: Optional[int] = None, cursor: Optional[str] = None) -> None:
        """Process a single DTR in parallel and append result to shared list."""
        dtr = self._process_dtr_with_retry(connector_service, counter_party_id, dtr, query_spec, limit=limit, cursor=cursor)
        with self._lock:  # Thread-safe append to shared list
            dtr_results.append(dtr)

    def _process_dtr_with_retry(self, connector_service, counter_party_id: str, dtr: Dict, query_spec: List[Dict], max_retries: int = 2, limit: Optional[int] = None, cursor: Optional[str] = None) -> Dict:
        """Process a single DTR with retry mechanism."""
        connector_url = dtr.get(self.DTR_CONNECTOR_URL_KEY)
        asset_id = dtr.get(self.DTR_ASSET_ID_KEY)
        policies = dtr.get(self.DTR_POLICIES_KEY, [])
        
        dtr = {
            "connectorUrl": connector_url,
            "assetId": asset_id,
            "status": "failed",
            "shellsFound": 0,
            "shells": []
        }
        
        if not policies:
            dtr["error"] = "No policies found"
            return dtr
        
        filter_expression = connector_service.get_filter_expression(
            key=self.dct_type_key, operator=self.operator, value=self.dct_type
        )
        
        for attempt in range(max_retries + 1):
            try:
                # Establish connection
                dataplane_url, access_token = connector_service.do_dsp(
                    counter_party_id=counter_party_id,
                    counter_party_address=connector_url,
                    policies=policies,
                    filter_expression=filter_expression
                )
                
                # Search for shells
                url = f"{dataplane_url}/lookup/shellsByAssetLink"
                if limit is not None or cursor is not None:
                    query_params = []
                    if limit is not None:
                        query_params.append(f"limit={limit}")
                    if cursor is not None:
                        query_params.append(f"cursor={cursor}")
                    url += "?" + "&".join(query_params)
                
                response = HttpTools.do_post(
                    url=url,
                    headers={"Authorization": f"{access_token}"},
                    json=query_spec
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    shell_ids = self._extract_shell_ids(response_data)
                    shells = self._fetch_shell_descriptors(response_data, dataplane_url, access_token)
                    
                    # Store shell descriptors in central memory
                    for shell in shells:
                        shell_id = shell.get("id")
                        if shell_id:
                            self.shell_descriptors[shell_id] = shell
                    
                    dtr.update({
                        "status": "connected",
                        "shellsFound": len(shell_ids),
                        "shells": shell_ids,  # Store just IDs in DTR info
                        "paging_metadata": response_data.get("paging_metadata", {})
                    })
                    return dtr
                else:
                    # Delete failed connection for retry
                    self._delete_connection(connector_service, counter_party_id, connector_url, policies, filter_expression, counter_party_id, asset_id)
                    
                    if attempt == max_retries:
                        dtr["error"] = f"HTTP {response.status_code} after {max_retries + 1} attempts"
                    
            except Exception as e:
                # Delete failed connection for retry
                self._delete_connection(connector_service, counter_party_id, connector_url, policies, filter_expression, counter_party_id, asset_id)
                
                if attempt == max_retries:
                    dtr["error"] = str(e)
        
        return dtr
    
    def _fetch_shell_descriptor(self, shell_uuid: str, dataplane_url: str, access_token: str) -> Dict:
        """Fetch single shell descriptor by UUID."""
        encoded_uuid = base64.b64encode(shell_uuid.encode('utf-8')).decode('utf-8')
        response = HttpTools.do_get(
            url=f"{dataplane_url}/shell-descriptors/{encoded_uuid}",
            headers={"Authorization": f"{access_token}"}
        )
        if response.status_code == 200:
            return response.json()
        return None
    
    def _fetch_shell_descriptors(self, shells_response: Dict, dataplane_url: str, access_token: str) -> List[Dict]:
        """Fetch shell descriptors from shell UUIDs in parallel."""
        shell_uuids = shells_response.get('result', []) if isinstance(shells_response, dict) else shells_response
        if not shell_uuids:
            return []
        
        shells = []
        threads = []
        
        # Use a thread-safe list to collect results
        def fetch_single_shell(shell_uuid: str, results_list: List[Dict]):
            try:
                shell = self._fetch_shell_descriptor(shell_uuid, dataplane_url, access_token)
                if shell:
                    with self._lock:  # Thread-safe append
                        results_list.append(shell)
            except Exception:
                # Silently continue on error
                pass
        
        # Start threads for parallel fetching
        for shell_uuid in shell_uuids:
            thread = threading.Thread(target=fetch_single_shell, args=(shell_uuid, shells))
            thread.start()
            threads.append(thread)
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        return shells
        
    def _extract_shell_ids(self, shells_response: Dict) -> List[str]:
        """Extract shell IDs from the lookup response."""
        if isinstance(shells_response, dict) and 'result' in shells_response:
            return shells_response.get('result', [])
        elif isinstance(shells_response, list):
            return shells_response
        return []

    def _delete_connection(self, connector_service:BaseConnectorConsumerService, counter_party_id: str, connector_url: str, policies: List, filter_expression: Dict, bpn: str, asset_id: str):
        """Delete failed connection for retry and remove DTR from known DTRs."""
        policies_checksum = hashlib.sha3_256(str(policies).encode('utf-8')).hexdigest()
        filter_checksum = hashlib.sha3_256(str(filter_expression).encode('utf-8')).hexdigest()
        connector_service.connection_manager.delete_connection(
            counter_party_id=counter_party_id,
            counter_party_address=connector_url,
            query_checksum=filter_checksum,
            policy_checksum=policies_checksum
        )
        
        # Also remove the DTR from known_dtrs to avoid retrying problematic DTRs
        with self._lock:
            if bpn in self.known_dtrs and self.DTR_DATA_KEY in self.known_dtrs[bpn]:
                dtr_dict = self.known_dtrs[bpn][self.DTR_DATA_KEY]
                if isinstance(dtr_dict, dict) and asset_id in dtr_dict:
                    del dtr_dict[asset_id]
                    if self.logger and self.verbose:
                        self.logger.info(f"[DTR Manager] [{bpn}] Removed failed DTR with asset ID [{asset_id}] from cache")

    def discover_shell(self, counter_party_id: str, id: str) -> Dict:
        """
        Discover a single digital twin shell by ID with DTR tracking and retry.
        """
        dtrs = self.get_dtrs(counter_party_id)
        if not dtrs:
            return {"status": 404, "error": "No DTRs found for this counterPartyId"}

        if not id:
            return {"status": 400, "error": "No shell ID provided"}
        
        connector_service = self.connector_consumer_manager.connector_service
        
        # Try each DTR to find the shell
        for dtr in dtrs:
            connector_url = dtr.get(self.DTR_CONNECTOR_URL_KEY)
            asset_id = dtr.get(self.DTR_ASSET_ID_KEY)
            policies = dtr.get(self.DTR_POLICIES_KEY, [])
            
            filter_expression = connector_service.get_filter_expression(
                key=self.dct_type_key, operator=self.operator, value=self.dct_type
            )
            
            try:
                # Establish connection
                dataplane_url, access_token = connector_service.do_dsp(
                    counter_party_id=counter_party_id,
                    counter_party_address=connector_url,
                    policies=policies,
                    filter_expression=filter_expression
                )
                
                # Fetch specific shell descriptor
                shell = self._fetch_shell_descriptor(id, dataplane_url, access_token)
                if shell:
                    return {
                        "shell_descriptor": shell,
                        "dtr": {
                            "connectorUrl": connector_url,
                            "assetId": asset_id,
                        }
                    }
                    
            except Exception as e:
                if self.logger and self.verbose:
                    self.logger.debug(f"[DTR Manager] [{counter_party_id}] Failed to fetch shell {id} from DTR {connector_url}: {e}")
                continue

        return {"status": 404, "error": "Shell not found in any DTR of this counterPartyId"}

    def discover_submodels(self, counter_party_id: str, id: str, governance: Optional[Dict[str, List[Dict]]]) -> Dict:
        """
        Retrieve submodel data by first discovering the shell and then fetching all submodels in parallel.
        
        Args:
            counter_party_id: The Business Partner Number
            id: The shell ID to discover
            governance: Optional mapping of semantic IDs to their policies. If None, only submodel 
                       descriptors are returned without actual data (status will be "governance_not_found")
            
        Returns:
            Dict: Response with submodel descriptors, data, DTR info, and count of submodels found
                - submodelDescriptors: Dict mapping submodel IDs to their descriptors with status
                - submodels: Dict mapping submodel IDs to their actual data (if successfully fetched)
                - submodelsFound: Int count of total submodels discovered in the shell
                - dtr: DTR connection information
        """
        # Discover the shell
        shell_result = self.discover_shell(counter_party_id, id)
        if "shell_descriptor" not in shell_result:
            return {
                "status": "error",
                "error": shell_result.get("error", "Failed to discover shell"),
                "submodelDescriptors": {},
                "submodels": {},
                "submodelsFound": 0,
                "dtr": None
            }
            
        shell_descriptor = shell_result["shell_descriptor"]
        dtr_info = shell_result.get("dtr", {})
        submodel_descriptors = shell_descriptor.get("submodelDescriptors", [])
        
        response = {
            "submodelDescriptors": {},
            "submodels": {},
            "dtr": dtr_info
        }
        
        if not submodel_descriptors:
            response["error"] = "No submodels found in shell"
            response["submodelsFound"] = 0
            return response
            
        # Process submodels and collect metadata
        submodels_to_fetch = []
        for submodel in submodel_descriptors:
            submodel_id = submodel.get("id", "unknown")
            semantic_id = self._extract_semantic_id(submodel)
            asset_id, connector_url, href = self._extract_submodel_endpoint_info(submodel)
            semantic_ids_base64 = self._create_semantic_ids_base64(submodel)
            
            # Determine status and prepare descriptor
            descriptor = {
                "semanticId": semantic_id,
                "semanticIdKeys": semantic_ids_base64,
                "assetId": asset_id,
                "connectorUrl": connector_url,
                "href": href,
                "status": self._determine_submodel_status(semantic_id, governance)
            }
            
            # Add error message if needed
            if descriptor["status"] == "error" and not semantic_id:
                descriptor["error"] = "No semantic ID found in submodel descriptor"
            
            response["submodelDescriptors"][submodel_id] = descriptor
            
            # Queue for data fetching if needed (only if governance is provided)
            if governance and descriptor["status"] == "pending":
                submodels_to_fetch.append({
                    "submodel_id": submodel_id,
                    "semantic_id": semantic_id,
                    "policies": governance[semantic_id],
                    "assetId": asset_id,
                    "connectorUrl": connector_url,
                    "href": href
                })
        
        # Fetch submodel data in parallel (only if governance policies are available)
        if submodels_to_fetch:
            self._fetch_submodels_data(counter_party_id, submodels_to_fetch, response)
        
        # Add count of submodels found
        response["submodelsFound"] = len(submodel_descriptors)
        
        return response
        
    def _determine_submodel_status(self, semantic_id: Optional[str], governance: Optional[Dict[str, List[Dict]]]) -> str:
        """Determine the status of a submodel based on its semantic ID and governance policies."""
        if not semantic_id:
            return "error"
        elif not governance:
            return "governance_not_found"
        elif semantic_id not in governance:
            return "governance_not_found"
        else:
            return "pending"
    
    def _fetch_submodels_data(self, counter_party_id: str, submodels_to_fetch: List[Dict], response: Dict) -> None:
        """Fetch submodel data in parallel and update the response."""
        # Group by asset_id for optimization
        assets_to_negotiate = self._group_submodels_by_asset(submodels_to_fetch)
        
        # Negotiate assets in parallel
        asset_tokens = self._negotiate_assets_parallel(counter_party_id, assets_to_negotiate)
        
        # Mark failed negotiations
        self._mark_failed_negotiations(assets_to_negotiate, asset_tokens, response)
        
        # Fetch data in parallel
        self._fetch_data_parallel(submodels_to_fetch, asset_tokens, response)
        
        # Mark any remaining pending items as failed
        self._mark_remaining_pending_as_failed(submodels_to_fetch, response)
    
    def _group_submodels_by_asset(self, submodels_to_fetch: List[Dict]) -> Dict[str, Dict]:
        """Group submodels by asset_id for optimization."""
        assets_to_negotiate = {}
        for item in submodels_to_fetch:
            asset_id = item["assetId"]
            if asset_id and asset_id != "unknown":
                if asset_id not in assets_to_negotiate:
                    assets_to_negotiate[asset_id] = {
                        "connectorUrl": item["connectorUrl"],
                        "policies": item["policies"],
                        "submodels": []
                    }
                assets_to_negotiate[asset_id]["submodels"].append(item)
        return assets_to_negotiate
    
    def _negotiate_assets_parallel(self, counter_party_id: str, assets_to_negotiate: Dict[str, Dict]) -> Dict[str, str]:
        """Negotiate assets in parallel and return successful tokens."""
        asset_tokens = {}
        if not assets_to_negotiate:
            return asset_tokens
            
        with ThreadPoolExecutor(max_workers=min(len(assets_to_negotiate), 10)) as executor:
            future_to_asset = {
                executor.submit(
                    self._negotiate_asset,
                    counter_party_id,
                    asset_id,
                    asset_info["connectorUrl"],
                    asset_info["policies"]
                ): asset_id
                for asset_id, asset_info in assets_to_negotiate.items()
            }
            
            for future in as_completed(future_to_asset):
                asset_id = future_to_asset[future]
                try:
                    token = future.result()
                    if token:
                        asset_tokens[asset_id] = token
                except Exception as e:
                    if self.logger and self.verbose:
                        self.logger.error(f"[DTR Manager] [{counter_party_id}] Error negotiating asset {asset_id}: {e}")
        
        return asset_tokens
    
    def _mark_failed_negotiations(self, assets_to_negotiate: Dict[str, Dict], asset_tokens: Dict[str, str], response: Dict) -> None:
        """Mark submodels with failed asset negotiations."""
        failed_assets = set(assets_to_negotiate.keys()) - set(asset_tokens.keys())
        for asset_id in failed_assets:
            for submodel_item in assets_to_negotiate[asset_id]["submodels"]:
                submodel_id = submodel_item["submodel_id"]
                response["submodelDescriptors"][submodel_id]["status"] = "error"
                response["submodelDescriptors"][submodel_id]["error"] = "Asset negotiation failed"
    
    def _fetch_data_parallel(self, submodels_to_fetch: List[Dict], asset_tokens: Dict[str, str], response: Dict) -> None:
        """Fetch submodel data in parallel."""
        fetch_tasks = [
            item for item in submodels_to_fetch 
            if item["assetId"] in asset_tokens
        ]
        
        if not fetch_tasks:
            return
            
        with ThreadPoolExecutor(max_workers=min(len(fetch_tasks), 20)) as executor:
            future_to_submodel = {
                executor.submit(
                    self._fetch_submodel_data_with_token,
                    item["submodel_id"],
                    item["href"],
                    asset_tokens[item["assetId"]]
                ): item["submodel_id"]
                for item in fetch_tasks
            }
            
            for future in as_completed(future_to_submodel):
                submodel_id = future_to_submodel[future]
                try:
                    data = future.result()
                    if data:
                        response["submodels"][submodel_id] = data
                        response["submodelDescriptors"][submodel_id]["status"] = "success"
                    else:
                        response["submodelDescriptors"][submodel_id]["status"] = "error"
                        response["submodelDescriptors"][submodel_id]["error"] = "Data fetch returned no data"
                except Exception as e:
                    response["submodelDescriptors"][submodel_id]["status"] = "error"
                    response["submodelDescriptors"][submodel_id]["error"] = f"Data fetch failed: {str(e)}"
                    if self.logger and self.verbose:
                        self.logger.error(f"[DTR Manager] Error fetching submodel {submodel_id}: {e}")
    
    def _mark_remaining_pending_as_failed(self, submodels_to_fetch: List[Dict], response: Dict) -> None:
        """Mark any remaining pending submodels as failed."""
        for item in submodels_to_fetch:
            submodel_id = item["submodel_id"]
            if response["submodelDescriptors"][submodel_id]["status"] == "pending":
                response["submodelDescriptors"][submodel_id]["status"] = "error"
                response["submodelDescriptors"][submodel_id]["error"] = "Processing was not completed"

    def _extract_semantic_id(self, submodel_descriptor: Dict) -> Optional[str]:
        """Extract semantic ID from submodel descriptor."""
        semantic_id = submodel_descriptor.get("semanticId", {})
        if isinstance(semantic_id, dict):
            keys = semantic_id.get("keys", [])
            if keys and isinstance(keys, list) and len(keys) > 0:
                first_key = keys[0]
                if isinstance(first_key, dict):
                    return first_key.get("value")
        return None
        
    def _extract_submodel_endpoint_info(self, submodel: Dict) -> tuple:
        """Extract asset_id, connector_url, and href from submodel descriptor."""
        asset_id = "unknown"
        connector_url = "unknown"
        href = "unknown"
        
        try:
            endpoints = submodel.get("endpoints", [])
            for endpoint in endpoints:
                interface = endpoint.get("interface", "")
                if "SUBMODEL-3.0" in interface:
                    # Extract href
                    href = endpoint.get("protocolInformation", {}).get("href", "unknown")
                    
                    # Extract asset_id and connector_url from subprotocolBody
                    subprotocol_body = endpoint.get("protocolInformation", {}).get("subprotocolBody", "")
                    if subprotocol_body:
                        parsed_body = self._parse_subprotocol_body(subprotocol_body)
                        if parsed_body:
                            asset_id = parsed_body.get("id", "unknown")
                            connector_url = parsed_body.get("dspEndpoint", "unknown")
                    break
                    
        except Exception as e:
            if self.logger and self.verbose:
                self.logger.error(f"[DTR Manager] Error extracting endpoint info: {e}")
                
        return asset_id, connector_url, href

    def _create_semantic_ids_base64(self, submodel: Dict) -> str:
        """Create base64 encoded semantic IDs from submodel descriptor."""
        try:
            import base64
            import json
            
            semantic_id_obj = submodel.get("semanticId", {})
            if semantic_id_obj:
                # Convert semantic ID object to JSON string then encode to base64
                semantic_id_json = json.dumps(semantic_id_obj, sort_keys=True)
                semantic_id_bytes = semantic_id_json.encode('utf-8')
                return base64.b64encode(semantic_id_bytes).decode('utf-8')
            return ""
        except Exception as e:
            if self.logger and self.verbose:
                self.logger.error(f"[DTR Manager] Error creating base64 semantic IDs: {e}")
            return ""

    def _parse_subprotocol_body(self, subprotocol_body: str) -> Optional[Dict[str, str]]:
        """Parse subprotocol body to extract asset ID and DSP endpoint."""
        try:
            parts = subprotocol_body.split(";")
            result = {}
            for part in parts:
                if "=" in part:
                    key, value = part.split("=", 1)
                    result[key] = value
            return result
        except Exception:
            return None

    def _negotiate_asset(self, counter_party_id: str, asset_id: str, dsp_endpoint_url: str, policies: List[Dict]) -> Optional[str]:
        """Negotiate access to a single asset and return the access token."""
        try:
            connector_service = self.connector_consumer_manager.connector_service
            dataplane_url, access_token = connector_service.do_dsp_by_asset_id(
                counter_party_id=counter_party_id,
                counter_party_address=dsp_endpoint_url,
                asset_id=asset_id,
                policies=policies
            )
            return access_token
        except Exception as e:
            if self.logger and self.verbose:
                self.logger.error(f"[DTR Manager] [{counter_party_id}] Error negotiating asset {asset_id}: {e}")
            return None
            
    def _fetch_submodel_data_with_token(self, submodel_id: str, href: str, access_token: str) -> Optional[Dict]:
        """Fetch submodel data using a pre-negotiated access token."""
        try:
            headers = {"Authorization": f"{access_token}"}
            response = HttpTools.do_get(href, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                if self.logger and self.verbose:
                    self.logger.debug(f"[DTR Manager] Failed to fetch submodel {submodel_id} from {href}, status: {response.status_code}")
                return None
        except Exception as e:
            if self.logger and self.verbose:
                self.logger.error(f"[DTR Manager] Error fetching submodel {submodel_id}: {e}")
            return None

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

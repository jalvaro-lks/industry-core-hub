#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 CGI Deutschland B.V. & Co. KG
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

from tractusx_sdk.dataspace.services.discovery import ConnectorDiscoveryService
from managers.enablement_services.consumer.base_connector_consumer_manager import BaseConnectorConsumerManager
from managers.enablement_services.consumer.connector.memory.connector_consumer_memory_manager import ConnectorConsumerMemoryManager
from managers.enablement_services.consumer.connector.database.connector_consumer_database_manager import ConnectorConsumerDatabaseManager
from managers.config.log_manager import LoggingManager
from typing import List, Dict, Optional
import threading
import time

logger = LoggingManager.get_logger(__name__)


class ConnectorConsumerHybridManager(BaseConnectorConsumerManager):
    """
    Hybrid implementation combining memory and database connector consumer management.
    
    This class provides the best of both worlds:
    - Fast access through in-memory caching
    - Persistent storage through PostgreSQL database
    - Automatic fallback mechanisms
    - Background synchronization between memory and database
    """
    
    def __init__(
        self, 
        dct_type: str, 
        connector_discovery: ConnectorDiscoveryService, 
        database_url: str,
        expiration_time: int = 60,
        memory_cache_size: int = 1000,
        enable_background_sync: bool = True,
        sync_interval: int = 300  # 5 minutes
    ):
        """
        Initialize the hybrid connector consumer manager.
        
        Args:
            dct_type (str): The data consumption type identifier
            connector_discovery (ConnectorDiscoveryService): Service for discovering connectors
            database_url (str): PostgreSQL database connection URL
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
            memory_cache_size (int, optional): Maximum size of in-memory cache. Defaults to 1000.
            enable_background_sync (bool, optional): Enable background sync between memory and DB. Defaults to True.
            sync_interval (int, optional): Background sync interval in seconds. Defaults to 300.
        """
        super().__init__(dct_type, connector_discovery, expiration_time)
        
        # Initialize both managers
        self.memory_manager = ConnectorConsumerMemoryManager(
            dct_type=dct_type,
            connector_discovery=connector_discovery,
            expiration_time=expiration_time
        )
        
        self.database_manager = ConnectorConsumerDatabaseManager(
            dct_type=dct_type,
            connector_discovery=connector_discovery,
            database_url=database_url,
            expiration_time=expiration_time,
            memory_cache_size=memory_cache_size
        )
        
        # Background sync setup
        self.enable_background_sync = enable_background_sync
        self.sync_interval = sync_interval
        self._sync_thread = None
        self._stop_sync = threading.Event()
        
        if enable_background_sync:
            self._start_background_sync()
        
        logger.info(f"[HYBRID CONNECTOR Manager] Initialized with memory + database storage, sync interval: {sync_interval}s")

    def _start_background_sync(self):
        """Start the background synchronization thread."""
        self._sync_thread = threading.Thread(target=self._background_sync_worker, daemon=True)
        self._sync_thread.start()
        logger.info("[HYBRID CONNECTOR Manager] Background sync thread started")

    def _background_sync_worker(self):
        """Background worker that synchronizes memory and database caches."""
        while not self._stop_sync.wait(self.sync_interval):
            try:
                self._sync_memory_to_database()
                self._cleanup_expired_entries()
            except Exception as e:
                logger.error(f"[HYBRID CONNECTOR Manager] Background sync error: {e}")

    def _sync_memory_to_database(self):
        """Synchronize memory cache entries to database."""
        try:
            memory_connectors = self.memory_manager.get_known_connectors()
            
            for bpn, cache_data in memory_connectors.items():
                connectors = cache_data.get(self.CONNECTOR_LIST_KEY, [])
                if connectors and not self.database_manager._is_cache_expired(bpn):
                    continue  # Skip if database already has fresh data
                
                if connectors:
                    self.database_manager.add_connectors(bpn, connectors)
            
            logger.debug("[HYBRID CONNECTOR Manager] Memory to database sync completed")
            
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to sync memory to database: {e}")

    def _cleanup_expired_entries(self):
        """Clean up expired entries from both memory and database."""
        try:
            # Database cleanup returns count
            expired_count = self.database_manager.cleanup_expired_entries()
            
            # Memory cleanup - check each entry
            memory_connectors = self.memory_manager.get_known_connectors()
            for bpn in list(memory_connectors.keys()):
                if self.memory_manager._is_cache_expired(bpn):
                    self.memory_manager.purge_bpn(bpn)
            
            if expired_count > 0:
                logger.info(f"[HYBRID CONNECTOR Manager] Cleaned up {expired_count} expired entries")
                
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to cleanup expired entries: {e}")

    def add_connectors(self, bpn: str, connectors: List[str]) -> None:
        """
        Add connectors to both memory and database caches.
        
        Args:
            bpn (str): The Business Partner Number to associate connectors with
            connectors (List[str]): List of connector URLs/endpoints to cache
        """
        # Add to memory first (faster)
        self.memory_manager.add_connectors(bpn, connectors)
        
        # Add to database (persistent)
        try:
            self.database_manager.add_connectors(bpn, connectors)
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to add to database, continuing with memory only: {e}")

    def is_connector_known(self, bpn: str, connector: str) -> bool:
        """
        Check if a specific connector is known in either memory or database cache.
        
        Args:
            bpn (str): The Business Partner Number to check
            connector (str): The connector URL/endpoint to verify
            
        Returns:
            bool: True if the connector is known, False otherwise
        """
        # Check memory first (fastest)
        if self.memory_manager.is_connector_known(bpn, connector):
            return True
        
        # Check database as fallback
        return self.database_manager.is_connector_known(bpn, connector)

    def get_connector_by_id(self, bpn: str, connector_id: str) -> Optional[str]:
        """
        Retrieve a specific connector by its ID from memory or database.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector
            
        Returns:
            Optional[str]: The connector URL/endpoint if found, None otherwise
        """
        # Try memory first
        result = self.memory_manager.get_connector_by_id(bpn, connector_id)
        if result:
            return result
        
        # Try database as fallback
        result = self.database_manager.get_connector_by_id(bpn, connector_id)
        
        # If found in database but not memory, update memory cache
        if result:
            try:
                # Get all connectors for this BPN from database and update memory
                db_connectors = self.database_manager.get_connectors(bpn)
                if db_connectors:
                    self.memory_manager.add_connectors(bpn, db_connectors)
            except Exception as e:
                logger.warning(f"[HYBRID CONNECTOR Manager] Failed to sync database to memory: {e}")
        
        return result

    def get_known_connectors(self) -> Dict:
        """
        Retrieve all known connectors from both memory and database.
        
        Returns:
            Dict: Combined cache dictionary containing all BPNs and their associated connectors
        """
        # Start with memory cache
        memory_connectors = self.memory_manager.get_known_connectors()
        
        # Merge with database cache
        try:
            db_connectors = self.database_manager.get_known_connectors()
            
            # Merge databases connectors that aren't in memory
            for bpn, cache_data in db_connectors.items():
                if bpn not in memory_connectors:
                    memory_connectors[bpn] = cache_data
                else:
                    # Merge connector lists
                    memory_list = memory_connectors[bpn].get(self.CONNECTOR_LIST_KEY, [])
                    db_list = cache_data.get(self.CONNECTOR_LIST_KEY, [])
                    
                    # Combine and deduplicate
                    combined_list = list(set(memory_list + db_list))
                    memory_connectors[bpn][self.CONNECTOR_LIST_KEY] = combined_list
        
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to merge database connectors: {e}")
        
        return memory_connectors

    def delete_connector(self, bpn: str, connector_id: str) -> Dict:
        """
        Remove a specific connector from both memory and database caches.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector to remove
            
        Returns:
            Dict: Updated cache state after deletion
        """
        # Delete from memory
        self.memory_manager.delete_connector(bpn, connector_id)
        
        # Delete from database
        try:
            self.database_manager.delete_connector(bpn, connector_id)
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to delete from database: {e}")
        
        return self.get_known_connectors()

    def purge_bpn(self, bpn: str) -> None:
        """
        Remove all connectors associated with a specific BPN from both caches.
        
        Args:
            bpn (str): The Business Partner Number to purge from cache
        """
        # Purge from memory
        self.memory_manager.purge_bpn(bpn)
        
        # Purge from database
        try:
            self.database_manager.purge_bpn(bpn)
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to purge from database: {e}")

    def purge_cache(self) -> None:
        """
        Clear the entire connector cache from both memory and database.
        """
        # Purge from memory
        self.memory_manager.purge_cache()
        
        # Purge from database
        try:
            self.database_manager.purge_cache()
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to purge database cache: {e}")

    def get_connectors(self, bpn: str) -> List[str]:
        """
        Retrieve connectors for a specific BPN with intelligent caching strategy.
        
        Strategy:
        1. Check memory cache first (fastest)
        2. Check database cache if memory miss
        3. Discover new connectors if both caches miss or expired
        4. Update both caches with new discoveries
        
        Args:
            bpn (str): The Business Partner Number to get connectors for
            
        Returns:
            List[str]: List of connector URLs/endpoints for the BPN
        """
        # Try memory cache first
        if not self.memory_manager._is_cache_expired(bpn):
            memory_connectors = self.memory_manager.get_known_connectors().get(bpn, {})
            if memory_connectors.get(self.CONNECTOR_LIST_KEY):
                logger.debug(f"[HYBRID CONNECTOR Manager] [{bpn}] Served from memory cache")
                return memory_connectors[self.CONNECTOR_LIST_KEY]
        
        # Try database cache if memory miss or expired
        try:
            if not self.database_manager._is_cache_expired(bpn):
                db_connectors = self.database_manager.get_connectors(bpn)
                if db_connectors:
                    # Update memory cache with database data
                    self.memory_manager.add_connectors(bpn, db_connectors)
                    logger.debug(f"[HYBRID CONNECTOR Manager] [{bpn}] Served from database cache, updated memory")
                    return db_connectors
        except Exception as e:
            logger.warning(f"[HYBRID CONNECTOR Manager] Database cache failed, continuing with discovery: {e}")
        
        # Both caches miss or expired, discover new connectors
        logger.info(f"[HYBRID CONNECTOR Manager] No cached CONNECTORs found, discovering CONNECTORs for bpn [{bpn}]...")
        
        try:
            connectors: Optional[List[str]] = self.connector_discovery.find_connector_by_bpn(bpn=bpn)
            
            if connectors is None or len(connectors) == 0:
                return []
            
            # Update both caches
            self.add_connectors(bpn=bpn, connectors=connectors)
            
            return connectors
            
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Discovery failed: {e}")
            return []

    def _is_cache_expired(self, bpn: str) -> bool:
        """
        Check if cache for a specific BPN has expired in both memory and database.
        
        Args:
            bpn (str): The Business Partner Number to check
            
        Returns:
            bool: True if cache is expired in both storages, False if fresh in either
        """
        # If either cache is fresh, consider it not expired
        memory_expired = self.memory_manager._is_cache_expired(bpn)
        
        try:
            database_expired = self.database_manager._is_cache_expired(bpn)
            return memory_expired and database_expired
        except Exception as e:
            logger.warning(f"[HYBRID CONNECTOR Manager] Database expiration check failed: {e}")
            return memory_expired

    def get_cache_statistics(self) -> Dict:
        """
        Get comprehensive statistics about both cache layers.
        
        Returns:
            Dict: Statistics from both memory and database caches
        """
        stats = {
            'cache_type': 'hybrid',
            'memory': {
                'size': len(self.memory_manager.get_known_connectors()),
                'enabled': True
            },
            'database': {
                'enabled': True,
                'connection_url': self.database_manager.database_url
            },
            'background_sync': {
                'enabled': self.enable_background_sync,
                'interval_seconds': self.sync_interval,
                'running': self._sync_thread and self._sync_thread.is_alive() if self._sync_thread else False
            }
        }
        
        # Add database statistics
        try:
            db_stats = self.database_manager.get_cache_statistics()
            stats['database'].update(db_stats)
        except Exception as e:
            logger.error(f"[HYBRID CONNECTOR Manager] Failed to get database statistics: {e}")
            stats['database']['error'] = str(e)
        
        return stats

    def stop_background_sync(self):
        """Stop the background synchronization thread."""
        if self.enable_background_sync and self._sync_thread:
            self._stop_sync.set()
            self._sync_thread.join(timeout=5)
            logger.info("[HYBRID CONNECTOR Manager] Background sync thread stopped")

    def __del__(self):
        """Cleanup when object is destroyed."""
        self.stop_background_sync()

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
from tractusx_sdk.dataspace.tools import op
from managers.config.log_manager import LoggingManager
from managers.enablement_services.consumer.base_connector_consumer_manager import BaseConnectorConsumerManager
from .models import ConnectorCache, ConnectorDiscoveryLog, Base
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, and_, or_
from datetime import datetime, timedelta
import uuid
import hashlib

logger = LoggingManager.get_logger(__name__)


class ConnectorConsumerDatabaseManager(BaseConnectorConsumerManager):
    """
    PostgreSQL-based implementation of connector consumer management.
    
    This class provides persistent caching of connector information with
    time-based expiration stored in a PostgreSQL database. It includes
    both in-memory caching for performance and database persistence for
    durability across application restarts.
    """
    
    def __init__(
        self, 
        dct_type: str, 
        connector_discovery: ConnectorDiscoveryService, 
        database_url: str,
        expiration_time: int = 60,
        memory_cache_size: int = 1000
    ):
        """
        Initialize the database-based connector consumer manager.
        
        Args:
            dct_type (str): The data consumption type identifier
            connector_discovery (ConnectorDiscoveryService): Service for discovering connectors
            database_url (str): PostgreSQL database connection URL
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
            memory_cache_size (int, optional): Maximum size of in-memory cache. Defaults to 1000.
        """
        super().__init__(dct_type, connector_discovery, expiration_time)
        
        # Database setup
        self.database_url = database_url
        self.engine = create_engine(database_url, pool_pre_ping=True, pool_recycle=3600)
        
        # Create tables if they don't exist
        Base.metadata.create_all(self.engine)
        
        # In-memory cache for performance (LRU-style)
        self.memory_cache: Dict[str, Dict] = {}
        self.memory_cache_size = memory_cache_size
        self.memory_cache_access_order: List[str] = []
        
        logger.info(f"[DATABASE CONNECTOR Manager] Initialized with database: {database_url}")

    def _get_session(self) -> Session:
        """
        Create a new database session.
        
        Returns:
            Session: SQLAlchemy database session
        """
        return Session(self.engine)

    def _manage_memory_cache_size(self):
        """
        Ensure memory cache doesn't exceed the maximum size by removing oldest entries.
        """
        while len(self.memory_cache) > self.memory_cache_size:
            if self.memory_cache_access_order:
                oldest_key = self.memory_cache_access_order.pop(0)
                self.memory_cache.pop(oldest_key, None)

    def _update_memory_cache_access(self, bpn: str):
        """
        Update access order for LRU cache management.
        
        Args:
            bpn (str): The BPN that was accessed
        """
        if bpn in self.memory_cache_access_order:
            self.memory_cache_access_order.remove(bpn)
        self.memory_cache_access_order.append(bpn)

    def _log_discovery_attempt(self, bpn: str, success: bool, connectors_found: int = 0, error_message: str = None):
        """
        Log a connector discovery attempt to the database.
        
        Args:
            bpn (str): The BPN that was queried
            success (bool): Whether the discovery was successful
            connectors_found (int): Number of connectors found
            error_message (str, optional): Error message if discovery failed
        """
        try:
            with self._get_session() as session:
                log_entry = ConnectorDiscoveryLog(
                    id=str(uuid.uuid4()),
                    bpn=bpn,
                    discovery_timestamp=datetime.utcnow(),
                    connectors_found=str(connectors_found),
                    success=str(success).lower(),
                    error_message=error_message,
                    dct_type=self.dct_type
                )
                session.add(log_entry)
                session.commit()
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to log discovery attempt: {e}")

    def add_connectors(self, bpn: str, connectors: List[str]) -> None:
        """
        Add connectors to both database and memory cache for a specific BPN.
        
        Implements persistent caching with automatic expiration. Connectors are
        stored in PostgreSQL database and also cached in memory for performance.
        
        Args:
            bpn (str): The Business Partner Number to associate connectors with
            connectors (List[str]): List of connector URLs/endpoints to cache
        """
        if not connectors:
            return

        expires_at = datetime.utcnow() + timedelta(minutes=self.expiration_time)
        
        try:
            with self._get_session() as session:
                # Remove existing entries for this BPN
                session.query(ConnectorCache).filter(ConnectorCache.bpn == bpn).delete()
                
                # Add new connector entries
                cache_entries = []
                for connector_url in connectors:
                    connector_id = self._generate_connector_id(connector_url)
                    cache_entry = ConnectorCache(
                        bpn=bpn,
                        connector_id=connector_id,
                        connector_url=connector_url,
                        expires_at=expires_at,
                        dct_type=self.dct_type
                    )
                    cache_entries.append(cache_entry)
                
                session.add_all(cache_entries)
                session.commit()
                
                # Update memory cache
                self.memory_cache[bpn] = {
                    self.REFRESH_INTERVAL_KEY: op.get_future_timestamp(minutes=self.expiration_time),
                    self.CONNECTOR_LIST_KEY: connectors
                }
                self._update_memory_cache_access(bpn)
                self._manage_memory_cache_size()
                
                logger.info(f"[DATABASE CONNECTOR Manager] [{bpn}] Added [{len(connectors)}] CONNECTORs to database and cache! Next refresh at [{expires_at}] UTC")
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to add connectors for BPN {bpn}: {e}")
            raise

    def is_connector_known(self, bpn: str, connector: str) -> bool:
        """
        Check if a specific connector is known/cached for the given BPN.
        
        First checks memory cache, then database if not found in memory.
        
        Args:
            bpn (str): The Business Partner Number to check
            connector (str): The connector URL/endpoint to verify
            
        Returns:
            bool: True if the connector is known for the BPN, False otherwise
        """
        connector_id = self._generate_connector_id(connector)
        
        # Check memory cache first
        if bpn in self.memory_cache:
            connectors = self.memory_cache[bpn].get(self.CONNECTOR_LIST_KEY, [])
            if connector in connectors:
                self._update_memory_cache_access(bpn)
                return True
        
        # Check database
        try:
            with self._get_session() as session:
                exists = session.query(ConnectorCache).filter(
                    and_(
                        ConnectorCache.bpn == bpn,
                        ConnectorCache.connector_id == connector_id,
                        ConnectorCache.expires_at > datetime.utcnow()
                    )
                ).first() is not None
                
                return exists
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to check connector existence: {e}")
            return False

    def get_connector_by_id(self, bpn: str, connector_id: str) -> Optional[str]:
        """
        Retrieve a specific connector by its ID for the given BPN.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector
            
        Returns:
            Optional[str]: The connector URL/endpoint if found, None otherwise
        """
        try:
            with self._get_session() as session:
                cache_entry = session.query(ConnectorCache).filter(
                    and_(
                        ConnectorCache.bpn == bpn,
                        ConnectorCache.connector_id == connector_id,
                        ConnectorCache.expires_at > datetime.utcnow()
                    )
                ).first()
                
                return cache_entry.connector_url if cache_entry else None
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to get connector by ID: {e}")
            return None

    def get_known_connectors(self) -> Dict:
        """
        Retrieve all known connectors from both memory cache and database.
        
        Returns:
            Dict: Combined cache dictionary containing all BPNs and their associated connectors
        """
        result = {}
        
        # Start with memory cache
        result.update(self.memory_cache)
        
        # Add database entries that aren't in memory cache
        try:
            with self._get_session() as session:
                cache_entries = session.query(ConnectorCache).filter(
                    ConnectorCache.expires_at > datetime.utcnow()
                ).all()
                
                for entry in cache_entries:
                    if entry.bpn not in result:
                        result[entry.bpn] = {
                            self.REFRESH_INTERVAL_KEY: int(entry.expires_at.timestamp()),
                            self.CONNECTOR_LIST_KEY: []
                        }
                    
                    if entry.connector_url not in result[entry.bpn][self.CONNECTOR_LIST_KEY]:
                        result[entry.bpn][self.CONNECTOR_LIST_KEY].append(entry.connector_url)
                        
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to get known connectors: {e}")
        
        return result

    def delete_connector(self, bpn: str, connector_id: str) -> Dict:
        """
        Remove a specific connector from both database and memory cache.
        
        Args:
            bpn (str): The Business Partner Number
            connector_id (str): The unique identifier of the connector to remove
            
        Returns:
            Dict: Updated cache state after deletion
        """
        try:
            with self._get_session() as session:
                # Remove from database
                deleted_count = session.query(ConnectorCache).filter(
                    and_(
                        ConnectorCache.bpn == bpn,
                        ConnectorCache.connector_id == connector_id
                    )
                ).delete()
                session.commit()
                
                # Remove from memory cache if exists
                if bpn in self.memory_cache:
                    connectors = self.memory_cache[bpn].get(self.CONNECTOR_LIST_KEY, [])
                    # Find and remove the connector URL that matches this ID
                    for connector_url in connectors[:]:  # Create a copy to iterate over
                        if self._generate_connector_id(connector_url) == connector_id:
                            connectors.remove(connector_url)
                            break
                
                logger.info(f"[DATABASE CONNECTOR Manager] Deleted {deleted_count} connector(s) for BPN {bpn}")
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to delete connector: {e}")
        
        return self.get_known_connectors()

    def purge_bpn(self, bpn: str) -> None:
        """
        Remove all connectors associated with a specific BPN from both database and memory cache.
        
        Args:
            bpn (str): The Business Partner Number to purge from cache
        """
        try:
            with self._get_session() as session:
                # Remove from database
                deleted_count = session.query(ConnectorCache).filter(
                    ConnectorCache.bpn == bpn
                ).delete()
                session.commit()
                
                # Remove from memory cache
                self.memory_cache.pop(bpn, None)
                if bpn in self.memory_cache_access_order:
                    self.memory_cache_access_order.remove(bpn)
                
                logger.info(f"[DATABASE CONNECTOR Manager] Purged {deleted_count} connector(s) for BPN {bpn}")
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to purge BPN {bpn}: {e}")

    def purge_cache(self) -> None:
        """
        Clear the entire connector cache from both database and memory.
        
        Resets both the database tables and memory cache to empty states.
        """
        try:
            with self._get_session() as session:
                # Remove all entries from database
                deleted_count = session.query(ConnectorCache).delete()
                session.commit()
                
                # Clear memory cache
                self.memory_cache.clear()
                self.memory_cache_access_order.clear()
                
                logger.info(f"[DATABASE CONNECTOR Manager] Purged all {deleted_count} connector(s) from cache")
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to purge cache: {e}")

    def get_connectors(self, bpn: str) -> List[str]:
        """
        Retrieve connectors for a specific BPN, with automatic discovery if not cached.
        
        First checks memory cache, then database cache. If cache is empty or expired,
        uses the connector discovery service to find and cache new connectors.
        
        Args:
            bpn (str): The Business Partner Number to get connectors for
            
        Returns:
            List[str]: List of connector URLs/endpoints for the BPN
        """
        # Check memory cache first
        if bpn in self.memory_cache and not self._is_cache_expired(bpn):
            self._update_memory_cache_access(bpn)
            return self.memory_cache[bpn].get(self.CONNECTOR_LIST_KEY, [])
        
        # Check database cache
        try:
            with self._get_session() as session:
                cache_entries = session.query(ConnectorCache).filter(
                    and_(
                        ConnectorCache.bpn == bpn,
                        ConnectorCache.expires_at > datetime.utcnow()
                    )
                ).all()
                
                if cache_entries:
                    connectors = [entry.connector_url for entry in cache_entries]
                    
                    # Update memory cache
                    self.memory_cache[bpn] = {
                        self.REFRESH_INTERVAL_KEY: op.get_future_timestamp(minutes=self.expiration_time),
                        self.CONNECTOR_LIST_KEY: connectors
                    }
                    self._update_memory_cache_access(bpn)
                    self._manage_memory_cache_size()
                    
                    logger.info(f"[DATABASE CONNECTOR Manager] [{bpn}] Found {len(connectors)} cached CONNECTORs in database")
                    return connectors
                    
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to query database cache: {e}")
        
        # No valid cache found, discover new connectors
        logger.info(f"[DATABASE CONNECTOR Manager] No cached CONNECTORs found, discovering CONNECTORs for bpn [{bpn}]...")
        
        try:
            connectors: Optional[List[str]] = self.connector_discovery.find_connector_by_bpn(bpn=bpn)
            
            if connectors is None or len(connectors) == 0:
                self._log_discovery_attempt(bpn, False, 0, "No connectors found")
                return []
            
            self.add_connectors(bpn=bpn, connectors=connectors)
            self._log_discovery_attempt(bpn, True, len(connectors))
            
            return connectors
            
        except Exception as e:
            error_msg = f"Discovery failed: {str(e)}"
            logger.error(f"[DATABASE CONNECTOR Manager] {error_msg}")
            self._log_discovery_attempt(bpn, False, 0, error_msg)
            return []

    def _is_cache_expired(self, bpn: str) -> bool:
        """
        Check if cache for a specific BPN has expired.
        
        Checks both memory cache and database for expiration status.
        
        Args:
            bpn (str): The Business Partner Number to check
            
        Returns:
            bool: True if cache is expired or doesn't exist, False otherwise
        """
        # Check memory cache first
        if bpn in self.memory_cache:
            if self.REFRESH_INTERVAL_KEY in self.memory_cache[bpn]:
                return op.is_interval_reached(self.memory_cache[bpn][self.REFRESH_INTERVAL_KEY])
        
        # Check database cache
        try:
            with self._get_session() as session:
                cache_entry = session.query(ConnectorCache).filter(
                    and_(
                        ConnectorCache.bpn == bpn,
                        ConnectorCache.expires_at > datetime.utcnow()
                    )
                ).first()
                
                return cache_entry is None
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to check cache expiration: {e}")
            return True

    def cleanup_expired_entries(self) -> int:
        """
        Remove expired entries from the database.
        
        This method should be called periodically to clean up expired cache entries.
        
        Returns:
            int: Number of expired entries removed
        """
        try:
            with self._get_session() as session:
                deleted_count = session.query(ConnectorCache).filter(
                    ConnectorCache.expires_at <= datetime.utcnow()
                ).delete()
                session.commit()
                
                logger.info(f"[DATABASE CONNECTOR Manager] Cleaned up {deleted_count} expired cache entries")
                return deleted_count
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to cleanup expired entries: {e}")
            return 0

    def get_cache_statistics(self) -> Dict:
        """
        Get statistics about the cache state.
        
        Returns:
            Dict: Statistics including total entries, expired entries, memory cache size, etc.
        """
        stats = {
            'memory_cache_size': len(self.memory_cache),
            'memory_cache_max_size': self.memory_cache_size,
            'database_total_entries': 0,
            'database_active_entries': 0,
            'database_expired_entries': 0
        }
        
        try:
            with self._get_session() as session:
                # Total entries
                stats['database_total_entries'] = session.query(ConnectorCache).count()
                
                # Active entries (not expired)
                stats['database_active_entries'] = session.query(ConnectorCache).filter(
                    ConnectorCache.expires_at > datetime.utcnow()
                ).count()
                
                # Expired entries
                stats['database_expired_entries'] = session.query(ConnectorCache).filter(
                    ConnectorCache.expires_at <= datetime.utcnow()
                ).count()
                
        except Exception as e:
            logger.error(f"[DATABASE CONNECTOR Manager] Failed to get cache statistics: {e}")
        
        return stats

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

from typing import Union, Optional
from tractusx_sdk.dataspace.services.discovery import ConnectorDiscoveryService
from managers.enablement_services.consumer.base_connector_consumer_manager import BaseConnectorConsumerManager
from managers.enablement_services.consumer.connector.memory.connector_consumer_memory_manager import ConnectorConsumerMemoryManager
from managers.enablement_services.consumer.connector.database.connector_consumer_database_manager import ConnectorConsumerDatabaseManager
from managers.enablement_services.consumer.connector.hybrid.connector_consumer_hybrid_manager import ConnectorConsumerHybridManager
from managers.config.log_manager import LoggingManager
from enum import Enum

logger = LoggingManager.get_logger(__name__)


class ConnectorManagerType(Enum):
    """Enumeration of available connector manager types."""
    MEMORY = "memory"
    DATABASE = "database" 
    HYBRID = "hybrid"


class ConnectorConsumerManagerFactory:
    """
    Factory class for creating different types of connector consumer managers.
    
    This factory provides a unified interface for creating memory-based,
    database-based, or hybrid connector consumer managers based on configuration.
    """
    
    @staticmethod
    def create_manager(
        manager_type: Union[ConnectorManagerType, str],
        dct_type: str,
        connector_discovery: ConnectorDiscoveryService,
        database_url: Optional[str] = None,
        expiration_time: int = 60,
        memory_cache_size: int = 1000,
        enable_background_sync: bool = True,
        sync_interval: int = 300
    ) -> BaseConnectorConsumerManager:
        """
        Create a connector consumer manager based on the specified type.
        
        Args:
            manager_type (Union[ConnectorManagerType, str]): Type of manager to create
            dct_type (str): The data consumption type identifier
            connector_discovery (ConnectorDiscoveryService): Service for discovering connectors
            database_url (Optional[str]): PostgreSQL database connection URL (required for database/hybrid)
            expiration_time (int, optional): Cache expiration time in minutes. Defaults to 60.
            memory_cache_size (int, optional): Maximum size of in-memory cache. Defaults to 1000.
            enable_background_sync (bool, optional): Enable background sync for hybrid. Defaults to True.
            sync_interval (int, optional): Background sync interval in seconds. Defaults to 300.
            
        Returns:
            BaseConnectorConsumerManager: The created manager instance
            
        Raises:
            ValueError: If invalid manager type or missing required parameters
            ImportError: If required dependencies are not available
        """
        # Convert string to enum if needed
        if isinstance(manager_type, str):
            try:
                manager_type = ConnectorManagerType(manager_type.lower())
            except ValueError:
                raise ValueError(f"Invalid manager type: {manager_type}. Valid types: {[t.value for t in ConnectorManagerType]}")
        
        logger.info(f"[CONNECTOR FACTORY] Creating {manager_type.value} connector manager")
        
        if manager_type == ConnectorManagerType.MEMORY:
            return ConnectorConsumerManagerFactory._create_memory_manager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                expiration_time=expiration_time
            )
        
        elif manager_type == ConnectorManagerType.DATABASE:
            if not database_url:
                raise ValueError("database_url is required for database manager type")
            
            return ConnectorConsumerManagerFactory._create_database_manager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                database_url=database_url,
                expiration_time=expiration_time,
                memory_cache_size=memory_cache_size
            )
        
        elif manager_type == ConnectorManagerType.HYBRID:
            if not database_url:
                raise ValueError("database_url is required for hybrid manager type")
            
            return ConnectorConsumerManagerFactory._create_hybrid_manager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                database_url=database_url,
                expiration_time=expiration_time,
                memory_cache_size=memory_cache_size,
                enable_background_sync=enable_background_sync,
                sync_interval=sync_interval
            )
        
        else:
            raise ValueError(f"Unsupported manager type: {manager_type}")

    @staticmethod
    def _create_memory_manager(
        dct_type: str,
        connector_discovery: ConnectorDiscoveryService,
        expiration_time: int
    ) -> ConnectorConsumerMemoryManager:
        """Create a memory-based connector consumer manager."""
        try:
            manager = ConnectorConsumerMemoryManager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                expiration_time=expiration_time
            )
            logger.info("[CONNECTOR FACTORY] Memory manager created successfully")
            return manager
            
        except Exception as e:
            logger.error(f"[CONNECTOR FACTORY] Failed to create memory manager: {e}")
            raise

    @staticmethod
    def _create_database_manager(
        dct_type: str,
        connector_discovery: ConnectorDiscoveryService,
        database_url: str,
        expiration_time: int,
        memory_cache_size: int
    ) -> ConnectorConsumerDatabaseManager:
        """Create a database-based connector consumer manager."""
        try:
            # Validate database URL format
            if not database_url.startswith(('postgresql://', 'postgresql+psycopg2://', 'postgresql+asyncpg://')):
                logger.warning("[CONNECTOR FACTORY] Database URL doesn't appear to be PostgreSQL format")
            
            manager = ConnectorConsumerDatabaseManager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                database_url=database_url,
                expiration_time=expiration_time,
                memory_cache_size=memory_cache_size
            )
            logger.info("[CONNECTOR FACTORY] Database manager created successfully")
            return manager
            
        except Exception as e:
            logger.error(f"[CONNECTOR FACTORY] Failed to create database manager: {e}")
            raise

    @staticmethod
    def _create_hybrid_manager(
        dct_type: str,
        connector_discovery: ConnectorDiscoveryService,
        database_url: str,
        expiration_time: int,
        memory_cache_size: int,
        enable_background_sync: bool,
        sync_interval: int
    ) -> ConnectorConsumerHybridManager:
        """Create a hybrid connector consumer manager."""
        try:
            # Validate database URL format
            if not database_url.startswith(('postgresql://', 'postgresql+psycopg2://', 'postgresql+asyncpg://')):
                logger.warning("[CONNECTOR FACTORY] Database URL doesn't appear to be PostgreSQL format")
            
            manager = ConnectorConsumerHybridManager(
                dct_type=dct_type,
                connector_discovery=connector_discovery,
                database_url=database_url,
                expiration_time=expiration_time,
                memory_cache_size=memory_cache_size,
                enable_background_sync=enable_background_sync,
                sync_interval=sync_interval
            )
            logger.info("[CONNECTOR FACTORY] Hybrid manager created successfully")
            return manager
            
        except Exception as e:
            logger.error(f"[CONNECTOR FACTORY] Failed to create hybrid manager: {e}")
            raise

    @staticmethod
    def create_from_config(config: dict) -> BaseConnectorConsumerManager:
        """
        Create a connector consumer manager from a configuration dictionary.
        
        Expected configuration format:
        {
            "type": "memory|database|hybrid",
            "dct_type": "string",
            "database_url": "postgresql://...",  # required for database/hybrid
            "expiration_time": 60,
            "memory_cache_size": 1000,
            "enable_background_sync": true,  # for hybrid only
            "sync_interval": 300  # for hybrid only
        }
        
        Args:
            config (dict): Configuration dictionary
            
        Returns:
            BaseConnectorConsumerManager: The created manager instance
            
        Raises:
            ValueError: If required configuration is missing
        """
        required_fields = ['type', 'dct_type']
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required configuration field: {field}")
        
        # Note: connector_discovery would need to be injected separately
        # as it's not typically serializable in config
        logger.warning("[CONNECTOR FACTORY] create_from_config requires connector_discovery to be injected separately")
        
        return ConnectorConsumerManagerFactory.create_manager(
            manager_type=config['type'],
            dct_type=config['dct_type'],
            connector_discovery=None,  # Must be provided separately
            database_url=config.get('database_url'),
            expiration_time=config.get('expiration_time', 60),
            memory_cache_size=config.get('memory_cache_size', 1000),
            enable_background_sync=config.get('enable_background_sync', True),
            sync_interval=config.get('sync_interval', 300)
        )

    @staticmethod
    def get_available_types() -> list:
        """
        Get a list of available connector manager types.
        
        Returns:
            list: List of available manager type strings
        """
        return [manager_type.value for manager_type in ConnectorManagerType]

    @staticmethod
    def get_type_info() -> dict:
        """
        Get information about each available manager type.
        
        Returns:
            dict: Dictionary with manager type info
        """
        return {
            ConnectorManagerType.MEMORY.value: {
                "description": "In-memory caching only, fastest but not persistent",
                "persistent": False,
                "requires_database": False,
                "performance": "fastest",
                "use_case": "Development, testing, or when persistence is not needed"
            },
            ConnectorManagerType.DATABASE.value: {
                "description": "PostgreSQL-based persistent caching with in-memory layer",
                "persistent": True,
                "requires_database": True,
                "performance": "moderate",
                "use_case": "Production environments requiring persistence"
            },
            ConnectorManagerType.HYBRID.value: {
                "description": "Best of both worlds with memory and database layers plus background sync",
                "persistent": True,
                "requires_database": True,
                "performance": "fast with persistence",
                "use_case": "Production environments requiring both speed and reliability"
            }
        }

#################################################################################
# Eclipse Tractus-X - Industry Core Hub Backend
#
# Copyright (c) 2025 LKS Next
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
## Code created partially using a LLM and reviewed by a human committer

import threading
import logging
from typing import Optional
from managers.config.config_manager import ConfigManager
from managers.config.log_manager import LoggingManager
from managers.enablement_services.provider import ConnectorProviderManager

logger = LoggingManager.get_logger(__name__)


class AssetSyncJob:
    """
    Background job that synchronizes EDC assets (Digital Twin Registry and Semantic assets) 
    from the database/configuration to the connector on startup.
    
    This ensures all assets are registered in the connector before any sharing operations occur.
    """
    
    def __init__(self, connector_provider_manager: ConnectorProviderManager, enabled: bool = True):
        """
        Initialize the asset sync job.
        
        Args:
            connector_provider_manager: The connector provider manager instance
            enabled (bool): Whether the sync job is enabled. Defaults to True.
        """
        self.connector_provider_manager = connector_provider_manager
        self.enabled = enabled
        self._sync_thread: Optional[threading.Thread] = None
        self._is_running = False
        
    def start_sync(self, blocking: bool = False) -> None:
        """
        Start the asset synchronization process.
        
        Args:
            blocking (bool): If True, sync runs in current thread. If False, runs in background thread.
        """
        if not self.enabled:
            logger.info("[AssetSyncJob] Asset synchronization is disabled.")
            return
            
        if self._is_running:
            logger.warning("[AssetSyncJob] Sync is already running. Skipping duplicate start.")
            return
        
        if blocking:
            self._run_sync()
        else:
            self._sync_thread = threading.Thread(target=self._run_sync, daemon=True, name="AssetSyncJob")
            self._sync_thread.start()
            logger.info("[AssetSyncJob] Background sync thread started.")
    
    def _run_sync(self) -> None:
        """
        Execute the synchronization process.
        """
        self._is_running = True
        try:
            logger.info("[AssetSyncJob] Starting asset synchronization...")
            
            # Step 1: Sync Digital Twin Registry asset
            self._sync_dtr_asset()
            
            # Step 2: Sync all semantic assets from agreements configuration
            self._sync_semantic_assets()
            
            logger.info("[AssetSyncJob] Asset synchronization completed successfully.")
            
        except Exception as e:
            logger.error(f"[AssetSyncJob] Asset synchronization failed: {e}", exc_info=True)
        finally:
            self._is_running = False
    
    def _sync_dtr_asset(self) -> None:
        """
        Synchronize the Digital Twin Registry asset with the connector.
        """
        try:
            logger.info("[AssetSyncJob] Synchronizing Digital Twin Registry asset...")
            
            # Get DTR configuration
            dtr_config = ConfigManager.get_config("provider.digitalTwinRegistry")
            if not dtr_config:
                logger.warning("[AssetSyncJob] No Digital Twin Registry configuration found. Skipping DTR sync.")
                return
            
            asset_config = dtr_config.get("asset_config", {})
            
            # Register DTR asset
            dtr_asset_id, _, _, _ = self.connector_provider_manager.register_dtr_offer(
                base_dtr_url=dtr_config.get("hostname"),
                uri=dtr_config.get("uri"),
                api_path=dtr_config.get("apiPath"),
                dtr_policy_config=dtr_config.get("policy"),
                dct_type=asset_config.get("dct_type", "https://w3id.org/catenax/taxonomy#DigitalTwinRegistry"),
                existing_asset_id=asset_config.get("existing_asset_id", None)
            )
            
            if dtr_asset_id:
                logger.info(f"[AssetSyncJob] Digital Twin Registry asset synchronized: {dtr_asset_id}")
            else:
                logger.error("[AssetSyncJob] Failed to synchronize Digital Twin Registry asset.")
                
        except Exception as e:
            logger.error(f"[AssetSyncJob] Error synchronizing DTR asset: {e}", exc_info=True)
    
    def _sync_semantic_assets(self) -> None:
        """
        Synchronize all semantic assets (PartTypeInformation, SerialPart, etc.) from agreements configuration.
        """
        try:
            logger.info("[AssetSyncJob] Synchronizing semantic assets...")
            
            # Get agreements configuration
            agreements = ConfigManager.get_config("agreements", [])
            if not agreements:
                logger.warning("[AssetSyncJob] No agreements configuration found. Skipping semantic asset sync.")
                return
            
            synced_count = 0
            failed_count = 0
            
            # Process each semantic ID from agreements
            for agreement in agreements:
                semantic_id = agreement.get("semanticid")
                if not semantic_id:
                    logger.warning("[AssetSyncJob] Agreement missing 'semanticid'. Skipping.")
                    continue
                
                try:
                    # Register the semantic asset
                    asset_id, _, _, _ = self.connector_provider_manager.register_submodel_bundle_circular_offer(
                        semantic_id=semantic_id
                    )
                    
                    if asset_id:
                        logger.info(f"[AssetSyncJob] Semantic asset synchronized: {semantic_id} -> {asset_id}")
                        synced_count += 1
                    else:
                        logger.error(f"[AssetSyncJob] Failed to synchronize semantic asset: {semantic_id}")
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"[AssetSyncJob] Error synchronizing semantic asset {semantic_id}: {e}", exc_info=True)
                    failed_count += 1
            
            logger.info(f"[AssetSyncJob] Semantic asset sync complete. Synced: {synced_count}, Failed: {failed_count}")
            
        except Exception as e:
            logger.error(f"[AssetSyncJob] Error synchronizing semantic assets: {e}", exc_info=True)
    
    def wait_for_completion(self, timeout: Optional[float] = None) -> bool:
        """
        Wait for the sync job to complete (if running in background thread).
        
        Args:
            timeout (float): Maximum time to wait in seconds. None means wait indefinitely.
            
        Returns:
            bool: True if sync completed, False if timeout occurred or not running.
        """
        if self._sync_thread and self._sync_thread.is_alive():
            self._sync_thread.join(timeout=timeout)
            return not self._sync_thread.is_alive()
        return not self._is_running
    
    def is_running(self) -> bool:
        """
        Check if the sync job is currently running.
        
        Returns:
            bool: True if sync is in progress, False otherwise.
        """
        return self._is_running

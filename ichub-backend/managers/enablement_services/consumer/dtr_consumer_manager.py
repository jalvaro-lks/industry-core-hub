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

from typing import TYPE_CHECKING, Dict, List

if TYPE_CHECKING:
    from ..connector_manager import ConnectorManager

class DtrConsumerManager:
    def __init__(self, connector_manager: 'ConnectorManager'):
        self.connector_manager = connector_manager
        self.known_dtr_registries: Dict = dict()
        
    def search_digital_twin_registries(self, bpn: str) -> List[str]:
        """
        Search for digital twin registries based on BPN and/or name.
        
        Args:
            bpn (str): Business Partner Number to search for
            
        Returns:
            List[str]: List of connector URLs for the BPN
            
        Raises:
            ValueError: If no digital twin registries found for the BPN
        """
        connectors: List[str] = self.connector_manager.consumer.get_connectors(bpn)
        
        if connectors is None or len(connectors) == 0:
            raise ValueError(f"No digital twin registries found for BPN: {bpn}")
        
        return connectors
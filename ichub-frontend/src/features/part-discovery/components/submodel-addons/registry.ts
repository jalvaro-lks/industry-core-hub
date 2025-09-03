/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2025 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { SubmodelAddonConfig, SubmodelAddonRegistry } from './types';

/**
 * Utility function to match semantic ID against patterns
 */
function matchesPattern(semanticId: string, pattern: string): boolean {
  // Convert wildcard pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(semanticId);
}

/**
 * Default implementation of canHandle using semantic ID patterns
 */
function createCanHandleFunction(patterns: string[]) {
  return (semanticId: string): boolean => {
    return patterns.some(pattern => matchesPattern(semanticId, pattern));
  };
}

/**
 * Create a new submodel add-on registry
 */
export function createSubmodelAddonRegistry(): SubmodelAddonRegistry {
  const addons = new Map<string, SubmodelAddonConfig>();

  return {
    addons,
    
    register(config: SubmodelAddonConfig) {
      // If no custom canHandle function provided, create one from patterns
      if (!config.canHandle && config.semanticIdPatterns.length > 0) {
        config.canHandle = createCanHandleFunction(config.semanticIdPatterns);
      }
      
      addons.set(config.id, config);
      console.log(`Registered submodel add-on: ${config.name} (${config.id})`);
    },

    getAddon(semanticId: string): SubmodelAddonConfig | null {
      const candidates = Array.from(addons.values())
        .filter(addon => addon.canHandle(semanticId))
        .sort((a, b) => b.priority - a.priority); // Sort by priority descending

      return candidates.length > 0 ? candidates[0] : null;
    },

    getAllAddons(): SubmodelAddonConfig[] {
      return Array.from(addons.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
  };
}

/**
 * Global registry instance
 */
export const submodelAddonRegistry = createSubmodelAddonRegistry();

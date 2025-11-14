/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2025 LKS Next
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

/**
 * Schema registry for managing different schema types and versions
 */

import { 
  DPP_SCHEMA_METADATA, 
  DPPSchema, 
  DPP_COMPREHENSIVE_FORM_FIELDS, 
  createDefaultDPP, 
  validateDPP,
  getDPPFieldGroups,
  getDPPRequiredFields,
  getDPPOptionalFields
} from './dpp/dpp-v6.1.0';

// Helper function to get value from nested object path
const getValueByPath = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current && current[key], obj);
};

export interface SchemaMetadata {
  name: string;
  version: string;
  semanticId: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  namespace?: string; // Optional namespace for schema identification
}

export interface SchemaDefinition<T = any> {
  metadata: SchemaMetadata;
  formFields: any[];
  createDefault: (params?: any) => Partial<T>;
  validate?: (data: Partial<T>) => { isValid: boolean; errors: string[] };
}

/**
 * Registry of all available schemas
 */
const SCHEMA_REGISTRY: Record<string, SchemaDefinition> = {
  'dpp-v6.1.0': {
    metadata: DPP_SCHEMA_METADATA,
    formFields: DPP_COMPREHENSIVE_FORM_FIELDS,
    createDefault: createDefaultDPP,
    validate: validateDPP
  }
  // Future schemas can be added here
};

/**
 * Get all available schemas
 */
export const getAvailableSchemas = (): SchemaDefinition[] => {
  return Object.values(SCHEMA_REGISTRY);
};

/**
 * Get schema by key
 */
export const getSchema = (key: string): SchemaDefinition | undefined => {
  return SCHEMA_REGISTRY[key];
};

/**
 * Export the schema registry for direct access
 */
export { SCHEMA_REGISTRY };

/**
 * Schema types export
 */
export type { DPPSchema, DPPFormField } from './dpp/dpp-v6.1.0';
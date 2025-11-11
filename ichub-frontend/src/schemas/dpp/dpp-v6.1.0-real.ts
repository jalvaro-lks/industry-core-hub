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
 * Digital Product Passport Schema v6.1.0
 * Uses real JSON Schema interpretation from DigitalProductPassport-schema.json
 */

import { interpretJSONSchema, JSONSchema } from '../json-schema-interpreter';
import digitalProductPassportSchema from '../DigitalProductPassport-schema.json';

// Cast the imported JSON as JSONSchema type
const dppJsonSchema = digitalProductPassportSchema as JSONSchema;

// Generate form configuration from real JSON Schema
const dppSchemaConfig = interpretJSONSchema(dppJsonSchema);

// Schema constants
export const DPP_SCHEMA_VERSION = '6.1.0';
export const DPP_SEMANTIC_ID = 'urn:samm:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport';

// Export the generated form fields and functions
export const DPP_FORM_FIELDS = dppSchemaConfig.formFields;
export const createDefaultDPP = dppSchemaConfig.createDefault;
export const validateDPP = dppSchemaConfig.validate;

// TypeScript interface generated from the JSON Schema (simplified for type safety)
export interface DPPSchema {
  metadata: {
    version: string;
    specVersion?: string;
    status: 'draft' | 'approved' | 'invalid' | 'expired';
    expirationDate: string;
    issueDate: string;
    economicOperatorId: string;
    passportIdentifier: string;
    predecessor: string;
    backupReference: string;
    registrationIdentifier?: string;
    lastModification?: string;
    language: string;
  };
  identification: {
    localIdentifiers?: Array<{
      key: string;
      value: string;
    }>;
    gtin?: string;
    commodityCodes?: Array<{
      name: string;
      value: string;
    }>;
    [key: string]: any;
  };
  operation?: {
    [key: string]: any;
  };
  handling?: {
    [key: string]: any;
  };
  characteristics?: {
    [key: string]: any;
  };
  commercial?: {
    [key: string]: any;
  };
  materials?: {
    [key: string]: any;
  };
  sustainability?: {
    [key: string]: any;
  };
  sources?: Array<{
    [key: string]: any;
  }>;
  additionalData?: Array<{
    label: string;
    description: string;
    type: string;
    [key: string]: any;
  }>;
}

/**
 * Schema metadata for UI display
 */
export const DPP_SCHEMA_METADATA = {
  name: 'Digital Product Passport',
  version: DPP_SCHEMA_VERSION,
  semanticId: DPP_SEMANTIC_ID,
  description: 'Official Digital Product Passport v6.1.0 based on ESPR regulation. Contains comprehensive product information including metadata, identification, sustainability data, and lifecycle information.',
  icon: 'DPP',
  color: '#1976d2',
  tags: ['sustainability', 'traceability', 'compliance', 'espr', 'regulation']
};
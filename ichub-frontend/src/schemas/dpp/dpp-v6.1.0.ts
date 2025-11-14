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

// Export ALL comprehensive interpreter functions
export const validateDPP = dppSchemaConfig.validate;
export const createDefaultDPPFromSchema = dppSchemaConfig.createDefault;
export const getDPPFieldGroups = dppSchemaConfig.getFieldGroups;
export const getDPPFieldByKey = dppSchemaConfig.getFieldByKey;
export const getDPPRequiredFields = dppSchemaConfig.getRequiredFields;
export const getDPPOptionalFields = dppSchemaConfig.getOptionalFields;

// Export the comprehensive form fields from the interpreter
export const DPP_COMPREHENSIVE_FORM_FIELDS = dppSchemaConfig.formFields;

// TypeScript interface generated from the JSON Schema (simplified for type safety)
export interface DPPSchema {
  // General Information
  productIdentifier: {
    manufacturerPartId: string;
    customerPartId?: string;
    globalAssetId?: string;
  };
  
  // Product Description
  productDescription: {
    name: string;
    description?: string;
    category?: string;
    keywords?: string[];
  };
  
  // Manufacturing Information
  manufacturingInformation: {
    manufacturerId: string;
    manufacturerName?: string;
    productionDate?: string;
    productionLocation?: string;
    batchNumber?: string;
  };
  
  // Sustainability Information
  sustainabilityInformation?: {
    carbonFootprint?: number;
    materialComposition?: Array<{
      material: string;
      percentage: number;
      recyclable?: boolean;
    }>;
    recyclabilityRate?: number;
    energyConsumption?: number;
  };
  
  // Compliance Information
  complianceInformation?: {
    regulations?: string[];
    certifications?: Array<{
      name: string;
      issuer: string;
      validFrom?: string;
      validTo?: string;
    }>;
    standards?: string[];
  };
  
  // Physical Dimensions
  physicalDimensions?: {
    weight?: number;
    height?: number;
    width?: number;
    length?: number;
    volume?: number;
  };
  
  // Lifecycle Information
  lifecycleInformation?: {
    expectedLifespan?: number;
    warrantyPeriod?: number;
    maintenanceInstructions?: string;
    endOfLifeInstructions?: string;
  };
  
  // Supply Chain Information
  supplyChainInformation?: {
    suppliers?: Array<{
      name: string;
      role: string;
      location?: string;
    }>;
    transportationInformation?: {
      method: string;
      distance?: number;
      emissions?: number;
    };
  };
}

/**
 * Form field configuration for dynamic form generation
 */
export interface DPPFormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'array';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minItems?: number;
    maxItems?: number;
  };
  section: string;
  description?: string;
  // Array-specific properties
  itemType?: 'string' | 'number' | 'object';
  itemFields?: DPPFormField[];
}

export const DPP_FORM_FIELDS: DPPFormField[] = [
  // Product Identifier Section
  {
    key: 'productIdentifier.manufacturerPartId',
    label: 'Manufacturer Part ID',
    type: 'text',
    required: true,
    section: 'Product Identifier',
    description: 'Unique identifier assigned by the manufacturer'
  },
  {
    key: 'productIdentifier.customerPartId',
    label: 'Customer Part ID',
    type: 'text',
    section: 'Product Identifier',
    description: 'Optional identifier assigned by the customer'
  },
  {
    key: 'productIdentifier.globalAssetId',
    label: 'Global Asset ID',
    type: 'text',
    section: 'Product Identifier',
    description: 'Global unique identifier for the asset'
  },
  
  // Product Description Section
  {
    key: 'productDescription.name',
    label: 'Product Name',
    type: 'text',
    required: true,
    section: 'Product Description',
    description: 'Name of the product'
  },
  {
    key: 'productDescription.description',
    label: 'Description',
    type: 'textarea',
    section: 'Product Description',
    description: 'Detailed description of the product'
  },
  {
    key: 'productDescription.category',
    label: 'Category',
    type: 'select',
    section: 'Product Description',
    options: [
      { value: 'automotive', label: 'Automotive' },
      { value: 'electronics', label: 'Electronics' },
      { value: 'machinery', label: 'Machinery' },
      { value: 'chemicals', label: 'Chemicals' },
      { value: 'textiles', label: 'Textiles' },
      { value: 'other', label: 'Other' }
    ]
  },
  
  // Manufacturing Information Section
  {
    key: 'manufacturingInformation.manufacturerId',
    label: 'Manufacturer ID',
    type: 'text',
    required: true,
    section: 'Manufacturing Information',
    description: 'Unique identifier of the manufacturer'
  },
  {
    key: 'manufacturingInformation.manufacturerName',
    label: 'Manufacturer Name',
    type: 'text',
    section: 'Manufacturing Information',
    description: 'Name of the manufacturing company'
  },
  {
    key: 'manufacturingInformation.productionDate',
    label: 'Production Date',
    type: 'date',
    section: 'Manufacturing Information',
    description: 'Date when the product was manufactured'
  },
  {
    key: 'manufacturingInformation.productionLocation',
    label: 'Production Location',
    type: 'text',
    section: 'Manufacturing Information',
    description: 'Location where the product was manufactured'
  },
  {
    key: 'manufacturingInformation.batchNumber',
    label: 'Batch Number',
    type: 'text',
    section: 'Manufacturing Information',
    description: 'Batch or lot number for traceability'
  },
  
  // Physical Dimensions Section
  {
    key: 'physicalDimensions.weight',
    label: 'Weight (kg)',
    type: 'number',
    section: 'Physical Dimensions',
    description: 'Weight of the product in kilograms',
    validation: { min: 0 }
  },
  {
    key: 'physicalDimensions.height',
    label: 'Height (cm)',
    type: 'number',
    section: 'Physical Dimensions',
    description: 'Height of the product in centimeters',
    validation: { min: 0 }
  },
  {
    key: 'physicalDimensions.width',
    label: 'Width (cm)',
    type: 'number',
    section: 'Physical Dimensions',
    description: 'Width of the product in centimeters',
    validation: { min: 0 }
  },
  {
    key: 'physicalDimensions.length',
    label: 'Length (cm)',
    type: 'number',
    section: 'Physical Dimensions',
    description: 'Length of the product in centimeters',
    validation: { min: 0 }
  },
];

/**
 * Creates a default DPP object with required fields pre-filled
 */
export const createDefaultDPP = (manufacturerPartId?: string): Partial<DPPSchema> => ({
  productIdentifier: {
    manufacturerPartId: manufacturerPartId || '',
    customerPartId: '',
    globalAssetId: ''
  },
  productDescription: {
    name: '',
    description: '',
    category: '',
    keywords: []
  },
  manufacturingInformation: {
    manufacturerId: '',
    manufacturerName: '',
    productionDate: '',
    productionLocation: '',
    batchNumber: ''
  },
  physicalDimensions: {
    weight: 0,
    height: 0,
    width: 0,
    length: 0,
    volume: 0
  }
});

/**
 * Schema metadata for UI display
 */
export const DPP_SCHEMA_METADATA = {
  name: 'Digital Product Passport',
  version: DPP_SCHEMA_VERSION,
  semanticId: DPP_SEMANTIC_ID,
  description: 'Comprehensive digital passport containing product information, manufacturing details, sustainability data, and lifecycle information.',
  icon: 'DPP',
  color: '#1976d2',
  tags: ['sustainability', 'traceability', 'compliance'],
  namespace: 'io.catenax.generic.digital_product_passport'
};
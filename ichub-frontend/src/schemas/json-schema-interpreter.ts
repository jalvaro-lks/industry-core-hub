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
 * JSON Schema Interpreter
 * Automatically generates form fields, validation, and default values from JSON Schema
 */

export interface JSONSchemaProperty {
  type?: string | string[];
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  items?: JSONSchemaProperty;
  enum?: any[];
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  required?: string[];
  $ref?: string;
  default?: any;
  'x-samm-aspect-model-urn'?: string;
}

export interface JSONSchema {
  $schema?: string;
  type?: string;
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  components?: {
    schemas?: Record<string, JSONSchemaProperty>;
  };
  required?: string[];
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'array';
  section: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Converts JSON Schema property to form field type
 */
function getFormFieldType(property: JSONSchemaProperty, resolvedProperty?: JSONSchemaProperty): FormField['type'] {
  const prop = resolvedProperty || property;
  
  if (prop.enum) {
    return 'select';
  }
  
  if (prop.type === 'array') {
    return 'array';
  }
  
  if (prop.type === 'boolean') {
    return 'checkbox';
  }
  
  if (prop.type === 'number' || prop.type === 'integer') {
    return 'number';
  }
  
  if (prop.type === 'string') {
    if (prop.format === 'date' || prop.pattern?.includes('\\d{4}-\\d{2}-\\d{2}')) {
      return 'date';
    }
    
    if (prop.description && prop.description.length > 100) {
      return 'textarea';
    }
    
    return 'text';
  }
  
  return 'text';
}

/**
 * Resolves $ref references in JSON Schema
 */
function resolveRef(ref: string, schema: JSONSchema): JSONSchemaProperty | null {
  if (!ref.startsWith('#/components/schemas/')) {
    return null;
  }
  
  const schemaName = ref.replace('#/components/schemas/', '');
  return schema.components?.schemas?.[schemaName] || null;
}

/**
 * Generates a human-readable label from a property key
 */
function generateLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Id$/, ' ID')
    .trim();
}

/**
 * Determines the section name for grouping fields
 */
function getSectionName(key: string, property: JSONSchemaProperty): string {
  const sectionMap: Record<string, string> = {
    metadata: 'Metadata',
    identification: 'Identification',
    operation: 'Operation',
    handling: 'Handling',
    characteristics: 'Product Characteristics',
    commercial: 'Commercial Information',
    materials: 'Materials',
    sustainability: 'Sustainability',
    sources: 'Sources & Documentation',
    additionalData: 'Additional Data'
  };
  
  return sectionMap[key] || 'General Information';
}

/**
 * Recursively processes properties to generate form fields
 */
function processProperties(
  properties: Record<string, JSONSchemaProperty>,
  schema: JSONSchema,
  requiredFields: string[] = [],
  parentKey: string = '',
  parentSection: string = 'General Information'
): FormField[] {
  const fields: FormField[] = [];
  
  for (const [key, property] of Object.entries(properties)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const isRequired = requiredFields.includes(key);
    
    // Resolve $ref if present
    let resolvedProperty = property;
    if (property.$ref) {
      const resolved = resolveRef(property.$ref, schema);
      if (resolved) {
        resolvedProperty = resolved;
      }
    }
    
    // Determine section
    const section = parentKey ? parentSection : getSectionName(key, resolvedProperty);
    
    // Handle nested objects
    if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
      const nestedFields = processProperties(
        resolvedProperty.properties,
        schema,
        resolvedProperty.required || [],
        fullKey,
        section
      );
      fields.push(...nestedFields);
      continue;
    }
    
    // Handle arrays of objects
    if (resolvedProperty.type === 'array' && resolvedProperty.items?.type === 'object') {
      // For now, skip complex array objects - can be enhanced later
      continue;
    }
    
    // Create form field
    const field: FormField = {
      key: fullKey,
      label: generateLabel(key),
      type: getFormFieldType(property, resolvedProperty),
      section,
      description: resolvedProperty.description,
      required: isRequired,
      placeholder: `Enter ${generateLabel(key).toLowerCase()}`
    };
    
    // Add enum options
    if (resolvedProperty.enum) {
      field.options = resolvedProperty.enum.map(value => ({
        value,
        label: typeof value === 'string' ? generateLabel(value) : String(value)
      }));
    }
    
    // Add validation rules
    if (resolvedProperty.minimum !== undefined || resolvedProperty.maximum !== undefined ||
        resolvedProperty.minLength !== undefined || resolvedProperty.maxLength !== undefined ||
        resolvedProperty.pattern) {
      field.validation = {
        min: resolvedProperty.minimum,
        max: resolvedProperty.maximum,
        minLength: resolvedProperty.minLength,
        maxLength: resolvedProperty.maxLength,
        pattern: resolvedProperty.pattern
      };
    }
    
    fields.push(field);
  }
  
  return fields;
}

/**
 * Main function to interpret JSON Schema and generate form configuration
 */
export function interpretJSONSchema(schema: JSONSchema): {
  formFields: FormField[];
  validate: (data: any) => { isValid: boolean; errors: string[] };
  createDefault: (params?: any) => any;
} {
  if (!schema.properties) {
    throw new Error('Invalid JSON Schema: missing properties');
  }
  
  const formFields = processProperties(
    schema.properties,
    schema,
    schema.required || []
  );
  
  // Generate validation function
  const validate = (data: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    for (const field of formFields) {
      if (field.required) {
        const value = getValueByPath(data, field.key);
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${field.label} is required`);
        }
      }
      
      // Additional validation based on field rules
      const value = getValueByPath(data, field.key);
      if (value !== undefined && value !== null && value !== '') {
        if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
          errors.push(`${field.label} must be at least ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
          errors.push(`${field.label} must be at most ${field.validation.max}`);
        }
        if (field.validation?.minLength !== undefined && String(value).length < field.validation.minLength) {
          errors.push(`${field.label} must be at least ${field.validation.minLength} characters`);
        }
        if (field.validation?.maxLength !== undefined && String(value).length > field.validation.maxLength) {
          errors.push(`${field.label} must be at most ${field.validation.maxLength} characters`);
        }
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(String(value))) {
          errors.push(`${field.label} format is invalid`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  // Generate default values function
  const createDefault = (params?: any): any => {
    const defaultData: any = {};
    
    for (const field of formFields) {
      if (field.key.includes('.')) {
        setValueByPath(defaultData, field.key, getDefaultValue(field));
      } else {
        defaultData[field.key] = getDefaultValue(field);
      }
    }
    
    return defaultData;
  };
  
  return {
    formFields,
    validate,
    createDefault
  };
}

/**
 * Helper function to get default value for a field
 */
function getDefaultValue(field: FormField): any {
  switch (field.type) {
    case 'checkbox':
      return false;
    case 'number':
      return 0;
    case 'array':
      return [];
    case 'select':
      return field.options?.[0]?.value || '';
    default:
      return '';
  }
}

/**
 * Helper function to get value from nested object path
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

/**
 * Helper function to set value in nested object path
 */
function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;
}
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
 * REFACTORED JSON Schema Tree Builder
 * 
 * Construye una estructura de árbol unificada a partir de un JSON Schema.
 * Este árbol es la fuente única de verdad para:
 * - Renderizado del formulario
 * - Validación de datos
 * - Gestión de errores
 * - Navegación por identificadores
 * - Visualización de reglas
 * 
 * MEJORAS CLAVE:
 * - Identificadores únicos deterministas para todos los nodos
 * - Estructura recursiva sin límite de niveles
 * - Validación unificada en el árbol
 * - Eliminación de duplicación entre FormField, itemFields y objectFields
 */

import {
  SchemaNode,
  NodeType,
  PrimitiveType,
  ValidationRules,
  SchemaNodeBuilder,
  SchemaTreeOptions
} from '../models/schema-node';
import { FieldIdentifier, PathSegment } from '../utils/field-identifier';
import { JSONSchema, JSONSchemaProperty } from './json-schema-interpreter';

/**
 * Construye un árbol de SchemaNode a partir de un JSON Schema
 * 
 * @param schema - JSON Schema completo
 * @param options - Opciones de construcción
 * @returns Nodo raíz del árbol
 */
export function buildSchemaTree(
  schema: JSONSchema,
  options: SchemaTreeOptions = {}
): Map<string, SchemaNode> {
  const {
    maxDepth = 15,
    includeOptional = true,
    idPrefix = '',
    collapseObjectsByDefault = false,
    collapseArraysByDefault = false
  } = options;

  const rootNodes = new Map<string, SchemaNode>();

  if (!schema.properties) {
    return rootNodes;
  }

  const requiredFields = schema.required || [];
  let order = 0;

  // Procesar cada propiedad de primer nivel
  for (const [key, property] of Object.entries(schema.properties)) {
    const resolvedProperty = resolveSchemaProperty(property, schema);

    const node = buildNode(
      key,
      resolvedProperty,
      schema,
      {
        pathSegments: [key],
        depth: 0,
        parentId: null,
        section: generateLabel(key),
        isRequired: requiredFields.includes(key),
        order: order++,
        maxDepth,
        includeOptional,
        idPrefix,
        collapseObjectsByDefault,
        collapseArraysByDefault
      }
    );

    if (node) {
      rootNodes.set(key, node);
    }
  }

  return rootNodes;
}

/**
 * Contexto de construcción de nodo
 */
interface NodeBuildContext {
  pathSegments: PathSegment[];
  depth: number;
  parentId: string | null;
  section: string;
  isRequired: boolean;
  order: number;
  maxDepth: number;
  includeOptional: boolean;
  idPrefix: string;
  collapseObjectsByDefault: boolean;
  collapseArraysByDefault: boolean;
}

/**
 * Construye un nodo del árbol recursivamente
 */
function buildNode(
  key: string,
  property: JSONSchemaProperty,
  schema: JSONSchema,
  context: NodeBuildContext
): SchemaNode | null {
  // Verificar profundidad máxima
  if (context.depth > context.maxDepth) {
    console.warn(`Max depth ${context.maxDepth} reached at ${FieldIdentifier.generate(context.pathSegments)}`);
    return null;
  }

  // Omitir campos opcionales si la opción está desactivada
  if (!context.includeOptional && !context.isRequired) {
    return null;
  }

  // Generar identificador único
  const id = FieldIdentifier.generate(context.pathSegments);
  const label = property.title || generateLabel(key);
  const description = property.description;
  const urn = property['x-samm-aspect-model-urn'];

  // Extraer reglas de validación
  const validationRules = extractValidationRules(property);

  // Determinar tipo de nodo
  const nodeType = determineNodeType(property);

  // Crear builder base
  const builder = new SchemaNodeBuilder(key, nodeType)
    .id(id)
    .label(label)
    .required(context.isRequired)
    .depth(context.depth)
    .parentId(context.parentId)
    .section(context.section)
    .isTopLevel(context.depth === 0)
    .order(context.order);

  if (description) builder.description(description);
  if (urn) builder.urn(urn);
  if (validationRules) builder.validationRules(validationRules);
  if (property.default !== undefined) builder.defaultValue(property.default);

  // Procesar según el tipo de nodo
  switch (nodeType) {
    case NodeType.PRIMITIVE:
      return buildPrimitiveNode(builder, property, context);

    case NodeType.OBJECT:
      return buildObjectNode(builder, property, schema, context);

    case NodeType.ARRAY:
      return buildArrayNode(builder, property, schema, context);
  }

  return null;
}

/**
 * Construye un nodo primitivo
 */
function buildPrimitiveNode(
  builder: SchemaNodeBuilder,
  property: JSONSchemaProperty,
  context: NodeBuildContext
): SchemaNode {
  const primitiveType = determinePrimitiveType(property);
  builder.primitiveType(primitiveType);

  // Manejar enum/const
  if (property.enum && property.enum.length > 0) {
    const options = property.enum.map(value => ({
      value,
      label: String(value)
    }));
    builder.options(options);
  }

  // Placeholder y help text
  const placeholder = generatePlaceholder(primitiveType, property);
  if (placeholder) builder.placeholder(placeholder);

  if (property.examples && property.examples.length > 0) {
    builder.helpText(`Ejemplo: ${property.examples[0]}`);
  }

  return builder.build();
}

/**
 * Construye un nodo objeto
 */
function buildObjectNode(
  builder: SchemaNodeBuilder,
  property: JSONSchemaProperty,
  schema: JSONSchema,
  context: NodeBuildContext
): SchemaNode {
  builder.collapsedByDefault(context.collapseObjectsByDefault);

  const properties = new Map<string, SchemaNode>();

  if (property.properties) {
    const requiredFields = property.required || [];
    let childOrder = 0;

    for (const [childKey, childProperty] of Object.entries(property.properties)) {
      const resolvedChild = resolveSchemaProperty(childProperty, schema);

      const childNode = buildNode(
        childKey,
        resolvedChild,
        schema,
        {
          pathSegments: [...context.pathSegments, childKey],
          depth: context.depth + 1,
          parentId: FieldIdentifier.generate(context.pathSegments),
          section: context.section,
          isRequired: requiredFields.includes(childKey),
          order: childOrder++,
          maxDepth: context.maxDepth,
          includeOptional: context.includeOptional,
          idPrefix: context.idPrefix,
          collapseObjectsByDefault: context.collapseObjectsByDefault,
          collapseArraysByDefault: context.collapseArraysByDefault
        }
      );

      if (childNode) {
        properties.set(childKey, childNode);
      }
    }
  }

  builder.properties(properties);
  return builder.build();
}

/**
 * Construye un nodo array
 */
function buildArrayNode(
  builder: SchemaNodeBuilder,
  property: JSONSchemaProperty,
  schema: JSONSchema,
  context: NodeBuildContext
): SchemaNode {
  builder.collapsedByDefault(context.collapseArraysByDefault);

  // Constraints del array
  if (property.minItems !== undefined || property.maxItems !== undefined || property.uniqueItems) {
    builder.arrayConstraints({
      minItems: property.minItems,
      maxItems: property.maxItems,
      uniqueItems: property.uniqueItems
    });
  }

  // Procesar schema del item
  if (property.items && !Array.isArray(property.items)) {
    const resolvedItem = resolveSchemaProperty(property.items, schema);
    const itemNodeType = determineNodeType(resolvedItem);

    builder.itemType(
      itemNodeType === NodeType.PRIMITIVE ? 'primitive' :
      itemNodeType === NodeType.OBJECT ? 'object' : 'array'
    );

    // Crear schema del item con [item] en el path
    const itemNode = buildNode(
      'item',
      resolvedItem,
      schema,
      {
        pathSegments: [...context.pathSegments, 'item'],
        depth: context.depth + 1,
        parentId: FieldIdentifier.generate(context.pathSegments),
        section: context.section,
        isRequired: false, // Los items individuales heredan required del array
        order: 0,
        maxDepth: context.maxDepth,
        includeOptional: context.includeOptional,
        idPrefix: context.idPrefix,
        collapseObjectsByDefault: context.collapseObjectsByDefault,
        collapseArraysByDefault: context.collapseArraysByDefault
      }
    );

    if (itemNode) {
      builder.itemSchema(itemNode);
    }
  }

  return builder.build();
}

/**
 * Determina el tipo de nodo basándose en la propiedad
 */
function determineNodeType(property: JSONSchemaProperty): NodeType {
  const types = Array.isArray(property.type) ? property.type : [property.type];
  const primaryType = types.find(t => t !== 'null') || types[0];

  if (primaryType === 'object') {
    return NodeType.OBJECT;
  }

  if (primaryType === 'array') {
    return NodeType.ARRAY;
  }

  return NodeType.PRIMITIVE;
}

/**
 * Determina el tipo primitivo específico
 */
function determinePrimitiveType(property: JSONSchemaProperty): PrimitiveType {
  const types = Array.isArray(property.type) ? property.type : [property.type];
  const primaryType = types.find(t => t !== 'null') || types[0];

  // Enum
  if (property.enum && property.enum.length > 0) {
    return property.enum.length <= 3 ? PrimitiveType.RADIO : PrimitiveType.ENUM;
  }

  // Boolean
  if (primaryType === 'boolean') {
    return PrimitiveType.CHECKBOX;
  }

  // Number
  if (primaryType === 'number') {
    return PrimitiveType.NUMBER;
  }

  if (primaryType === 'integer') {
    return PrimitiveType.INTEGER;
  }

  // String con formato
  if (primaryType === 'string') {
    if (property.format === 'date') return PrimitiveType.DATE;
    if (property.format === 'date-time') return PrimitiveType.DATETIME;
    if (property.format === 'time') return PrimitiveType.TIME;
    if (property.format === 'email') return PrimitiveType.EMAIL;
    if (property.format === 'uri' || property.format === 'uri-reference') return PrimitiveType.URL;
    if (property.format === 'password') return PrimitiveType.PASSWORD;

    // Textarea para textos largos
    if (property.description && property.description.length > 200) {
      return PrimitiveType.TEXTAREA;
    }

    if (property.maxLength && property.maxLength > 200) {
      return PrimitiveType.TEXTAREA;
    }
  }

  return PrimitiveType.STRING;
}

/**
 * Extrae reglas de validación de una propiedad
 */
function extractValidationRules(property: JSONSchemaProperty): ValidationRules | undefined {
  const rules: ValidationRules = {};
  let hasRules = false;

  // Numeric rules
  if (property.minimum !== undefined) {
    rules.min = property.minimum;
    hasRules = true;
  }
  if (property.maximum !== undefined) {
    rules.max = property.maximum;
    hasRules = true;
  }
  if (property.exclusiveMinimum !== undefined) {
    rules.exclusiveMin = typeof property.exclusiveMinimum === 'boolean' 
      ? property.exclusiveMinimum 
      : true;
    rules.min = typeof property.exclusiveMinimum === 'number' 
      ? property.exclusiveMinimum 
      : rules.min;
    hasRules = true;
  }
  if (property.exclusiveMaximum !== undefined) {
    rules.exclusiveMax = typeof property.exclusiveMaximum === 'boolean'
      ? property.exclusiveMaximum
      : true;
    rules.max = typeof property.exclusiveMaximum === 'number'
      ? property.exclusiveMaximum
      : rules.max;
    hasRules = true;
  }
  if (property.multipleOf !== undefined) {
    rules.multipleOf = property.multipleOf;
    hasRules = true;
  }

  // String rules
  if (property.minLength !== undefined) {
    rules.minLength = property.minLength;
    hasRules = true;
  }
  if (property.maxLength !== undefined) {
    rules.maxLength = property.maxLength;
    hasRules = true;
  }
  if (property.pattern) {
    rules.pattern = property.pattern;
    hasRules = true;
  }
  if (property.format) {
    rules.format = property.format;
    hasRules = true;
  }

  // Array rules
  if (property.minItems !== undefined) {
    rules.minItems = property.minItems;
    hasRules = true;
  }
  if (property.maxItems !== undefined) {
    rules.maxItems = property.maxItems;
    hasRules = true;
  }
  if (property.uniqueItems) {
    rules.uniqueItems = property.uniqueItems;
    hasRules = true;
  }

  // Enum/const
  if (property.enum) {
    rules.enum = property.enum;
    hasRules = true;
  }
  if (property.const !== undefined) {
    rules.const = property.const;
    hasRules = true;
  }

  return hasRules ? rules : undefined;
}

/**
 * Resuelve referencias y composiciones de schema
 */
function resolveSchemaProperty(
  property: JSONSchemaProperty,
  schema: JSONSchema
): JSONSchemaProperty {
  let resolved = { ...property };

  // Resolver $ref
  if (property.$ref) {
    const refResolved = resolveRef(property.$ref, schema);
    if (refResolved) {
      resolved = { ...refResolved, ...resolved };
      delete resolved.$ref;
    }
  }

  // Manejar allOf - merge all
  if (property.allOf) {
    for (const subSchema of property.allOf) {
      const subResolved = resolveSchemaProperty(subSchema, schema);
      resolved = mergeSchemas(resolved, subResolved);
    }
  }

  // Manejar oneOf - tomar primero
  if (property.oneOf && property.oneOf.length > 0) {
    const firstOption = resolveSchemaProperty(property.oneOf[0], schema);
    resolved = mergeSchemas(resolved, firstOption);
  }

  // Manejar anyOf - tomar primero
  if (property.anyOf && property.anyOf.length > 0) {
    const firstOption = resolveSchemaProperty(property.anyOf[0], schema);
    resolved = mergeSchemas(resolved, firstOption);
  }

  return resolved;
}

/**
 * Resuelve una referencia $ref
 */
function resolveRef(ref: string, schema: JSONSchema): JSONSchemaProperty | null {
  if (!ref.startsWith('#/')) {
    console.warn(`External references not supported: ${ref}`);
    return null;
  }

  // components/schemas
  if (ref.startsWith('#/components/schemas/')) {
    const schemaName = ref.replace('#/components/schemas/', '');
    return schema.components?.schemas?.[schemaName] || null;
  }

  // definitions
  if (ref.startsWith('#/definitions/')) {
    const schemaName = ref.replace('#/definitions/', '');
    return schema.definitions?.[schemaName] || null;
  }

  // JSON Pointer
  const path = ref.substring(2).split('/');
  let current: any = schema;

  for (const segment of path) {
    if (current && typeof current === 'object') {
      current = current[segment];
    } else {
      return null;
    }
  }

  return current as JSONSchemaProperty || null;
}

/**
 * Merge dos schemas
 */
function mergeSchemas(
  base: JSONSchemaProperty,
  overlay: JSONSchemaProperty
): JSONSchemaProperty {
  const merged = { ...base, ...overlay };

  // Merge properties
  if (base.properties && overlay.properties) {
    merged.properties = { ...base.properties, ...overlay.properties };
  }

  // Merge required
  if (base.required && overlay.required) {
    const combined = [...base.required, ...overlay.required];
    merged.required = Array.from(new Set(combined));
  }

  return merged;
}

/**
 * Genera un label legible desde un key
 */
function generateLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Id$/, ' ID')
    .trim();
}

/**
 * Genera un placeholder según el tipo
 */
function generatePlaceholder(type: PrimitiveType, property: JSONSchemaProperty): string | undefined {
  switch (type) {
    case PrimitiveType.EMAIL:
      return 'ejemplo@correo.com';
    case PrimitiveType.URL:
      return 'https://ejemplo.com';
    case PrimitiveType.DATE:
      return 'AAAA-MM-DD';
    case PrimitiveType.DATETIME:
      return 'AAAA-MM-DDTHH:MM:SS';
    case PrimitiveType.TIME:
      return 'HH:MM:SS';
    case PrimitiveType.NUMBER:
    case PrimitiveType.INTEGER:
      if (property.minimum !== undefined) {
        return `Mínimo: ${property.minimum}`;
      }
      return undefined;
    default:
      return undefined;
  }
}

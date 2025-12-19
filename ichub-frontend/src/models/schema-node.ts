/**
 * Modelo de datos tipo árbol para representar la estructura completa de un JSON Schema.
 * 
 * Este modelo es la fuente única de verdad para:
 * - Renderizado del formulario
 * - Validación de datos
 * - Gestión de errores
 * - Navegación por identificadores
 * - Visualización de reglas
 * 
 * Cada nodo del árbol representa un atributo del schema con:
 * - Identificador único determinista
 * - Tipo de dato y categoría
 * - Reglas de validación asociadas
 * - Hijos (si es objeto o array)
 * - Metadata para renderizado y UX
 */

import { FieldIdentifier } from '../utils/field-identifier';

/**
 * Tipo de nodo según la estructura del schema
 */
export enum NodeType {
  /** Valor primitivo: string, number, boolean, etc. */
  PRIMITIVE = 'primitive',
  /** Objeto con propiedades anidadas */
  OBJECT = 'object',
  /** Array de elementos (primitivos u objetos) */
  ARRAY = 'array'
}

/**
 * Tipo de dato primitivo
 */
export enum PrimitiveType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  EMAIL = 'email',
  URL = 'url',
  TEXTAREA = 'textarea',
  PASSWORD = 'password',
  ENUM = 'enum',
  RADIO = 'radio',
  CHECKBOX = 'checkbox'
}

/**
 * Reglas de validación asociadas a un nodo
 */
export interface ValidationRules {
  // Reglas numéricas
  min?: number;
  max?: number;
  exclusiveMin?: boolean;
  exclusiveMax?: boolean;
  multipleOf?: number;

  // Reglas de string
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Reglas de array
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  // Reglas de enum/const
  enum?: any[];
  const?: any;

  // Reglas personalizadas adicionales
  custom?: {
    rule: string;
    message: string;
    validator?: (value: any) => boolean;
  }[];
}

/**
 * Nodo del árbol de schema
 * Representa un atributo en cualquier nivel de la jerarquía
 */
export interface SchemaNode {
  /** Identificador único: "user.emails[0].value" */
  id: string;

  /** Nombre de la propiedad sin path: "value" */
  key: string;

  /** Label legible para el usuario */
  label: string;

  /** Tipo de nodo: primitive, object, array */
  nodeType: NodeType;

  /** Tipo primitivo específico (solo si nodeType === PRIMITIVE) */
  primitiveType?: PrimitiveType;

  /** Descripción del campo */
  description?: string;

  /** URN semántico (SAMM extension) */
  urn?: string;

  /** Si el campo es requerido */
  required: boolean;

  /** Reglas de validación asociadas */
  validationRules?: ValidationRules;

  /** Valor por defecto */
  defaultValue?: any;

  /** Opciones para enums/select */
  options?: Array<{ value: any; label: string }>;

  /** Profundidad en el árbol (0 = raíz) */
  depth: number;

  /** Identificador del nodo padre */
  parentId: string | null;

  /** Path de la sección/grupo al que pertenece */
  section: string;

  // --- Para nodos OBJECT ---
  /** Propiedades del objeto (mapa key -> child node) */
  properties?: Map<string, SchemaNode>;

  // --- Para nodos ARRAY ---
  /** Tipo de elementos que contiene el array */
  itemType?: 'primitive' | 'object' | 'array';
  
  /** Schema del elemento del array (template para crear items) */
  itemSchema?: SchemaNode;

  /** Restricciones de cardinalidad del array */
  arrayConstraints?: {
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
  };

  // --- Metadata para renderizado ---
  /** Si es una sección de primer nivel */
  isTopLevel: boolean;

  /** Orden de renderizado */
  order: number;

  /** Si debe mostrarse colapsado por defecto */
  collapsedByDefault?: boolean;

  /** Placeholder para el input */
  placeholder?: string;

  /** Hints visuales adicionales */
  helpText?: string;
}

/**
 * Error de validación estructurado
 */
export interface ValidationError {
  /** Identificador del campo con error: "user.emails[0].value" */
  fieldId: string;

  /** Mensaje de error legible */
  message: string;

  /** Regla de validación violada */
  rule: string;

  /** Severidad del error */
  severity: 'error' | 'warning';

  /** Valor que causó el error */
  value?: any;

  /** Path del array padre si aplica: "user.emails" */
  arrayPath?: string;

  /** Índice del elemento en el array si aplica */
  arrayIndex?: number;

  /** Identificador de la sección afectada */
  section: string;

  /** Timestamp del error */
  timestamp: number;
}

/**
 * Resultado de validación de un árbol completo
 */
export interface ValidationResult {
  /** Si el schema completo es válido */
  isValid: boolean;

  /** Array de todos los errores encontrados */
  errors: ValidationError[];

  /** Mapa rápido: fieldId -> errores de ese campo */
  errorsByField: Map<string, ValidationError[]>;

  /** Set de fieldIds con errores (lookup O(1)) */
  fieldsWithErrors: Set<string>;

  /** Array de secciones con errores */
  sectionsWithErrors: string[];
}

/**
 * Opciones para construcción del árbol
 */
export interface SchemaTreeOptions {
  /** Profundidad máxima permitida */
  maxDepth?: number;

  /** Si debe incluir campos opcionales */
  includeOptional?: boolean;

  /** Prefijo para los IDs generados */
  idPrefix?: string;

  /** Si debe colapsar objetos por defecto */
  collapseObjectsByDefault?: boolean;

  /** Si debe colapsar arrays por defecto */
  collapseArraysByDefault?: boolean;
}

/**
 * Builder para construir nodos del árbol de forma fluida
 */
export class SchemaNodeBuilder {
  private node: Partial<SchemaNode>;

  constructor(key: string, nodeType: NodeType) {
    this.node = {
      key,
      nodeType,
      required: false,
      depth: 0,
      parentId: null,
      section: key,
      isTopLevel: true,
      order: 0
    };
  }

  id(id: string): this {
    this.node.id = id;
    return this;
  }

  label(label: string): this {
    this.node.label = label;
    return this;
  }

  primitiveType(type: PrimitiveType): this {
    this.node.primitiveType = type;
    return this;
  }

  description(desc: string): this {
    this.node.description = desc;
    return this;
  }

  urn(urn: string): this {
    this.node.urn = urn;
    return this;
  }

  required(required: boolean): this {
    this.node.required = required;
    return this;
  }

  validationRules(rules: ValidationRules): this {
    this.node.validationRules = rules;
    return this;
  }

  defaultValue(value: any): this {
    this.node.defaultValue = value;
    return this;
  }

  options(options: Array<{ value: any; label: string }>): this {
    this.node.options = options;
    return this;
  }

  depth(depth: number): this {
    this.node.depth = depth;
    return this;
  }

  parentId(parentId: string | null): this {
    this.node.parentId = parentId;
    return this;
  }

  section(section: string): this {
    this.node.section = section;
    return this;
  }

  properties(props: Map<string, SchemaNode>): this {
    this.node.properties = props;
    return this;
  }

  itemType(type: 'primitive' | 'object' | 'array'): this {
    this.node.itemType = type;
    return this;
  }

  itemSchema(schema: SchemaNode): this {
    this.node.itemSchema = schema;
    return this;
  }

  arrayConstraints(constraints: NonNullable<SchemaNode['arrayConstraints']>): this {
    this.node.arrayConstraints = constraints;
    return this;
  }

  isTopLevel(isTop: boolean): this {
    this.node.isTopLevel = isTop;
    return this;
  }

  order(order: number): this {
    this.node.order = order;
    return this;
  }

  collapsedByDefault(collapsed: boolean): this {
    this.node.collapsedByDefault = collapsed;
    return this;
  }

  placeholder(placeholder: string): this {
    this.node.placeholder = placeholder;
    return this;
  }

  helpText(text: string): this {
    this.node.helpText = text;
    return this;
  }

  build(): SchemaNode {
    if (!this.node.id || !this.node.label) {
      throw new Error('SchemaNode must have id and label');
    }
    return this.node as SchemaNode;
  }
}

/**
 * Utilidades para trabajar con árboles de schema
 */
export class SchemaTreeUtils {
  /**
   * Encuentra un nodo por su ID en el árbol
   */
  static findNodeById(root: SchemaNode, id: string): SchemaNode | null {
    if (root.id === id) {
      return root;
    }

    // Buscar en propiedades (objeto)
    if (root.properties) {
      for (const child of root.properties.values()) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }

    // Buscar en itemSchema (array)
    if (root.itemSchema) {
      const found = this.findNodeById(root.itemSchema, id);
      if (found) return found;
    }

    return null;
  }

  /**
   * Obtiene todos los nodos descendientes de un nodo
   */
  static getDescendants(node: SchemaNode): SchemaNode[] {
    const descendants: SchemaNode[] = [];

    if (node.properties) {
      for (const child of node.properties.values()) {
        descendants.push(child);
        descendants.push(...this.getDescendants(child));
      }
    }

    if (node.itemSchema) {
      descendants.push(node.itemSchema);
      descendants.push(...this.getDescendants(node.itemSchema));
    }

    return descendants;
  }

  /**
   * Obtiene todos los nodos primitivos del árbol
   */
  static getPrimitiveNodes(node: SchemaNode): SchemaNode[] {
    const primitives: SchemaNode[] = [];

    if (node.nodeType === NodeType.PRIMITIVE) {
      primitives.push(node);
    }

    if (node.properties) {
      for (const child of node.properties.values()) {
        primitives.push(...this.getPrimitiveNodes(child));
      }
    }

    if (node.itemSchema) {
      primitives.push(...this.getPrimitiveNodes(node.itemSchema));
    }

    return primitives;
  }

  /**
   * Obtiene todos los nodos que son arrays
   */
  static getArrayNodes(node: SchemaNode): SchemaNode[] {
    const arrays: SchemaNode[] = [];

    if (node.nodeType === NodeType.ARRAY) {
      arrays.push(node);
    }

    if (node.properties) {
      for (const child of node.properties.values()) {
        arrays.push(...this.getArrayNodes(child));
      }
    }

    if (node.itemSchema) {
      arrays.push(...this.getArrayNodes(node.itemSchema));
    }

    return arrays;
  }

  /**
   * Obtiene el path de ancestros hasta un nodo
   */
  static getAncestorPath(root: SchemaNode, targetId: string): SchemaNode[] {
    const path: SchemaNode[] = [];
    
    const traverse = (node: SchemaNode): boolean => {
      if (node.id === targetId) {
        path.push(node);
        return true;
      }

      if (node.properties) {
        for (const child of node.properties.values()) {
          if (traverse(child)) {
            path.unshift(node);
            return true;
          }
        }
      }

      if (node.itemSchema && traverse(node.itemSchema)) {
        path.unshift(node);
        return true;
      }

      return false;
    };

    traverse(root);
    return path;
  }

  /**
   * Calcula estadísticas del árbol
   */
  static getTreeStats(root: SchemaNode): {
    totalNodes: number;
    primitiveNodes: number;
    objectNodes: number;
    arrayNodes: number;
    maxDepth: number;
    requiredNodes: number;
  } {
    let totalNodes = 0;
    let primitiveNodes = 0;
    let objectNodes = 0;
    let arrayNodes = 0;
    let maxDepth = 0;
    let requiredNodes = 0;

    const traverse = (node: SchemaNode) => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, node.depth);
      
      if (node.required) requiredNodes++;

      switch (node.nodeType) {
        case NodeType.PRIMITIVE:
          primitiveNodes++;
          break;
        case NodeType.OBJECT:
          objectNodes++;
          break;
        case NodeType.ARRAY:
          arrayNodes++;
          break;
      }

      if (node.properties) {
        for (const child of node.properties.values()) {
          traverse(child);
        }
      }

      if (node.itemSchema) {
        traverse(node.itemSchema);
      }
    };

    traverse(root);

    return {
      totalNodes,
      primitiveNodes,
      objectNodes,
      arrayNodes,
      maxDepth,
      requiredNodes
    };
  }

  /**
   * Convierte el árbol a una representación plana
   * Útil para debugging y visualización
   */
  static flatten(root: SchemaNode): Array<{
    id: string;
    depth: number;
    type: NodeType;
    required: boolean;
  }> {
    const flat: Array<{
      id: string;
      depth: number;
      type: NodeType;
      required: boolean;
    }> = [];

    const traverse = (node: SchemaNode) => {
      flat.push({
        id: node.id,
        depth: node.depth,
        type: node.nodeType,
        required: node.required
      });

      if (node.properties) {
        for (const child of node.properties.values()) {
          traverse(child);
        }
      }

      if (node.itemSchema) {
        traverse(node.itemSchema);
      }
    };

    traverse(root);
    return flat;
  }
}

/**
 * Sistema de identificación única para atributos en estructuras JSON anidadas.
 * 
 * Genera identificadores deterministas basados en la ruta del atributo:
 * - Objetos: notación punto (user.address.street)
 * - Arrays: notación índice (emails[0].value)
 * - Combinaciones: user.orders[0].items[1].sku
 * 
 * @example
 * // Generar identificador
 * FieldIdentifier.generate(['user', 'emails', 0, 'value'])
 * // => "user.emails[0].value"
 * 
 * @example
 * // Parsear identificador
 * FieldIdentifier.parse('user.emails[0].value')
 * // => {
 * //   segments: ['user', 'emails', 'value'],
 * //   indices: [null, 0, null],
 * //   arrayPaths: ['user.emails'],
 * //   depth: 3
 * // }
 */

/**
 * Segmento de path que puede ser string o índice de array
 */
export type PathSegment = string | number;

/**
 * Resultado del parsing de un identificador
 */
export interface ParsedIdentifier {
  /** Segmentos del path sin índices: ['user', 'emails', 'value'] */
  segments: string[];
  /** Índices de array por posición: [null, 0, null] */
  indices: (number | null)[];
  /** Paths completos de arrays: ['user.emails'] */
  arrayPaths: string[];
  /** Profundidad total del path */
  depth: number;
  /** Path original */
  original: string;
  /** Si el identificador apunta a un elemento de array */
  isArrayElement: boolean;
  /** Path sin índices: user.emails.value */
  schemaPath: string;
}

/**
 * Clase principal para gestión de identificadores únicos de campos
 */
export class FieldIdentifier {
  /**
   * Genera un identificador único a partir de segmentos de path
   * 
   * @param segments - Array de segmentos (strings o números para índices)
   * @returns Identificador en formato "parent.child[0].property"
   * 
   * @example
   * FieldIdentifier.generate(['user', 'emails', 0, 'value'])
   * // => "user.emails[0].value"
   * 
   * @example
   * FieldIdentifier.generate(['orders', 0, 'items', 1, 'sku'])
   * // => "orders[0].items[1].sku"
   */
  static generate(segments: PathSegment[]): string {
    if (segments.length === 0) {
      return '';
    }

    let identifier = '';
    let isNextAfterArray = false;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (typeof segment === 'number') {
        // Índice de array
        identifier += `[${segment}]`;
        isNextAfterArray = true;
      } else {
        // Propiedad de objeto
        if (identifier && !isNextAfterArray) {
          identifier += '.';
        }
        identifier += segment;
        isNextAfterArray = false;
      }
    }

    return identifier;
  }

  /**
   * Genera un identificador de schema (sin índices concretos)
   * Útil para matching y definición en el schema
   * 
   * @param segments - Array de segmentos (strings o 'item' para arrays)
   * @returns Identificador en formato "parent.child[item].property"
   * 
   * @example
   * FieldIdentifier.generateSchemaPath(['user', 'emails', 'item', 'value'])
   * // => "user.emails[item].value"
   */
  static generateSchemaPath(segments: PathSegment[]): string {
    return this.generate(
      segments.map(seg => typeof seg === 'number' ? 'item' : seg)
    );
  }

  /**
   * Parsea un identificador para extraer sus componentes
   * 
   * @param identifier - Identificador en formato "parent.child[0].property"
   * @returns Objeto ParsedIdentifier con información estructurada
   * 
   * @example
   * FieldIdentifier.parse('user.emails[0].value')
   * // => {
   * //   segments: ['user', 'emails', 'value'],
   * //   indices: [null, 0, null],
   * //   arrayPaths: ['user.emails'],
   * //   depth: 3,
   * //   original: 'user.emails[0].value',
   * //   isArrayElement: true,
   * //   schemaPath: 'user.emails.value'
   * // }
   */
  static parse(identifier: string): ParsedIdentifier {
    const segments: string[] = [];
    const indices: (number | null)[] = [];
    const arrayPaths: string[] = [];
    
    // Regex para capturar segmentos y arrays
    // Captura: "property", "[index]", o ".property"
    const pattern = /([^.\[\]]+)|\[(\d+)\]/g;
    let match: RegExpExecArray | null;
    let currentPath = '';
    let lastWasArray = false;

    while ((match = pattern.exec(identifier)) !== null) {
      if (match[1]) {
        // Es un nombre de propiedad
        segments.push(match[1]);
        indices.push(null);
        
        if (currentPath && !lastWasArray) {
          currentPath += '.';
        }
        currentPath += match[1];
        lastWasArray = false;
      } else if (match[2]) {
        // Es un índice de array
        const index = parseInt(match[2], 10);
        indices[indices.length - 1] = index;
        
        // Registrar el path del array
        if (!arrayPaths.includes(currentPath)) {
          arrayPaths.push(currentPath);
        }
        
        lastWasArray = true;
      }
    }

    // Generar schemaPath (sin índices)
    let schemaPath = '';
    for (let i = 0; i < segments.length; i++) {
      if (i > 0) {
        schemaPath += '.';
      }
      schemaPath += segments[i];
    }

    return {
      segments,
      indices,
      arrayPaths,
      depth: segments.length,
      original: identifier,
      isArrayElement: indices.some(idx => idx !== null),
      schemaPath
    };
  }

  /**
   * Comprueba si un identificador coincide con un patrón
   * Soporta wildcards para índices de array
   * 
   * @param identifier - Identificador concreto: "user.emails[0].value"
   * @param pattern - Patrón con wildcards: "user.emails[*].value"
   * @returns true si coincide
   * 
   * @example
   * FieldIdentifier.matches('user.emails[0].value', 'user.emails[*].value')
   * // => true
   * 
   * @example
   * FieldIdentifier.matches('user.emails[0].value', 'user.*.value')
   * // => false (no soporta wildcards en propiedades)
   */
  static matches(identifier: string, pattern: string): boolean {
    // Convertir pattern a regex
    // Escapar caracteres especiales excepto * y []
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '\\d+'); // * se convierte en \d+
    
    const regex = new RegExp(`^${escapedPattern}$`);
    return regex.test(identifier);
  }

  /**
   * Extrae el identificador padre de un identificador
   * 
   * @param identifier - Identificador completo
   * @returns Identificador del padre o null si es raíz
   * 
   * @example
   * FieldIdentifier.getParent('user.emails[0].value')
   * // => "user.emails[0]"
   * 
   * @example
   * FieldIdentifier.getParent('user.emails[0]')
   * // => "user.emails"
   * 
   * @example
   * FieldIdentifier.getParent('user')
   * // => null
   */
  static getParent(identifier: string): string | null {
    const parsed = this.parse(identifier);
    
    if (parsed.depth <= 1) {
      return null;
    }

    // Reconstruir sin el último segmento
    const parentSegments: PathSegment[] = [];
    
    for (let i = 0; i < parsed.segments.length - 1; i++) {
      parentSegments.push(parsed.segments[i]);
      if (parsed.indices[i] !== null) {
        parentSegments.push(parsed.indices[i]!);
      }
    }

    return this.generate(parentSegments);
  }

  /**
   * Obtiene todos los identificadores ancestros de un identificador
   * 
   * @param identifier - Identificador completo
   * @returns Array de identificadores desde raíz hasta padre inmediato
   * 
   * @example
   * FieldIdentifier.getAncestors('user.emails[0].value')
   * // => ['user', 'user.emails', 'user.emails[0]']
   */
  static getAncestors(identifier: string): string[] {
    const ancestors: string[] = [];
    let current: string | null = identifier;

    while (true) {
      current = this.getParent(current);
      if (current === null) {
        break;
      }
      ancestors.unshift(current);
    }

    return ancestors;
  }

  /**
   * Comprueba si un identificador es descendiente de otro
   * 
   * @param identifier - Identificador a comprobar
   * @param ancestor - Posible ancestro
   * @returns true si identifier es descendiente de ancestor
   * 
   * @example
   * FieldIdentifier.isDescendantOf('user.emails[0].value', 'user')
   * // => true
   * 
   * @example
   * FieldIdentifier.isDescendantOf('user.emails[0].value', 'user.emails')
   * // => true
   * 
   * @example
   * FieldIdentifier.isDescendantOf('user.name', 'user.emails')
   * // => false
   */
  static isDescendantOf(identifier: string, ancestor: string): boolean {
    return identifier.startsWith(ancestor + '.') || 
           identifier.startsWith(ancestor + '[');
  }

  /**
   * Normaliza un identificador eliminando índices de array
   * Útil para matching contra definiciones de schema
   * 
   * @param identifier - Identificador con índices
   * @returns Identificador sin índices
   * 
   * @example
   * FieldIdentifier.normalize('user.emails[0].value')
   * // => "user.emails.value"
   */
  static normalize(identifier: string): string {
    return identifier.replace(/\[\d+\]/g, '');
  }

  /**
   * Obtiene el índice de array de un segmento específico
   * 
   * @param identifier - Identificador completo
   * @param arrayPath - Path del array
   * @returns Índice del array o null si no es elemento de array
   * 
   * @example
   * FieldIdentifier.getArrayIndex('user.emails[2].value', 'user.emails')
   * // => 2
   */
  static getArrayIndex(identifier: string, arrayPath: string): number | null {
    const parsed = this.parse(identifier);
    
    // Buscar el índice del arrayPath en los segmentos
    const arraySegments = arrayPath.split('.');
    let matchIndex = -1;
    
    for (let i = 0; i < parsed.segments.length; i++) {
      const currentPath = parsed.segments.slice(0, i + 1).join('.');
      if (currentPath === arrayPath) {
        matchIndex = i;
        break;
      }
    }
    
    if (matchIndex === -1) {
      return null;
    }
    
    return parsed.indices[matchIndex];
  }

  /**
   * Reemplaza el índice de un array en un identificador
   * 
   * @param identifier - Identificador original
   * @param arrayPath - Path del array a modificar
   * @param newIndex - Nuevo índice
   * @returns Nuevo identificador con índice actualizado
   * 
   * @example
   * FieldIdentifier.replaceArrayIndex('user.emails[0].value', 'user.emails', 2)
   * // => "user.emails[2].value"
   */
  static replaceArrayIndex(
    identifier: string, 
    arrayPath: string, 
    newIndex: number
  ): string {
    const parsed = this.parse(identifier);
    
    // Encontrar el segmento correspondiente al arrayPath
    const arraySegments = arrayPath.split('.');
    let matchIndex = -1;
    
    for (let i = 0; i < parsed.segments.length; i++) {
      const currentPath = parsed.segments.slice(0, i + 1).join('.');
      if (currentPath === arrayPath) {
        matchIndex = i;
        break;
      }
    }
    
    if (matchIndex === -1) {
      return identifier;
    }
    
    // Reconstruir con nuevo índice
    const newSegments: PathSegment[] = [];
    for (let i = 0; i < parsed.segments.length; i++) {
      newSegments.push(parsed.segments[i]);
      if (i === matchIndex) {
        newSegments.push(newIndex);
      } else if (parsed.indices[i] !== null && i !== matchIndex) {
        newSegments.push(parsed.indices[i]!);
      }
    }
    
    return this.generate(newSegments);
  }
}

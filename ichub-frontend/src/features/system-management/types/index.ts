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
 * Supported system types in Industry Core Hub
 */
export type SystemType = 
  | 'connector-control-plane'
  | 'connector-data-plane'
  | 'dtr'
  | 'submodel-server'
  | 'keycloak'
  | 'backend-service';

/**
 * Connector version types (EDC versions)
 */
export type ConnectorVersion = 'saturn' | 'jupiter';

/**
 * Connection status for a system
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

/**
 * Base configuration for all systems
 */
export interface SystemBaseConfig {
  /** Unique identifier for this system configuration */
  id: string;
  /** Human-readable name for the system */
  name: string;
  /** Type of system */
  type: SystemType;
  /** Base URL or endpoint for the system */
  endpoint: string;
  /** Current connection status */
  status: ConnectionStatus;
  /** Whether this system is currently active/selected */
  isActive: boolean;
  /** Whether this system is linked/enabled for use */
  isLinked: boolean;
  /** When the system was added */
  createdAt: string;
  /** Last time connection was verified */
  lastChecked?: string;
  /** Optional description */
  description?: string;
}

/**
 * Connector-specific configuration
 */
export interface ConnectorConfig extends SystemBaseConfig {
  type: 'connector-control-plane' | 'connector-data-plane';
  /** EDC version */
  version: ConnectorVersion;
  /** Management API endpoint (for control plane) */
  managementApiEndpoint?: string;
  /** Protocol endpoint (for data plane) */
  protocolEndpoint?: string;
  /** Public API endpoint */
  publicApiEndpoint?: string;
  /** API key or token for authentication */
  apiKey?: string;
}

/**
 * DTR (Digital Twin Registry) configuration
 */
export interface DtrConfig extends SystemBaseConfig {
  type: 'dtr';
  /** API version */
  apiVersion?: string;
  /** Registry path */
  registryPath?: string;
  /** Lookup endpoint */
  lookupEndpoint?: string;
}

/**
 * Submodel Server configuration
 */
export interface SubmodelServerConfig extends SystemBaseConfig {
  type: 'submodel-server';
  /** Storage type (database, file, etc.) */
  storageType?: string;
  /** Submodel path prefix */
  submodelPath?: string;
}

/**
 * Keycloak configuration
 */
export interface KeycloakConfig extends SystemBaseConfig {
  type: 'keycloak';
  /** Realm name */
  realm?: string;
  /** Client ID */
  clientId?: string;
}

/**
 * Backend Service configuration
 */
export interface BackendServiceConfig extends SystemBaseConfig {
  type: 'backend-service';
  /** API version */
  apiVersion?: string;
}

/**
 * Union type for all system configurations
 */
export type SystemConfig = 
  | ConnectorConfig 
  | DtrConfig 
  | SubmodelServerConfig 
  | KeycloakConfig 
  | BackendServiceConfig;

/**
 * Metadata for system types (for UI display)
 */
export interface SystemTypeMetadata {
  type: SystemType;
  label: string;
  description: string;
  icon: string;
  category: 'connector' | 'registry' | 'storage' | 'auth' | 'service';
  color: string;
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * System type metadata configuration
 */
export const SYSTEM_TYPE_METADATA: Record<SystemType, SystemTypeMetadata> = {
  'connector-control-plane': {
    type: 'connector-control-plane',
    label: 'Connector Control Plane',
    description: 'EDC Control Plane for contract negotiation and policy management',
    icon: 'SettingsInputComponent',
    category: 'connector',
    color: '#60a5fa',
    requiredFields: ['name', 'endpoint', 'version'],
    optionalFields: ['managementApiEndpoint', 'apiKey', 'description']
  },
  'connector-data-plane': {
    type: 'connector-data-plane',
    label: 'Connector Data Plane',
    description: 'EDC Data Plane for secure data transfer',
    icon: 'CloudSync',
    category: 'connector',
    color: '#34d399',
    requiredFields: ['name', 'endpoint', 'version'],
    optionalFields: ['protocolEndpoint', 'publicApiEndpoint', 'description']
  },
  'dtr': {
    type: 'dtr',
    label: 'Digital Twin Registry',
    description: 'Registry for managing and discovering digital twins',
    icon: 'AccountTree',
    category: 'registry',
    color: '#f472b6',
    requiredFields: ['name', 'endpoint'],
    optionalFields: ['apiVersion', 'registryPath', 'lookupEndpoint', 'description']
  },
  'submodel-server': {
    type: 'submodel-server',
    label: 'Submodel Server',
    description: 'Server for storing and serving submodel data',
    icon: 'Storage',
    category: 'storage',
    color: '#fbbf24',
    requiredFields: ['name', 'endpoint'],
    optionalFields: ['storageType', 'submodelPath', 'description']
  },
  'keycloak': {
    type: 'keycloak',
    label: 'Keycloak',
    description: 'Identity and access management server',
    icon: 'Security',
    category: 'auth',
    color: '#a78bfa',
    requiredFields: ['name', 'endpoint'],
    optionalFields: ['realm', 'clientId', 'description']
  },
  'backend-service': {
    type: 'backend-service',
    label: 'Backend Service',
    description: 'Industry Core Hub backend API service',
    icon: 'Api',
    category: 'service',
    color: '#fb923c',
    requiredFields: ['name', 'endpoint'],
    optionalFields: ['apiVersion', 'description']
  }
};

/**
 * Connector version metadata
 */
export const CONNECTOR_VERSIONS: Record<ConnectorVersion, { label: string; description: string }> = {
  saturn: {
    label: 'Saturn',
    description: 'EDC Saturn release - stable version'
  },
  jupiter: {
    label: 'Jupiter',
    description: 'EDC Jupiter release - latest features'
  }
};

/**
 * Form data for creating/editing a system
 */
export interface SystemFormData {
  name: string;
  type: SystemType;
  endpoint: string;
  version?: ConnectorVersion;
  description?: string;
  // Additional optional fields
  managementApiEndpoint?: string;
  protocolEndpoint?: string;
  publicApiEndpoint?: string;
  apiKey?: string;
  apiVersion?: string;
  registryPath?: string;
  lookupEndpoint?: string;
  storageType?: string;
  submodelPath?: string;
  realm?: string;
  clientId?: string;
}

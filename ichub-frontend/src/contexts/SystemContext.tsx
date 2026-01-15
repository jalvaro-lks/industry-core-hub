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

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  SystemConfig, 
  SystemType, 
  SystemFormData, 
  ConnectionStatus,
  ConnectorConfig,
  DtrConfig,
  SubmodelServerConfig
} from '../types';

// Storage key for persisting systems
const SYSTEMS_STORAGE_KEY = 'ichub_system_configurations';

/**
 * Context interface for system management
 */
interface SystemContextType {
  /** All configured systems */
  systems: SystemConfig[];
  /** Currently active connector (control plane) */
  activeConnector: ConnectorConfig | null;
  /** Currently active DTR */
  activeDtr: DtrConfig | null;
  /** Currently active Submodel Server */
  activeSubmodelServer: SubmodelServerConfig | null;
  /** Loading state */
  isLoading: boolean;
  /** Add a new system */
  addSystem: (formData: SystemFormData) => Promise<SystemConfig>;
  /** Remove a system by ID */
  removeSystem: (systemId: string) => Promise<void>;
  /** Update a system configuration */
  updateSystem: (systemId: string, formData: Partial<SystemFormData>) => Promise<SystemConfig>;
  /** Set a system as active */
  setActiveSystem: (systemId: string) => Promise<void>;
  /** Toggle link status for a system */
  toggleLinkSystem: (systemId: string) => Promise<void>;
  /** Check connection status for a system */
  checkConnection: (systemId: string) => Promise<ConnectionStatus>;
  /** Get systems by type */
  getSystemsByType: (type: SystemType) => SystemConfig[];
  /** Get all connectors */
  getConnectors: () => ConnectorConfig[];
  /** Get all DTRs */
  getDtrs: () => DtrConfig[];
  /** Get all Submodel Servers */
  getSubmodelServers: () => SubmodelServerConfig[];
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

/**
 * Generate a unique ID for systems
 */
const generateId = (): string => {
  return `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create initial mock systems for demonstration
 */
const createInitialSystems = (): SystemConfig[] => [
  {
    id: 'sys_connector_cp_1',
    name: 'Primary Control Plane',
    type: 'connector-control-plane',
    endpoint: 'https://connector.local/control',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Main EDC Control Plane for production',
    version: 'saturn',
    managementApiEndpoint: 'https://connector.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_connector_cp_2',
    name: 'Development Control Plane',
    type: 'connector-control-plane',
    endpoint: 'https://dev-connector.local/control',
    status: 'disconnected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Development environment connector',
    version: 'jupiter',
    managementApiEndpoint: 'https://dev-connector.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_connector_dp_1',
    name: 'Primary Data Plane',
    type: 'connector-data-plane',
    endpoint: 'https://connector.local/data',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Main EDC Data Plane for data transfer',
    version: 'saturn',
    protocolEndpoint: 'https://connector.local/protocol',
    publicApiEndpoint: 'https://connector.local/public'
  } as ConnectorConfig,
  {
    id: 'sys_connector_dp_2',
    name: 'Backup Data Plane',
    type: 'connector-data-plane',
    endpoint: 'https://backup-connector.local/data',
    status: 'error',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Backup data plane for failover',
    version: 'saturn',
    protocolEndpoint: 'https://backup-connector.local/protocol',
    publicApiEndpoint: 'https://backup-connector.local/public'
  } as ConnectorConfig,
  {
    id: 'sys_dtr_1',
    name: 'Main Digital Twin Registry',
    type: 'dtr',
    endpoint: 'https://dtr.local/api/v3',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Primary registry for digital twins',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_dtr_2',
    name: 'Test DTR',
    type: 'dtr',
    endpoint: 'https://test-dtr.local/api/v3',
    status: 'unknown',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    description: 'DTR for testing purposes',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_submodel_1',
    name: 'Submodel Server',
    type: 'submodel-server',
    endpoint: 'https://submodel.local/api',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Primary submodel storage server',
    storageType: 'PostgreSQL',
    submodelPath: '/submodels'
  } as SubmodelServerConfig,
  {
    id: 'sys_submodel_2',
    name: 'Archive Submodel Server',
    type: 'submodel-server',
    endpoint: 'https://archive.submodel.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Archive storage for historical submodels',
    storageType: 'MongoDB',
    submodelPath: '/submodels'
  } as SubmodelServerConfig,
  {
    id: 'sys_submodel_3',
    name: 'PartAsPlanned Storage',
    type: 'submodel-server',
    endpoint: 'https://pap.submodel.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Dedicated storage for PartAsPlanned submodels',
    storageType: 'PostgreSQL',
    submodelPath: '/submodels/pap'
  } as SubmodelServerConfig,
  {
    id: 'sys_keycloak_1',
    name: 'Main Keycloak',
    type: 'keycloak',
    endpoint: 'https://keycloak.local/auth',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Central identity provider',
    realm: 'catena-x',
    clientId: 'ich-frontend'
  } as SystemConfig,
  {
    id: 'sys_keycloak_2',
    name: 'Staging Keycloak',
    type: 'keycloak',
    endpoint: 'https://staging-keycloak.local/auth',
    status: 'disconnected',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'Staging environment identity provider',
    realm: 'catena-x-staging',
    clientId: 'ich-frontend-staging'
  } as SystemConfig,
  {
    id: 'sys_backend_1',
    name: 'ICH Backend API',
    type: 'backend-service',
    endpoint: 'https://api.ichub.local/v1',
    status: 'connected',
    isActive: true,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Industry Core Hub backend service',
    apiVersion: 'v1'
  } as SystemConfig,
  {
    id: 'sys_backend_2',
    name: 'ICH Backend v2 (Beta)',
    type: 'backend-service',
    endpoint: 'https://api-v2.ichub.local/v2',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'New version of backend API (beta)',
    apiVersion: 'v2'
  } as SystemConfig,
  {
    id: 'sys_connector_cp_3',
    name: 'Partner A Connector',
    type: 'connector-control-plane',
    endpoint: 'https://partner-a.connector.local/control',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Control plane for Partner A integration',
    version: 'saturn',
    managementApiEndpoint: 'https://partner-a.connector.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_connector_dp_3',
    name: 'Partner A Data Plane',
    type: 'connector-data-plane',
    endpoint: 'https://partner-a.connector.local/data',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Data plane for Partner A transfers',
    version: 'saturn',
    protocolEndpoint: 'https://partner-a.connector.local/protocol',
    publicApiEndpoint: 'https://partner-a.connector.local/public'
  } as ConnectorConfig,
  {
    id: 'sys_connector_cp_4',
    name: 'OEM Supplier Connector',
    type: 'connector-control-plane',
    endpoint: 'https://oem-supplier.edc.local/control',
    status: 'unknown',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'OEM supplier integration connector',
    version: 'jupiter',
    managementApiEndpoint: 'https://oem-supplier.edc.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_dtr_3',
    name: 'Supplier DTR',
    type: 'dtr',
    endpoint: 'https://supplier-dtr.local/api/v3',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Digital Twin Registry for supplier data',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_dtr_4',
    name: 'Catena-X Central DTR',
    type: 'dtr',
    endpoint: 'https://central.dtr.catena-x.net/api/v3',
    status: 'error',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Catena-X central registry (read-only)',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_submodel_4',
    name: 'BOM Submodel Server',
    type: 'submodel-server',
    endpoint: 'https://bom.submodel.local/api',
    status: 'disconnected',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'Bill of Materials submodel storage',
    storageType: 'PostgreSQL',
    submodelPath: '/submodels/bom'
  } as SubmodelServerConfig,
  {
    id: 'sys_backend_3',
    name: 'Analytics Service',
    type: 'backend-service',
    endpoint: 'https://analytics.ichub.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Data analytics and reporting service',
    apiVersion: 'v1'
  } as SystemConfig,
  // Additional mock systems for more variety
  {
    id: 'sys_connector_cp_5',
    name: 'Tier 2 Supplier CP',
    type: 'connector-control-plane',
    endpoint: 'https://tier2-supplier.edc.local/control',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Tier 2 supplier connector control plane',
    version: 'saturn',
    managementApiEndpoint: 'https://tier2-supplier.edc.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_connector_cp_6',
    name: 'Logistics Provider CP',
    type: 'connector-control-plane',
    endpoint: 'https://logistics.connector.local/control',
    status: 'unknown',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'Control plane for logistics partner',
    version: 'jupiter',
    managementApiEndpoint: 'https://logistics.connector.local/management',
    apiKey: '***hidden***'
  } as ConnectorConfig,
  {
    id: 'sys_connector_dp_4',
    name: 'High-Volume Data Plane',
    type: 'connector-data-plane',
    endpoint: 'https://hv-data.connector.local/data',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Optimized data plane for high-volume transfers',
    version: 'saturn',
    protocolEndpoint: 'https://hv-data.connector.local/protocol',
    publicApiEndpoint: 'https://hv-data.connector.local/public'
  } as ConnectorConfig,
  {
    id: 'sys_connector_dp_5',
    name: 'Secure Transfer DP',
    type: 'connector-data-plane',
    endpoint: 'https://secure.dataplane.local/data',
    status: 'disconnected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    description: 'Enhanced security data plane',
    version: 'saturn',
    protocolEndpoint: 'https://secure.dataplane.local/protocol',
    publicApiEndpoint: 'https://secure.dataplane.local/public'
  } as ConnectorConfig,
  {
    id: 'sys_dtr_5',
    name: 'Quality DTR',
    type: 'dtr',
    endpoint: 'https://quality-dtr.local/api/v3',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Registry for quality management twins',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_dtr_6',
    name: 'PCF Registry',
    type: 'dtr',
    endpoint: 'https://pcf-dtr.local/api/v3',
    status: 'error',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Product Carbon Footprint registry',
    apiVersion: 'v3',
    registryPath: '/shell-descriptors',
    lookupEndpoint: '/lookup/shells'
  } as DtrConfig,
  {
    id: 'sys_submodel_5',
    name: 'Traceability Server',
    type: 'submodel-server',
    endpoint: 'https://traceability.submodel.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Traceability submodel storage',
    storageType: 'PostgreSQL',
    submodelPath: '/submodels/traceability'
  } as SubmodelServerConfig,
  {
    id: 'sys_submodel_6',
    name: 'PCF Submodel Server',
    type: 'submodel-server',
    endpoint: 'https://pcf.submodel.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Product Carbon Footprint storage',
    storageType: 'MongoDB',
    submodelPath: '/submodels/pcf'
  } as SubmodelServerConfig,
  {
    id: 'sys_submodel_7',
    name: 'Demand Capacity Server',
    type: 'submodel-server',
    endpoint: 'https://dcm.submodel.local/api',
    status: 'unknown',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'Demand and Capacity Management storage',
    storageType: 'PostgreSQL',
    submodelPath: '/submodels/dcm'
  } as SubmodelServerConfig,
  {
    id: 'sys_keycloak_3',
    name: 'Partner Portal Keycloak',
    type: 'keycloak',
    endpoint: 'https://partner-auth.local/auth',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Identity provider for partner portal',
    realm: 'partner-portal',
    clientId: 'partner-app'
  } as SystemConfig,
  {
    id: 'sys_keycloak_4',
    name: 'Dev SSO Server',
    type: 'keycloak',
    endpoint: 'https://dev-sso.internal/auth',
    status: 'disconnected',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    description: 'Development SSO server',
    realm: 'dev',
    clientId: 'ich-dev'
  } as SystemConfig,
  {
    id: 'sys_backend_4',
    name: 'Notification Service',
    type: 'backend-service',
    endpoint: 'https://notify.ichub.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Alert and notification service',
    apiVersion: 'v1'
  } as SystemConfig,
  {
    id: 'sys_backend_5',
    name: 'Audit Log Service',
    type: 'backend-service',
    endpoint: 'https://audit.ichub.local/api',
    status: 'connected',
    isActive: false,
    isLinked: true,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Compliance audit logging service',
    apiVersion: 'v1'
  } as SystemConfig,
  {
    id: 'sys_backend_6',
    name: 'Data Quality Service',
    type: 'backend-service',
    endpoint: 'https://dq.ichub.local/api',
    status: 'error',
    isActive: false,
    isLinked: false,
    createdAt: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
    description: 'Data quality validation service',
    apiVersion: 'v2'
  } as SystemConfig
];

/**
 * Provider component for System Management context
 */
export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [systems, setSystems] = useState<SystemConfig[]>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored systems:', error);
      }
    }
    // Return initial mock systems if nothing stored
    return createInitialSystems();
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Persist systems to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SYSTEMS_STORAGE_KEY, JSON.stringify(systems));
  }, [systems]);

  /**
   * Get the currently active connector (control plane)
   */
  const activeConnector = systems.find(
    (s): s is ConnectorConfig => 
      s.type === 'connector-control-plane' && s.isActive
  ) || null;

  /**
   * Get the currently active DTR
   */
  const activeDtr = systems.find(
    (s): s is DtrConfig => 
      s.type === 'dtr' && s.isActive
  ) || null;

  /**
   * Get the currently active Submodel Server
   */
  const activeSubmodelServer = systems.find(
    (s): s is SubmodelServerConfig => 
      s.type === 'submodel-server' && s.isActive
  ) || null;

  /**
   * Add a new system configuration
   */
  const addSystem = useCallback(async (formData: SystemFormData): Promise<SystemConfig> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newSystem: SystemConfig = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      endpoint: formData.endpoint,
      status: 'unknown',
      isActive: false,
      isLinked: true,
      createdAt: new Date().toISOString(),
      description: formData.description,
      ...(formData.type === 'connector-control-plane' || formData.type === 'connector-data-plane' 
        ? {
            version: formData.version || 'saturn',
            managementApiEndpoint: formData.managementApiEndpoint,
            protocolEndpoint: formData.protocolEndpoint,
            publicApiEndpoint: formData.publicApiEndpoint,
            apiKey: formData.apiKey
          } 
        : {}
      ),
      ...(formData.type === 'dtr' 
        ? {
            apiVersion: formData.apiVersion,
            registryPath: formData.registryPath,
            lookupEndpoint: formData.lookupEndpoint
          } 
        : {}
      ),
      ...(formData.type === 'submodel-server' 
        ? {
            storageType: formData.storageType,
            submodelPath: formData.submodelPath
          } 
        : {}
      ),
      ...(formData.type === 'keycloak' 
        ? {
            realm: formData.realm,
            clientId: formData.clientId
          } 
        : {}
      ),
      ...(formData.type === 'backend-service' 
        ? {
            apiVersion: formData.apiVersion
          } 
        : {}
      )
    } as SystemConfig;
    
    setSystems(prev => [...prev, newSystem]);
    setIsLoading(false);
    
    return newSystem;
  }, []);

  /**
   * Remove a system by ID
   */
  const removeSystem = useCallback(async (systemId: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setSystems(prev => prev.filter(s => s.id !== systemId));
    setIsLoading(false);
  }, []);

  /**
   * Update a system configuration
   */
  const updateSystem = useCallback(async (
    systemId: string, 
    formData: Partial<SystemFormData>
  ): Promise<SystemConfig> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let updatedSystem: SystemConfig | undefined;
    
    setSystems(prev => prev.map(s => {
      if (s.id === systemId) {
        updatedSystem = { ...s, ...formData } as SystemConfig;
        return updatedSystem;
      }
      return s;
    }));
    
    setIsLoading(false);
    
    if (!updatedSystem) {
      throw new Error(`System with ID ${systemId} not found`);
    }
    
    return updatedSystem;
  }, []);

  /**
   * Set a system as active (deactivates others of the same type)
   */
  const setActiveSystem = useCallback(async (systemId: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setSystems(prev => {
      const targetSystem = prev.find(s => s.id === systemId);
      if (!targetSystem) return prev;
      
      return prev.map(s => {
        if (s.type === targetSystem.type) {
          return { ...s, isActive: s.id === systemId };
        }
        return s;
      });
    });
    
    setIsLoading(false);
  }, []);

  /**
   * Toggle link status for a system
   */
  const toggleLinkSystem = useCallback(async (systemId: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    setSystems(prev => prev.map(s => {
      if (s.id === systemId) {
        return { ...s, isLinked: !s.isLinked };
      }
      return s;
    }));
    
    setIsLoading(false);
  }, []);

  /**
   * Check connection status for a system (mock implementation)
   */
  const checkConnection = useCallback(async (systemId: string): Promise<ConnectionStatus> => {
    // Simulate connection check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: randomly return connected or disconnected
    const statuses: ConnectionStatus[] = ['connected', 'connected', 'connected', 'disconnected', 'error'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    setSystems(prev => prev.map(s => {
      if (s.id === systemId) {
        return { 
          ...s, 
          status: newStatus,
          lastChecked: new Date().toISOString()
        };
      }
      return s;
    }));
    
    return newStatus;
  }, []);

  /**
   * Get systems filtered by type
   */
  const getSystemsByType = useCallback((type: SystemType): SystemConfig[] => {
    return systems.filter(s => s.type === type);
  }, [systems]);

  /**
   * Get all connectors
   */
  const getConnectors = useCallback((): ConnectorConfig[] => {
    return systems.filter(
      (s): s is ConnectorConfig => 
        s.type === 'connector-control-plane' || s.type === 'connector-data-plane'
    );
  }, [systems]);

  /**
   * Get all DTRs
   */
  const getDtrs = useCallback((): DtrConfig[] => {
    return systems.filter((s): s is DtrConfig => s.type === 'dtr');
  }, [systems]);

  /**
   * Get all Submodel Servers
   */
  const getSubmodelServers = useCallback((): SubmodelServerConfig[] => {
    return systems.filter((s): s is SubmodelServerConfig => s.type === 'submodel-server');
  }, [systems]);

  const value: SystemContextType = {
    systems,
    activeConnector,
    activeDtr,
    activeSubmodelServer,
    isLoading,
    addSystem,
    removeSystem,
    updateSystem,
    setActiveSystem,
    toggleLinkSystem,
    checkConnection,
    getSystemsByType,
    getConnectors,
    getDtrs,
    getSubmodelServers
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
};

/**
 * Hook to access the System Management context
 */
export const useSystemContext = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystemContext must be used within a SystemProvider');
  }
  return context;
};

export default SystemContext;

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

/// <reference types="vite/client" />

// Extend Window interface for runtime environment variables
declare global {
  interface Window {
    ENV?: {
      REQUIRE_HTTPS_URL_PATTERN?: string;
      ICHUB_BACKEND_URL?: string;
      PARTICIPANT_ID?: string;
      GOVERNANCE_CONFIG?: string;
      DTR_POLICIES_CONFIG?: string;
    }
  }
}

// Types for governance configuration
export interface GovernanceConstraint {
  leftOperand: string;
  operator: string;
  rightOperand: string;
}

export interface GovernanceRule {
  action: string;
  LogicalConstraint?: string;
  constraints: GovernanceConstraint[];
}

export interface GovernancePolicy {
  strict: boolean;
  permission: GovernanceRule | GovernanceRule[];
  prohibition: GovernanceRule | GovernanceRule[];
  obligation: GovernanceRule | GovernanceRule[];
}

export interface GovernanceConfig {
  semanticid: string;
  policies: GovernancePolicy[];
}

/**
 * Ensures window.ENV is properly initialized
 * This function can be called to guarantee ENV is available before accessing it
 */
const ensureWindowEnvInitialized = () => {
  if (!window.ENV) {
    console.warn('window.ENV not found, initializing with fallback values');
    window.ENV = {
      REQUIRE_HTTPS_URL_PATTERN: import.meta.env.VITE_REQUIRE_HTTPS_URL_PATTERN || 'false',
      ICHUB_BACKEND_URL: import.meta.env.VITE_ICHUB_BACKEND_URL || '',
      PARTICIPANT_ID: import.meta.env.VITE_PARTICIPANT_ID || '',
      GOVERNANCE_CONFIG: import.meta.env.VITE_GOVERNANCE_CONFIG || '[]',
      DTR_POLICIES_CONFIG: import.meta.env.VITE_DTR_POLICIES_CONFIG || '[]'
    };
  }
};

export const isRequireHttpsUrlPattern = () => {
  ensureWindowEnvInitialized();
  return window?.ENV?.REQUIRE_HTTPS_URL_PATTERN !== 'false';
};

export const getIchubBackendUrl = () => {
  ensureWindowEnvInitialized();
  
  // Debug: Log what's available
  console.log('🔍 Debugging backend URL resolution:');
  console.log('window?.ENV?.ICHUB_BACKEND_URL:', window?.ENV?.ICHUB_BACKEND_URL);
  console.log('import.meta.env.VITE_ICHUB_BACKEND_URL:', import.meta.env.VITE_ICHUB_BACKEND_URL);
  console.log('Full window.ENV object:', window?.ENV);
  
  // First try to get from window.ENV (runtime injection via Helm charts), then fallback to build-time env
  const backendUrl = window?.ENV?.ICHUB_BACKEND_URL || 
                     import.meta.env.VITE_ICHUB_BACKEND_URL;
  
  console.log('🎯 Resolved backend URL:', backendUrl);
  
  if (!backendUrl) {
    console.warn('❌ ICHUB_BACKEND_URL not configured. Ensure environment variable is set via Helm chart or build configuration.');
  }
  
  return backendUrl;
};
export const getParticipantId = () => {
  ensureWindowEnvInitialized();
  
  // Debug: Log what's available
  console.log('🔍 Debugging participant ID resolution:');
  console.log('window?.ENV?.PARTICIPANT_ID:', window?.ENV?.PARTICIPANT_ID);
  console.log('import.meta.env.VITE_PARTICIPANT_ID:', import.meta.env.VITE_PARTICIPANT_ID);
  
  // First try to get from window.ENV (runtime injection via Helm charts), then fallback to build-time env
  const participantId = window?.ENV?.PARTICIPANT_ID || 
                        import.meta.env.VITE_PARTICIPANT_ID;
  
  // Use fallback value if no participant ID is configured
  const resolvedId = participantId ?? 'BPNL0000000093Q7';
  console.log('🎯 Resolved participant ID:', resolvedId);
  
  return resolvedId;
};

export const getGovernanceConfig = (): GovernanceConfig[] => {
  ensureWindowEnvInitialized();
  try {
    // First try to get from window.ENV (runtime injection), then fallback to import.meta.env
    const configStr = window?.ENV?.GOVERNANCE_CONFIG || import.meta.env.VITE_GOVERNANCE_CONFIG;
    if (!configStr) return [];
    return JSON.parse(configStr) as GovernanceConfig[];
  } catch (error) {
    console.warn('Failed to parse governance configuration:', error);
    return [];
  }
};

export const getDtrPoliciesConfig = (): GovernancePolicy[] => {
  ensureWindowEnvInitialized();
  try {
    // First try to get from window.ENV (runtime injection), then fallback to import.meta.env
    const configStr = window?.ENV?.DTR_POLICIES_CONFIG || import.meta.env.VITE_DTR_POLICIES_CONFIG;
    if (!configStr) {
      // Return default DTR policies if no configuration is provided
      return [{
        strict: false,
        permission: {
          action: 'odrl:use',
          LogicalConstraint: 'odrl:and',
          constraints: [
            {
              leftOperand: 'cx-policy:FrameworkAgreement',
              operator: 'odrl:eq',
              rightOperand: 'DataExchangeGovernance:1.0'
            },
            {
              leftOperand: 'cx-policy:Membership',
              operator: 'odrl:eq',
              rightOperand: 'active'
            },
            {
              leftOperand: 'cx-policy:UsagePurpose',
              operator: 'odrl:eq',
              rightOperand: 'cx.core.digitalTwinRegistry:1'
            }
          ]
        },
        prohibition: [],
        obligation: []
      }];
    }
    return JSON.parse(configStr) as GovernancePolicy[];
  } catch (error) {
    console.warn('Failed to parse DTR policies configuration:', error);
    // Return default DTR policies on error
    return [{
      strict: false,
      permission: {
        action: 'odrl:use',
        LogicalConstraint: 'odrl:and',
        constraints: [
          {
            leftOperand: 'cx-policy:FrameworkAgreement',
            operator: 'odrl:eq',
            rightOperand: 'DataExchangeGovernance:1.0'
          },
          {
            leftOperand: 'cx-policy:Membership',
            operator: 'odrl:eq',
            rightOperand: 'active'
          },
          {
            leftOperand: 'cx-policy:UsagePurpose',
            operator: 'odrl:eq',
            rightOperand: 'cx.core.digitalTwinRegistry:1'
          }
        ]
      },
      prohibition: {
        action: 'odrl:prohibit',
        constraints: []
      },
      obligation: {
        action: 'odrl:compensate',
        constraints: []
      }
    }];
  }
};

const EnvironmentService = {
  isRequireHttpsUrlPattern,
  getIchubBackendUrl,
  getParticipantId,
  getGovernanceConfig,
  getDtrPoliciesConfig
};

export default EnvironmentService;

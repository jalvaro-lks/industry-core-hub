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

export const isRequireHttpsUrlPattern = () =>
  import.meta.env.VITE_REQUIRE_HTTPS_URL_PATTERN !== 'false';

export const getIchubBackendUrl = () => {
  const backendUrl = (import.meta as any).env.VITE_ICHUB_BACKEND_URL;
  
  // If no backend URL is configured, try to infer it from current URL
  if (!backendUrl) {
    const currentUrl = window.location.origin;
    // Replace frontend URL with backend URL pattern
    if (currentUrl.includes('frontend-ichub')) {
      return currentUrl.replace('frontend-ichub', 'backend-ichub');
    }
    // For local development, default to localhost:8000
    if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
      return 'http://localhost:8000';
    }
    // Fallback to current origin (this might not work but better than empty string)
    console.warn('VITE_ICHUB_BACKEND_URL not configured, using inferred backend URL');
    return currentUrl;
  }
  
  return backendUrl;
};
export const getParticipantId = () => import.meta.env.VITE_PARTICIPANT_ID ?? 'BPNL0000000093Q7';

export const getGovernanceConfig = (): GovernanceConfig[] => {
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

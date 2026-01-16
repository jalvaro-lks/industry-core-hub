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

import { Policy, PolicyVersion, PolicyDataType, PolicyType, PolicyStatus } from '../types/types';

/**
 * Mock policies for development - will be replaced with actual API calls
 */
export const mockPolicies: Policy[] = [
  {
    id: '1',
    name: 'Default Catalog Access Policy',
    description: 'Standard access policy for catalog parts within the dataspace',
    version: 'jupiter',
    type: 'access',
    dataType: 'catalog-parts',
    status: 'active',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE",
        "odrl:constraint": [{
          "odrl:leftOperand": "BusinessPartnerNumber",
          "odrl:operator": "eq",
          "odrl:rightOperand": "BPNL00000003CRHK"
        }]
      }]
    },
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
    createdBy: 'admin',
    tags: ['default', 'catalog']
  },
  {
    id: '2',
    name: 'Serialized Parts Usage Policy',
    description: 'Usage policy for serialized parts with time-limited access',
    version: 'jupiter',
    type: 'usage',
    dataType: 'serialized-parts',
    status: 'active',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE",
        "odrl:constraint": [{
          "odrl:leftOperand": "DateTime",
          "odrl:operator": "lteq",
          "odrl:rightOperand": "2026-12-31T23:59:59Z"
        }]
      }]
    },
    createdAt: '2025-01-08T14:30:00Z',
    updatedAt: '2025-01-12T09:15:00Z',
    createdBy: 'admin',
    tags: ['serialized', 'time-limited']
  },
  {
    id: '3',
    name: 'DPP Sustainability Policy',
    description: 'Access policy for Digital Product Passport sustainability data',
    version: 'saturn',
    type: 'access',
    dataType: 'digital-product-passport',
    status: 'active',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE",
        "odrl:constraint": [{
          "odrl:leftOperand": "Membership",
          "odrl:operator": "eq",
          "odrl:rightOperand": "active"
        }]
      }]
    },
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-01-05T08:00:00Z',
    createdBy: 'admin',
    tags: ['dpp', 'sustainability']
  },
  {
    id: '4',
    name: 'PCF Data Sharing Policy',
    description: 'Policy for sharing Product Carbon Footprint data with verified partners',
    version: 'jupiter',
    type: 'usage',
    dataType: 'pcf',
    status: 'draft',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE",
        "odrl:constraint": [{
          "odrl:leftOperand": "FrameworkAgreement",
          "odrl:operator": "eq",
          "odrl:rightOperand": "Sustainability"
        }]
      }]
    },
    createdAt: '2025-01-14T16:45:00Z',
    updatedAt: '2025-01-14T16:45:00Z',
    createdBy: 'admin',
    tags: ['pcf', 'sustainability', 'draft']
  },
  {
    id: '5',
    name: 'Legacy Traceability Policy',
    description: 'Saturn-compatible policy for traceability data exchange',
    version: 'saturn',
    type: 'access',
    dataType: 'traceability',
    status: 'inactive',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE"
      }]
    },
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2025-01-02T11:30:00Z',
    createdBy: 'admin',
    tags: ['legacy', 'traceability']
  },
  {
    id: '6',
    name: 'US Tariff Classification Policy',
    description: 'Access policy for US Tariff classification submodel data',
    version: 'jupiter',
    type: 'access',
    dataType: 'us-tariff',
    status: 'active',
    policyJson: {
      "@context": {
        "odrl": "http://www.w3.org/ns/odrl/2/"
      },
      "@type": "odrl:Set",
      "odrl:permission": [{
        "odrl:action": "USE",
        "odrl:constraint": [{
          "odrl:leftOperand": "Region",
          "odrl:operator": "eq",
          "odrl:rightOperand": "US"
        }]
      }]
    },
    createdAt: '2025-01-13T12:00:00Z',
    updatedAt: '2025-01-13T12:00:00Z',
    createdBy: 'admin',
    tags: ['tariff', 'compliance']
  }
];

/**
 * Simulated API delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all policies
 * @returns Promise<Policy[]>
 */
export const fetchPolicies = async (): Promise<Policy[]> => {
  await delay(500); // Simulate network delay
  return [...mockPolicies];
};

/**
 * Fetch a single policy by ID
 * @param id Policy ID
 * @returns Promise<Policy | undefined>
 */
export const fetchPolicyById = async (id: string): Promise<Policy | undefined> => {
  await delay(300);
  return mockPolicies.find(p => p.id === id);
};

/**
 * Create a new policy
 * @param policy Policy data
 * @returns Promise<Policy>
 */
export const createPolicy = async (policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Policy> => {
  await delay(500);
  const newPolicy: Policy = {
    ...policy,
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  mockPolicies.push(newPolicy);
  return newPolicy;
};

/**
 * Update an existing policy
 * @param id Policy ID
 * @param updates Policy updates
 * @returns Promise<Policy>
 */
export const updatePolicy = async (id: string, updates: Partial<Policy>): Promise<Policy> => {
  await delay(500);
  const index = mockPolicies.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Policy not found');
  }
  mockPolicies[index] = {
    ...mockPolicies[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return mockPolicies[index];
};

/**
 * Delete a policy
 * @param id Policy ID
 * @returns Promise<void>
 */
export const deletePolicy = async (id: string): Promise<void> => {
  await delay(500);
  const index = mockPolicies.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Policy not found');
  }
  mockPolicies.splice(index, 1);
};

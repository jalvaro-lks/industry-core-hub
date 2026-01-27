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
 * Policy version - corresponds to connector versions
 * Saturn: Current/latest connector version
 * Jupiter: Older/legacy connector version
 */
export type PolicyVersion = 'saturn' | 'jupiter';

/**
 * Policy type - Access or Usage policies
 */
export type PolicyType = 'access' | 'usage';

/**
 * Data type that the policy applies to
 */
export type PolicyDataType = 
  | 'digital-product-passport'
  | 'part-type-information'
  | 'us-tariff'
  | 'pcf'
  | 'traceability'
  | 'other';

/**
 * Policy status
 */
export type PolicyStatus = 'active' | 'inactive' | 'draft';

/**
 * Control plane configuration
 */
export interface ControlPlaneConfig {
  id: string;
  name: string;
  url: string;
}

/**
 * Policy constraint - individual rule within a policy
 */
export interface PolicyConstraint {
  leftOperand: string;
  operator: string;
  rightOperand: string;
}

/**
 * Policy permission
 */
export interface PolicyPermission {
  action: string;
  constraints: PolicyConstraint[];
}

/**
 * Main Policy interface
 */
export interface Policy {
  id: string;
  name: string;
  description?: string;
  version: PolicyVersion;
  type: PolicyType;
  dataType: PolicyDataType;
  status: PolicyStatus;
  controlPlane?: ControlPlaneConfig;
  policyJson: object;
  permissions?: PolicyPermission[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
}

/**
 * Policy creation payload
 */
export interface PolicyCreatePayload {
  name: string;
  description?: string;
  version: PolicyVersion;
  type: PolicyType;
  dataType: PolicyDataType;
  controlPlaneId?: string;
  policyJson: object;
  tags?: string[];
}

/**
 * Policy update payload
 */
export interface PolicyUpdatePayload extends Partial<PolicyCreatePayload> {
  status?: PolicyStatus;
}

/**
 * Policy filter options
 */
export interface PolicyFilters {
  search?: string;
  version?: PolicyVersion | 'all';
  type?: PolicyType | 'all';
  dataType?: PolicyDataType | 'all';
  status?: PolicyStatus | 'all';
  tags?: string[];
}

/**
 * Group policies by different criteria
 */
export type PolicyGroupBy = 'dataType' | 'type' | 'version' | 'status' | 'none';

/**
 * Data type display information
 */
export interface DataTypeInfo {
  id: PolicyDataType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Available data types with display info
 */
export const DATA_TYPE_INFO: Record<PolicyDataType, DataTypeInfo> = {
  'digital-product-passport': {
    id: 'digital-product-passport',
    label: 'Digital Product Passport',
    description: 'Policies for DPP submodels',
    icon: 'Badge',
    color: '#a78bfa'
  },
  'part-type-information': {
    id: 'part-type-information',
    label: 'Part Type Information',
    description: 'Policies for PartTypeInformation submodel',
    icon: 'Inventory',
    color: '#fbbf24'
  },
  'us-tariff': {
    id: 'us-tariff',
    label: 'US Tariff',
    description: 'Policies for US Tariff classification data',
    icon: 'Public',
    color: '#f472b6'
  },
  'pcf': {
    id: 'pcf',
    label: 'Product Carbon Footprint',
    description: 'Policies for PCF data',
    icon: 'EnergySavingsLeaf',
    color: '#22c55e'
  },
  'traceability': {
    id: 'traceability',
    label: 'Traceability',
    description: 'Policies for traceability data',
    icon: 'Timeline',
    color: '#06b6d4'
  },
  'other': {
    id: 'other',
    label: 'Other',
    description: 'Custom policies for other data types',
    icon: 'MoreHoriz',
    color: '#9ca3af'
  }
};

/**
 * Policy version display information
 */
export const POLICY_VERSION_INFO: Record<PolicyVersion, { label: string; description: string; color: string }> = {
  saturn: {
    label: 'Saturn',
    description: 'Latest connector version',
    color: '#f59e0b'
  },
  jupiter: {
    label: 'Jupiter',
    description: 'Legacy connector version',
    color: '#8b5cf6'
  }
};

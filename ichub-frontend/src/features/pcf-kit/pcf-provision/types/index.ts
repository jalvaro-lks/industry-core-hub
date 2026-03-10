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

/**
 * Status of a Product Carbon Footprint declaration
 */
export type PCFStatus = 'draft' | 'active' | 'shared' | 'archived' | 'pending';

/**
 * Product Carbon Footprint record
 */
export interface ProductCarbonFootprint {
  id: string;
  name: string;
  version: string;
  semanticId: string;
  status: PCFStatus;
  twinAssociation?: TwinAssociation;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  shareCount: number;
}

/**
 * List item view of a PCF (summary)
 */
export interface PCFListItem {
  id: string;
  name: string;
  version: string;
  semanticId: string;
  status: PCFStatus;
  twinId?: string;
  submodelId?: string;
  partType?: 'catalog' | 'serialized' | 'batch';
  manufacturerPartId?: string;
  partInstanceId?: string;
  createdAt: string;
  shareCount: number;
  pcfIdentifier?: string;
  // PCF-specific fields
  pcfLegalStatement?: string;
  carbonFootprint?: number;
  declaredUnit?: string;
  validityPeriodStart?: string;
  validityPeriodEnd?: string;
}

/**
 * Association between PCF and Digital Twin
 */
export interface TwinAssociation {
  twinId: string;
  aasId?: string;
  manufacturerPartId: string;
  partInstanceId: string;
  twinName?: string;
  assetId?: string;
}

/**
 * Serialized part twin search result
 */
export interface SerializedTwinSearchResult {
  id: string;
  twinId: string;
  aasId: string;
  manufacturerPartId: string;
  partInstanceId: string;
  name: string;
  location: string;
  assetId: string;
  createdAt: string;
}

/**
 * Dataspace partner for sharing
 */
export interface DataspacePartner {
  id: string;
  name: string;
  bpn: string;
  edcEndpoint: string;
}

/**
 * PCF version configuration
 */
export interface PCFVersionConfig {
  version: string;
  semanticId: string;
  schemaPath: string;
  name: string;
  description: string;
}

/**
 * PCF creation request payload
 */
export interface CreatePCFRequest {
  twinId: string;
  semanticId: string;
  data: Record<string, unknown>;
}

/**
 * PCF share request payload
 */
export interface SharePCFRequest {
  pcfId: string;
  businessPartnerNumber: string;
  customPartId?: string;
}

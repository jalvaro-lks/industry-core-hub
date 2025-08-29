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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import axios from 'axios';
import { getIchubBackendUrl } from '../../services/EnvironmentService';
import { ApiPartData } from '../../types/product';
import { CatalogPartTwinCreateType, TwinReadType } from '../../types/twin';
import { ShellDiscoveryResponse, getNextPageCursor, getPreviousPageCursor, hasNextPage, hasPreviousPage } from './utils';

const CATALOG_PART_MANAGEMENT_BASE_PATH = '/part-management/catalog-part';
const SHARE_CATALOG_PART_BASE_PATH = '/share/catalog-part';
const TWIN_MANAGEMENT_BASE_PATH = '/twin-management/catalog-part-twin';
const SHELL_DISCOVERY_BASE_PATH = '/discover/shells';
const backendUrl = getIchubBackendUrl();

// Types for Shell Discovery API requests
export interface QuerySpecItem {
  name: string;
  value: string;
}

export interface ShellDiscoveryRequest {
  counterPartyId: string;
  querySpec: QuerySpecItem[];
  limit?: number;
  cursor?: string;
}

export const fetchCatalogParts = async (): Promise<ApiPartData[]> => {
  const response = await axios.get<ApiPartData[]>(`${backendUrl}${CATALOG_PART_MANAGEMENT_BASE_PATH}`);
  return response.data;
};

export const fetchCatalogPart = async (
  manufacturerId: string ,
  manufacturerPartId: string
): Promise<ApiPartData> => {
  const response = await axios.get<ApiPartData>(
    `${backendUrl}${CATALOG_PART_MANAGEMENT_BASE_PATH}/${manufacturerId}/${manufacturerPartId}`
  );
  return response.data;
};

export const shareCatalogPart = async (
  manufacturerId: string,
  manufacturerPartId: string,
  businessPartnerNumber: string,
  customerPartId?: string
): Promise<ApiPartData> => {
  const requestBody: {
    manufacturerId: string;
    manufacturerPartId: string;
    businessPartnerNumber: string;
    customerPartId?: string;
  } = {
    manufacturerId,
    manufacturerPartId,
    businessPartnerNumber,
    customerPartId: customerPartId && customerPartId.trim() ? customerPartId.trim() : undefined,
  };

  const response = await axios.post<ApiPartData>(
    `${backendUrl}${SHARE_CATALOG_PART_BASE_PATH}`,
    requestBody
  );
  return response.data;
};

export const registerCatalogPartTwin = async (
  twinData: CatalogPartTwinCreateType
): Promise<TwinReadType> => {
  const response = await axios.post<TwinReadType>(
    `${backendUrl}${TWIN_MANAGEMENT_BASE_PATH}`,
    twinData
  );
  return response.data;
};

// Shell Discovery API Functions

/**
 * Discover shells based on query specifications
 */
export const discoverShells = async (
  request: ShellDiscoveryRequest
): Promise<ShellDiscoveryResponse> => {
  const response = await axios.post<ShellDiscoveryResponse>(
    `${backendUrl}${SHELL_DISCOVERY_BASE_PATH}`,
    request
  );
  return response.data;
};

/**
 * Discover shells for a specific counter party and digital twin type
 */
export const discoverShellsByType = async (
  counterPartyId: string,
  digitalTwinType: string,
  limit?: number,
  cursor?: string
): Promise<ShellDiscoveryResponse> => {
  const request: ShellDiscoveryRequest = {
    counterPartyId,
    querySpec: [
      {
        name: 'digitalTwinType',
        value: digitalTwinType
      }
    ],
    ...(limit && { limit }),
    ...(cursor && { cursor })
  };

  return discoverShells(request);
};

export const discoverShellsByCustomerPartId = async (
  counterPartyId: string,
  customerPartId: string,
  limit?: number,
  cursor?: string
): Promise<ShellDiscoveryResponse> => {
  const request: ShellDiscoveryRequest = {
    counterPartyId,
    querySpec: [
      {
        name: 'customerPartId',
        value: customerPartId
      }
    ],
    ...(limit && { limit }),
    ...(cursor && { cursor })
  };

  return discoverShells(request);
};

/**
 * Discover PartType shells for a specific counter party
 */
export const discoverPartTypeShells = async (
  counterPartyId: string,
  limit?: number,
  cursor?: string
): Promise<ShellDiscoveryResponse> => {
  return discoverShellsByType(counterPartyId, 'PartType', limit, cursor);
};

export const discoverPartInstanceShells = async (
  counterPartyId: string,
  limit?: number,
  cursor?: string
): Promise<ShellDiscoveryResponse> => {
  return discoverShellsByType(counterPartyId, 'PartInstance', limit, cursor);
};

/**
 * Get next page of shell discovery results
 */
export const getNextShellsPage = async (
  counterPartyId: string,
  digitalTwinType: string,
  nextCursor: string,
  limit?: number
): Promise<ShellDiscoveryResponse> => {
  return discoverShellsByType(counterPartyId, digitalTwinType, limit, nextCursor);
};

/**
 * Get previous page of shell discovery results
 */
export const getPreviousShellsPage = async (
  counterPartyId: string,
  digitalTwinType: string,
  previousCursor: string,
  limit?: number
): Promise<ShellDiscoveryResponse> => {
  return discoverShellsByType(counterPartyId, digitalTwinType, limit, previousCursor);
};

/**
 * Discover shells with custom query specifications
 */
export const discoverShellsWithCustomQuery = async (
  counterPartyId: string,
  querySpec: QuerySpecItem[],
  limit?: number,
  cursor?: string
): Promise<ShellDiscoveryResponse> => {
  const request: ShellDiscoveryRequest = {
    counterPartyId,
    querySpec,
    ...(limit && { limit }),
    ...(cursor && { cursor })
  };

  return discoverShells(request);
};

// Types for Single Shell Discovery
export interface SingleShellDiscoveryRequest {
  counterPartyId: string;
  id: string;
}

export interface SingleShellDiscoveryResponse {
  shell_descriptor: {
    description: unknown[];
    displayName: unknown[];
    globalAssetId: string;
    id: string;
    idShort: string;
    specificAssetIds: Array<{
      supplementalSemanticIds: unknown[];
      name: string;
      value: string;
      externalSubjectId: {
        type: string;
        keys: Array<{
          type: string;
          value: string;
        }>;
      };
    }>;
    submodelDescriptors: Array<{
      endpoints: Array<{
        interface: string;
        protocolInformation: {
          href: string;
          endpointProtocol: string;
          endpointProtocolVersion: string[];
          subprotocol: string;
          subprotocolBody: string;
          subprotocolBodyEncoding: string;
          securityAttributes: Array<{
            type: string;
            key: string;
            value: string;
          }>;
        };
      }>;
      idShort: string;
      id: string;
      semanticId: {
        type: string;
        keys: Array<{
          type: string;
          value: string;
        }>;
      };
      supplementalSemanticId: unknown[];
      description: unknown[];
      displayName: unknown[];
    }>;
  };
  dtr: {
    connectorUrl: string;
    assetId: string;
  };
}

/**
 * Discover a single shell by AAS ID
 */
export const discoverSingleShell = async (
  counterPartyId: string,
  aasId: string
): Promise<SingleShellDiscoveryResponse> => {
  const request: SingleShellDiscoveryRequest = {
    counterPartyId,
    id: aasId
  };

  const response = await axios.post<SingleShellDiscoveryResponse>(
    `${backendUrl}/discover/shell`,
    request
  );
  return response.data;
};

// Enhanced pagination functions that automatically extract cursors

/**
 * Get the next page of results using the current response
 */
export const getNextPageFromResponse = async (
  currentResponse: ShellDiscoveryResponse,
  counterPartyId: string,
  digitalTwinType: string,
  limit?: number
): Promise<ShellDiscoveryResponse | null> => {
  const nextCursor = getNextPageCursor(currentResponse);
  if (!nextCursor) {
    return null; // No more pages
  }
  
  return discoverShellsByType(counterPartyId, digitalTwinType, limit, nextCursor);
};

/**
 * Get the previous page of results using the current response
 */
export const getPreviousPageFromResponse = async (
  currentResponse: ShellDiscoveryResponse,
  counterPartyId: string,
  digitalTwinType: string,
  limit?: number
): Promise<ShellDiscoveryResponse | null> => {
  const previousCursor = getPreviousPageCursor(currentResponse);
  if (!previousCursor) {
    return null; // No previous pages
  }
  
  return discoverShellsByType(counterPartyId, digitalTwinType, limit, previousCursor);
};

/**
 * Get next page for custom query results
 */
export const getNextPageFromCustomQuery = async (
  currentResponse: ShellDiscoveryResponse,
  counterPartyId: string,
  querySpec: QuerySpecItem[],
  limit?: number
): Promise<ShellDiscoveryResponse | null> => {
  const nextCursor = getNextPageCursor(currentResponse);
  if (!nextCursor) {
    return null;
  }
  
  return discoverShellsWithCustomQuery(counterPartyId, querySpec, limit, nextCursor);
};

/**
 * Get previous page for custom query results
 */
export const getPreviousPageFromCustomQuery = async (
  currentResponse: ShellDiscoveryResponse,
  counterPartyId: string,
  querySpec: QuerySpecItem[],
  limit?: number
): Promise<ShellDiscoveryResponse | null> => {
  const previousCursor = getPreviousPageCursor(currentResponse);
  if (!previousCursor) {
    return null;
  }
  
  return discoverShellsWithCustomQuery(counterPartyId, querySpec, limit, previousCursor);
};

/**
 * Pagination helper that provides easy navigation methods
 */
export class ShellDiscoveryPaginator {
  private currentResponse: ShellDiscoveryResponse;
  private counterPartyId: string;
  private digitalTwinType?: string;
  private querySpec?: QuerySpecItem[];
  private limit?: number;

  constructor(
    currentResponse: ShellDiscoveryResponse,
    counterPartyId: string,
    digitalTwinTypeOrQuerySpec?: string | QuerySpecItem[],
    limit?: number
  ) {
    this.currentResponse = currentResponse;
    this.counterPartyId = counterPartyId;
    this.limit = limit;

    if (typeof digitalTwinTypeOrQuerySpec === 'string') {
      this.digitalTwinType = digitalTwinTypeOrQuerySpec;
    } else if (Array.isArray(digitalTwinTypeOrQuerySpec)) {
      this.querySpec = digitalTwinTypeOrQuerySpec;
    }
  }

  /**
   * Check if next page is available
   */
  hasNext(): boolean {
    return hasNextPage(this.currentResponse);
  }

  /**
   * Check if previous page is available
   */
  hasPrevious(): boolean {
    return hasPreviousPage(this.currentResponse);
  }

  /**
   * Get next page and update current response
   */
  async next(): Promise<ShellDiscoveryResponse | null> {
    let nextResponse: ShellDiscoveryResponse | null = null;

    if (this.digitalTwinType) {
      nextResponse = await getNextPageFromResponse(
        this.currentResponse,
        this.counterPartyId,
        this.digitalTwinType,
        this.limit
      );
    } else if (this.querySpec) {
      nextResponse = await getNextPageFromCustomQuery(
        this.currentResponse,
        this.counterPartyId,
        this.querySpec,
        this.limit
      );
    }

    if (nextResponse) {
      this.currentResponse = nextResponse;
    }

    return nextResponse;
  }

  /**
   * Get previous page and update current response
   */
  async previous(): Promise<ShellDiscoveryResponse | null> {
    let previousResponse: ShellDiscoveryResponse | null = null;

    if (this.digitalTwinType) {
      previousResponse = await getPreviousPageFromResponse(
        this.currentResponse,
        this.counterPartyId,
        this.digitalTwinType,
        this.limit
      );
    } else if (this.querySpec) {
      previousResponse = await getPreviousPageFromCustomQuery(
        this.currentResponse,
        this.counterPartyId,
        this.querySpec,
        this.limit
      );
    }

    if (previousResponse) {
      this.currentResponse = previousResponse;
    }

    return previousResponse;
  }

  /**
   * Get current response
   */
  getCurrentResponse(): ShellDiscoveryResponse {
    return this.currentResponse;
  }

  /**
   * Get pagination info
   */
  getPaginationInfo() {
    return {
      currentPage: this.currentResponse.pagination.page,
      shellsFound: this.currentResponse.shellsFound,
      hasNext: this.hasNext(),
      hasPrevious: this.hasPrevious()
    };
  }
}

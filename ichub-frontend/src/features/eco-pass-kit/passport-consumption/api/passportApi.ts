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

import { mockGenericPassport } from '../passport-types/generic/mockData';

/**
 * Mock API service for fetching passport data
 * This simulates API calls and returns mock data
 * Later this will be replaced with actual API calls to the backend
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export interface PassportResponse {
  data: Record<string, unknown>;
  semanticId?: string;
  digitalTwin?: {
    shell_descriptor: {
      id: string;
      idShort?: string;
      globalAssetId: string;
      assetKind: string;
      assetType: string;
      description?: Array<{ language: string; text: string }>;
      displayName?: Array<{ language: string; text: string }>;
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
      specificAssetIds: Array<{
        name: string;
        value: string;
      }>;
    };
    dtr?: {
      connectorUrl: string;
      assetId: string;
    };
  };
  counterPartyId?: string;
}

/**
 * Simulates fetching passport data by ID
 * @param _passportId - The passport identifier (currently unused in mock)
 * @returns Promise with passport data
 */
export const fetchPassportById = async (_passportId: string): Promise<PassportResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // For now, return mock data regardless of ID
  // Later, this will make actual API calls
  return {
    data: mockGenericPassport,
    semanticId: "urn:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport",
    digitalTwin: undefined,
    counterPartyId: undefined
  };
};

/**
 * Simulates fetching passport data with digital twin information
 * @param _passportId - The passport identifier (currently unused in mock)
 * @returns Promise with passport data including digital twin
 */
export const fetchPassportWithDigitalTwin = async (
  _passportId: string
): Promise<PassportResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Import digital twin mock data dynamically to avoid circular dependencies
  const { mockDigitalTwinData, mockCounterPartyId } = await import('../mockDigitalTwinData');

  return {
    data: mockGenericPassport,
    semanticId: "urn:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport",
    digitalTwin: mockDigitalTwinData,
    counterPartyId: mockCounterPartyId
  };
};

/**
 * Simulates searching for passports
 * @param _query - Search query (currently unused in mock)
 * @returns Promise with array of passport results
 */
export const searchPassports = async (_query: string): Promise<PassportResponse[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // For now, return a single mock result
  // Later, this will make actual API calls with search parameters
  return [
    {
      data: mockGenericPassport,
      semanticId: "urn:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport",
      digitalTwin: undefined,
      counterPartyId: undefined
    }
  ];
};

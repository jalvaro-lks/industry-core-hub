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

import axios from 'axios';

const API_BASE_URL = process.env.VITE_BACKEND_URL || '';

export interface PCFSearchResult {
  id: string;
  productName: string;
  manufacturerPartId: string;
  partInstanceId: string;
  carbonFootprint: number;
  declaredUnit: string;
  productDescription?: string;
  reportingPeriod?: {
    start: string;
    end: string;
  };
  version: string;
  providerBpn: string;
  lastUpdated: string;
}

export interface PCFData {
  id: string;
  specVersion: string;
  version: number;
  created: string;
  updated?: string;
  status: string;
  companyName: string;
  companyIds: string[];
  productDescription: string;
  productIds: string[];
  productCategoryCpc: string;
  productNameCompany: string;
  comment?: string;
  pcfExcludingBiogenic: number;
  pcfIncludingBiogenic?: number;
  fossilGhgEmissions?: number;
  fossilCarbonContent?: number;
  biogenicCarbonContent?: number;
  dlucGhgEmissions?: number;
  luGhgEmissions?: number;
  aircraftGhgEmissions?: number;
  packagingGhgEmissions?: number;
  boundaryProcessesDescription?: string;
  referencePeriodStart: string;
  referencePeriodEnd: string;
  geographyCountrySubdivision?: string;
  geographyCountry?: string;
  geographyRegionOrSubregion?: string;
  characterizationFactors: string;
  allocationRulesDescription?: string;
  allocationWasteIncineration?: string;
  primaryDataShare?: number;
  dqi?: {
    coveragePercent?: number;
    technologicalDQR?: number;
    temporalDQR?: number;
    geographicalDQR?: number;
    completenessDQR?: number;
    reliabilityDQR?: number;
  };
  assurance?: {
    coverage?: string;
    level?: string;
    boundary?: string;
    providerName?: string;
    completedAt?: string;
    standardName?: string;
    comments?: string;
  };
}

/**
 * Search for a PCF using Discovery ID
 */
export const searchPCF = async (discoveryId: string): Promise<PCFSearchResult> => {
  const response = await axios.get(`${API_BASE_URL}/addons/pcf-kit/search`, {
    params: { discoveryId }
  });
  return response.data;
};

/**
 * Fetch full PCF data from a provider
 */
export const fetchPCFFromProvider = async (discoveryId: string): Promise<PCFData> => {
  const response = await axios.get(`${API_BASE_URL}/addons/pcf-kit/consume`, {
    params: { discoveryId }
  });
  return response.data;
};

/**
 * Verify PCF data integrity and signatures
 */
export const verifyPCFData = async (pcfId: string): Promise<{ valid: boolean; details: string }> => {
  const response = await axios.get(`${API_BASE_URL}/addons/pcf-kit/verify/${pcfId}`);
  return response.data;
};

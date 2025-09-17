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
import { SerializedPart, AddSerializedPartRequest } from './types';
import { SerializedPartTwinCreateType, SerializedPartTwinShareCreateType, SerializedPartTwinUnshareCreateType, TwinReadType, SerializedPartTwinRead } from './types/twin-types';

const SERIALIZED_PART_READ_BASE_PATH = '/part-management/serialized-part';
const SERIALIZED_PART_TWIN_BASE_PATH = '/twin-management/serialized-part-twin';
const backendUrl = getIchubBackendUrl();

// Simple cache for twins to avoid redundant API calls
const twinsCache = new Map<string, { data: SerializedPartTwinRead[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (manufacturerId?: string, manufacturerPartId?: string) => {
  return `${manufacturerId || 'all'}-${manufacturerPartId || 'all'}`;
};

export const fetchAllSerializedParts = async (): Promise<SerializedPart[]> => {
  const response = await axios.get<SerializedPart[]>(`${backendUrl}${SERIALIZED_PART_READ_BASE_PATH}`);
  return response.data;
}

export const fetchSerializedParts = async (manufacturerId: string, manufacturerPartId: string ): Promise<SerializedPart[]> => {
  const response = await axios.post<SerializedPart[]>(
    `${backendUrl}${SERIALIZED_PART_READ_BASE_PATH}/query`,
    {
      manufacturerId,
      manufacturerPartId,
    }
  );
  return response.data;
};

export const addSerializedPart = async (payload: AddSerializedPartRequest ) => {
  const response = await axios.post<SerializedPart>(
    `${backendUrl}${SERIALIZED_PART_READ_BASE_PATH}`, payload
  );
  return response;
};

// Twin Management API Functions

export const createSerializedPartTwin = async (
  twinData: SerializedPartTwinCreateType
): Promise<TwinReadType> => {
  const response = await axios.post<TwinReadType>(
    `${backendUrl}${SERIALIZED_PART_TWIN_BASE_PATH}`,
    twinData
  );
  return response.data;
};

export const shareSerializedPartTwin = async (
  shareData: SerializedPartTwinShareCreateType
): Promise<void> => {
  await axios.post(
    `${backendUrl}${SERIALIZED_PART_TWIN_BASE_PATH}/share`,
    shareData
  );
};

export const fetchAllSerializedPartTwins = async (
  manufacturerId?: string,
  manufacturerPartId?: string
): Promise<SerializedPartTwinRead[]> => {
  // Check cache first
  const cacheKey = getCacheKey(manufacturerId, manufacturerPartId);
  const cached = twinsCache.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log('Returning cached twins data for:', cacheKey);
    return cached.data;
  }
  
  // Build query parameters to filter on the server side
  const params = new URLSearchParams();
  params.append('include_data_exchange_agreements', 'true');
  
  if (manufacturerId) {
    params.append('manufacturerId', manufacturerId);
  }
  if (manufacturerPartId) {
    params.append('manufacturerPartId', manufacturerPartId);
  }
  
  console.log('Fetching twins from API for:', cacheKey);
  const response = await axios.get<SerializedPartTwinRead[]>(
    `${backendUrl}${SERIALIZED_PART_TWIN_BASE_PATH}?${params.toString()}`
  );
  
  // Cache the result
  twinsCache.set(cacheKey, {
    data: response.data,
    timestamp: now
  });
  
  return response.data;
};

export const unshareSerializedPartTwin = async (
  unshareData: SerializedPartTwinUnshareCreateType
): Promise<void> => {
  await axios.post(
    `${backendUrl}${SERIALIZED_PART_TWIN_BASE_PATH}/unshare`,
    unshareData
  );
};

export const deleteSerializedPart = async (
  partnerCatalogPartId: number,
  partInstanceId: string
): Promise<void> => {
  console.log("deleteSerializedPart API called with:", { partnerCatalogPartId, partInstanceId });
  const url = `${backendUrl}${SERIALIZED_PART_READ_BASE_PATH}/${partnerCatalogPartId}/${partInstanceId}`;
  console.log("Delete URL:", url);
  
  try {
    const response = await axios.delete(url);
    console.log("Delete API response:", response);
  } catch (error) {
    console.error("Delete API error:", error);
    throw error;
  }
};
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

import { PCFListItem } from '../types';
import httpClient from '@/services/HttpClient';

const API_BASE_URL = '/addons/pcf-kit';

/**
 * Fetch all PCFs created by current user
 */
export const fetchUserPCFs = async (): Promise<PCFListItem[]> => {
  try {
    const response = await httpClient.get<{
      pcfId: string;
      name: string;
      version: string;
      semanticId: string;
      status: string;
      twinId?: string;
      submodelId?: string;
      partType?: string;
      manufacturerPartId?: string;
      partInstanceId?: string;
      createdAt: string;
      shareCount?: number;
      pcfIdentifier?: string;
      carbonFootprint?: number;
      declaredUnit?: string;
      validityPeriodStart?: string;
      validityPeriodEnd?: string;
    }[]>(`${API_BASE_URL}/pcf`);
    
    const data = response.data;
    
    // Transform backend response to frontend format
    return data.map((pcf) => ({
      id: pcf.pcfId,
      name: pcf.name,
      version: pcf.version,
      semanticId: pcf.semanticId,
      status: pcf.status.toLowerCase() as PCFListItem['status'],
      twinId: pcf.twinId,
      submodelId: pcf.submodelId,
      partType: pcf.partType as PCFListItem['partType'],
      manufacturerPartId: pcf.manufacturerPartId,
      partInstanceId: pcf.partInstanceId,
      createdAt: pcf.createdAt,
      shareCount: pcf.shareCount || 0,
      pcfIdentifier: pcf.pcfIdentifier,
      carbonFootprint: pcf.carbonFootprint,
      declaredUnit: pcf.declaredUnit,
      validityPeriodStart: pcf.validityPeriodStart,
      validityPeriodEnd: pcf.validityPeriodEnd
    }));
  } catch (error) {
    console.error('Error fetching PCFs from backend:', error);
    throw error;
  }
};

/**
 * Get PCF by ID with full details
 */
export const getPCFById = async (id: string): Promise<Record<string, unknown> | null> => {
  try {
    const response = await httpClient.get<Record<string, unknown>>(`${API_BASE_URL}/pcf/${id}`);
    return response.data;
  } catch (error) {
    if ((error as { response?: { status?: number } }).response?.status === 404) {
      return null;
    }
    console.error('Error fetching PCF by ID:', error);
    throw error;
  }
};

/**
 * Delete a PCF
 */
export const deletePCF = async (id: string): Promise<void> => {
  try {
    await httpClient.delete(`${API_BASE_URL}/pcf/${id}`);
  } catch (error) {
    console.error('Error deleting PCF:', error);
    throw error;
  }
};

/**
 * Share a PCF with a partner
 */
export const sharePCF = async (
  pcfId: string,
  partnerBpnl: string,
  customPartId?: string
): Promise<void> => {
  try {
    const payload = {
      pcfId: pcfId,
      businessPartnerNumber: partnerBpnl,
      ...(customPartId && { customPartId: customPartId })
    };

    console.log('Sharing PCF with payload:', JSON.stringify(payload));

    await httpClient.post(
      `${API_BASE_URL}/twin-management/serialized-part-twin/share?include_data_exchange_agreements=true`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error sharing PCF:', error);
    throw error;
  }
};

/**
 * Fetch submodel data for a PCF
 */
export const fetchPCFSubmodelData = async (
  semanticId: string,
  submodelId: string
): Promise<Record<string, unknown>> => {
  try {
    const encodedSemanticId = encodeURIComponent(semanticId);
    const encodedSubmodelId = encodeURIComponent(submodelId);
    const response = await httpClient.get<Record<string, unknown>>(
      `/v1/submodel-dispatcher/${encodedSemanticId}/${encodedSubmodelId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching PCF submodel data:', error);
    throw error;
  }
};

/**
 * Unshare a PCF (revoke sharing)
 */
export const unsharePCF = async (pcfId: string): Promise<void> => {
  try {
    await httpClient.post(`${API_BASE_URL}/pcf/${pcfId}/unshare`);
  } catch (error) {
    console.error('Error unsharing PCF:', error);
    throw error;
  }
};

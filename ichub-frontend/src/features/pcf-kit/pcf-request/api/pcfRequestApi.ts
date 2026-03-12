/********************************************************************************
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
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 *******************************************************************************/

import { fetchCatalogParts } from '../../../industry-core-kit/catalog-management/api';

// ============================================================================
// Types for PCF Request Feature
// ============================================================================

/**
 * Subpart PCF response - represents a supplier's subpart with its PCF status
 */
export interface SubpartPcfResponse {
  id: string;
  supplierBpn: string;
  supplierName: string;
  manufacturerPartId: string;
  partName: string;
  pcfStatus: 'pending' | 'delivered' | 'rejected' | 'error';
  pcfValue?: number;
  pcfUnit?: string;
  requestedAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  rejectReason?: string;
}

/**
 * Catalog Part with PCF information and linked subparts
 */
export interface CatalogPartPcfResponse {
  manufacturerId: string;
  manufacturerPartId: string;
  partName: string;
  description?: string;
  category?: string;
  subparts: SubpartPcfResponse[];
}

/**
 * Form data for adding a new subpart relation
 */
export interface AddSubpartFormData {
  supplierBpn: string;
  manufacturerPartId: string;
}

/**
 * Search result for catalog parts
 */
export interface CatalogPartSearchResult {
  manufacturerId: string;
  manufacturerPartId: string;
  partName: string;
  description?: string;
  category?: string;
}

// ============================================================================
// Mock Data for Development
// ============================================================================

const mockSubparts: Record<string, SubpartPcfResponse[]> = {
  'CAT-PART-001': [
    {
      id: 'sub-1',
      supplierBpn: 'BPNL00000001SUPP',
      supplierName: 'Steel Supplier GmbH',
      manufacturerPartId: 'STEEL-COMP-A1',
      partName: 'Steel Component A',
      pcfStatus: 'delivered',
      pcfValue: 12.5,
      pcfUnit: 'kg CO2e',
      requestedAt: '2024-12-01T10:00:00Z',
      deliveredAt: '2024-12-02T14:30:00Z',
    },
    {
      id: 'sub-2',
      supplierBpn: 'BPNL00000002SUPP',
      supplierName: 'Plastics Corp',
      manufacturerPartId: 'PLASTIC-HOUSING-B2',
      partName: 'Plastic Housing B',
      pcfStatus: 'pending',
      requestedAt: '2024-12-10T09:00:00Z',
    },
    {
      id: 'sub-3',
      supplierBpn: 'BPNL00000003SUPP',
      supplierName: 'Electronics Ltd',
      manufacturerPartId: 'PCB-BOARD-C3',
      partName: 'PCB Board C',
      pcfStatus: 'error',
      requestedAt: '2024-12-08T11:00:00Z',
      errorMessage: 'Connection timeout - supplier EDC unreachable',
    },
  ],
  'CAT-PART-002': [
    {
      id: 'sub-4',
      supplierBpn: 'BPNL00000004SUPP',
      supplierName: 'Aluminum Works',
      manufacturerPartId: 'ALU-FRAME-D4',
      partName: 'Aluminum Frame D',
      pcfStatus: 'delivered',
      pcfValue: 8.3,
      pcfUnit: 'kg CO2e',
      requestedAt: '2024-11-28T08:00:00Z',
      deliveredAt: '2024-11-29T16:45:00Z',
    },
    {
      id: 'sub-7',
      supplierBpn: 'BPNL00000007SUPP',
      supplierName: 'Metal Parts Inc',
      manufacturerPartId: 'METAL-BRACKET-G7',
      partName: 'Metal Bracket G',
      pcfStatus: 'rejected',
      requestedAt: '2024-12-03T09:00:00Z',
      rejectReason: 'Confidential data - PCF not shareable',
    },
  ],
  'CAT-PART-003': [
    {
      id: 'sub-5',
      supplierBpn: 'BPNL00000005SUPP',
      supplierName: 'Rubber Solutions',
      manufacturerPartId: 'RUBBER-SEAL-E5',
      partName: 'Rubber Seal E',
      pcfStatus: 'pending',
      requestedAt: '2024-12-09T08:00:00Z',
    },
    {
      id: 'sub-6',
      supplierBpn: 'BPNL00000006SUPP',
      supplierName: 'Glass Innovations',
      manufacturerPartId: 'GLASS-PANEL-F6',
      partName: 'Glass Panel F',
      pcfStatus: 'delivered',
      pcfValue: 5.7,
      pcfUnit: 'kg CO2e',
      requestedAt: '2024-12-05T13:00:00Z',
      deliveredAt: '2024-12-06T10:20:00Z',
    },
  ],
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search catalog parts by manufacturer part ID
 * Returns matching catalog parts from the system
 */
export async function searchCatalogPartsByManufacturerPartId(
  searchQuery: string
): Promise<CatalogPartSearchResult[]> {
  try {
    const catalogParts = await fetchCatalogParts();
    
    if (!searchQuery.trim()) {
      return catalogParts.map(part => ({
        manufacturerId: part.manufacturerId || '',
        manufacturerPartId: part.manufacturerPartId,
        partName: part.name,
        description: part.description,
        category: part.category,
      }));
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = catalogParts.filter(part => 
      part.manufacturerPartId.toLowerCase().includes(query) ||
      part.name.toLowerCase().includes(query)
    );
    
    return filtered.map(part => ({
      manufacturerId: part.manufacturerId || '',
      manufacturerPartId: part.manufacturerPartId,
      partName: part.name,
      description: part.description,
      category: part.category,
    }));
  } catch (error) {
    console.error('Error searching catalog parts:', error);
    // Return mock data for development
    return [
      {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-001',
        partName: 'Automotive Control Module',
        description: 'Electronic control unit for automotive applications',
        category: 'Electronics',
      },
      {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-002',
        partName: 'Chassis Assembly Frame',
        description: 'Main structural frame for vehicle chassis',
        category: 'Structural',
      },
      {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-003',
        partName: 'Sensor Module Package',
        description: 'Integrated sensor package for monitoring systems',
        category: 'Sensors',
      },
    ].filter(part => {
      const q = searchQuery.toLowerCase();
      return !searchQuery.trim() ||
        part.manufacturerPartId.toLowerCase().includes(q) ||
        part.partName.toLowerCase().includes(q);
    });
  }
}

/**
 * Get a catalog part with its linked subparts and PCF responses
 */
export async function getCatalogPartWithSubparts(
  manufacturerPartId: string
): Promise<CatalogPartPcfResponse | null> {
  try {
    const catalogParts = await fetchCatalogParts();
    const part = catalogParts.find(p => p.manufacturerPartId === manufacturerPartId);
    
    if (part) {
      // In production, fetch subparts from backend
      const subparts = mockSubparts[manufacturerPartId] || [];
      
      return {
        manufacturerId: part.manufacturerId || '',
        manufacturerPartId: part.manufacturerPartId,
        partName: part.name,
        description: part.description,
        category: part.category,
        subparts,
      };
    }
    
    // Fallback to mock data
    const mockPart = {
      'CAT-PART-001': {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-001',
        partName: 'Automotive Control Module',
        description: 'Electronic control unit for automotive applications',
        category: 'Electronics',
      },
      'CAT-PART-002': {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-002',
        partName: 'Chassis Assembly Frame',
        description: 'Main structural frame for vehicle chassis',
        category: 'Structural',
      },
      'CAT-PART-003': {
        manufacturerId: 'BPNL00000001CFRM',
        manufacturerPartId: 'CAT-PART-003',
        partName: 'Sensor Module Package',
        description: 'Integrated sensor package for monitoring systems',
        category: 'Sensors',
      },
    }[manufacturerPartId];
    
    if (mockPart) {
      return {
        ...mockPart,
        subparts: mockSubparts[manufacturerPartId] || [],
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching catalog part:', error);
    return null;
  }
}

/**
 * Add a new subpart relation to a catalog part
 */
export async function addSubpartRelation(
  parentManufacturerPartId: string,
  formData: AddSubpartFormData
): Promise<SubpartPcfResponse> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newSubpart: SubpartPcfResponse = {
    id: `sub-${Date.now()}`,
    supplierBpn: formData.supplierBpn,
    supplierName: `Supplier ${formData.supplierBpn.slice(-4)}`,
    manufacturerPartId: formData.manufacturerPartId,
    partName: `Part ${formData.manufacturerPartId}`,
    pcfStatus: 'pending',
    requestedAt: new Date().toISOString(),
  };
  
  // Add to mock data
  if (!mockSubparts[parentManufacturerPartId]) {
    mockSubparts[parentManufacturerPartId] = [];
  }
  mockSubparts[parentManufacturerPartId].push(newSubpart);
  
  return newSubpart;
}

/**
 * Request PCF for a specific subpart (send request to supplier)
 */
export async function requestSubpartPcf(
  parentManufacturerPartId: string,
  subpartId: string
): Promise<SubpartPcfResponse> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const subparts = mockSubparts[parentManufacturerPartId];
  if (subparts) {
    const subpart = subparts.find(s => s.id === subpartId);
    if (subpart) {
      // Simulate different responses randomly for demo
      const random = Math.random();
      if (random < 0.6) {
        // Success - delivered
        subpart.pcfStatus = 'delivered';
        subpart.pcfValue = Math.round(Math.random() * 20 * 10) / 10;
        subpart.pcfUnit = 'kg CO2e';
        subpart.deliveredAt = new Date().toISOString();
      } else if (random < 0.8) {
        // Rejected
        subpart.pcfStatus = 'rejected';
        subpart.rejectReason = 'Supplier declined to share PCF data';
      } else {
        // Error
        subpart.pcfStatus = 'error';
        subpart.errorMessage = 'Connection timeout - supplier EDC unreachable';
      }
      return { ...subpart };
    }
  }
  
  throw new Error('Subpart not found');
}

/**
 * Delete a subpart relation
 */
export async function deleteSubpartRelation(
  parentManufacturerPartId: string,
  subpartId: string
): Promise<void> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const subparts = mockSubparts[parentManufacturerPartId];
  if (subparts) {
    const index = subparts.findIndex(s => s.id === subpartId);
    if (index !== -1) {
      subparts.splice(index, 1);
    }
  }
}

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

import httpClient from '@/services/HttpClient';
import { getIchubBackendUrl } from '@/services/EnvironmentService';
import { 
  Certificate, 
  CertificateDetail,
  SharedCertificate, 
  CertificateFilter,
  PaginationParams,
  SortParams,
  PaginatedResponse,
  PartnerCertificateSearchResult,
  IncomingCertificateNotification,
  NegotiationStatus,
} from './types/types';
import { CertificateFormData } from './types/dialog-types';
import {
  mockFetchCertificates,
  mockFetchCertificateDetail,
  mockFetchSharingRecords,
  mockFetchIncomingNotifications,
  mockSearchPartnerCertificates,
  mockInitiateNegotiation,
  mockCheckNegotiationStatus,
  mockFetchTransferredCertificate,
  mockRegisterInDtr,
} from './mocks/mockData';

/**
 * CCM API base path following CX-0135 standard
 */
const CCM_BASE_PATH = '/api/ccm';
const backendUrl = getIchubBackendUrl();

/**
 * Build query string from filter, pagination and sort parameters
 */
const buildQueryString = (
  filter?: Partial<CertificateFilter>,
  pagination?: PaginationParams,
  sort?: SortParams
): string => {
  const params = new URLSearchParams();
  
  if (filter) {
    if (filter.search) params.append('search', filter.search);
    if (filter.type) params.append('type', filter.type);
    if (filter.status) params.append('status', filter.status);
    if (filter.shared !== undefined && filter.shared !== '') {
      params.append('shared', String(filter.shared));
    }
  }
  
  if (pagination) {
    params.append('page', String(pagination.page));
    params.append('page_size', String(pagination.pageSize));
  }
  
  if (sort) {
    params.append('sort_by', sort.sortBy);
    params.append('sort_order', sort.sortOrder);
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Fetch paginated list of certificates
 * GET /api/ccm/certificates
 * 
 * Query parameters for filtering:
 * - type: filter by certificate type
 * - status: filter by validity status (valid/expiring/expired)
 * - shared: filter by shared or not shared
 * - search: text search across name, issuer, BPN
 * 
 * Pagination: page, page_size
 * Sorting: sort_by (name, type, valid_until, shared_date), sort_order (asc, desc)
 */
export const fetchCertificates = async (
  filter?: Partial<CertificateFilter>,
  pagination?: PaginationParams,
  sort?: SortParams
): Promise<PaginatedResponse<Certificate>> => {
  try {
    if (!backendUrl) {
      console.warn('Backend URL not configured, returning empty certificates list');
      return { data: [], page: 0, pageSize: 10, totalCount: 0, totalPages: 0 };
    }
    
    const queryString = buildQueryString(filter, pagination, sort);
    const response = await httpClient.get<PaginatedResponse<Certificate>>(
      `${backendUrl}${CCM_BASE_PATH}/certificates${queryString}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
    return { data: [], page: 0, pageSize: 10, totalCount: 0, totalPages: 0 };
  }
};

/**
 * Fetch all certificates (non-paginated, for backward compatibility)
 */
export const fetchAllCertificates = async (): Promise<Certificate[]> => {
  try {
    if (!backendUrl) {
      console.warn('[CCM] Backend URL not configured — using mock certificates');
      return mockFetchCertificates();
    }
    
    const response = await httpClient.get<PaginatedResponse<Certificate>>(
      `${backendUrl}${CCM_BASE_PATH}/certificates?page_size=1000`
    );
    return response.data.data || [];
  } catch (error) {
    console.warn('[CCM] Certificates API unavailable — using mock data', error);
    return mockFetchCertificates();
  }
};

/**
 * Fetch certificate detail by ID
 * GET /api/ccm/certificates/{id}
 * 
 * Returns full certificate detail including:
 * - All metadata fields
 * - Sharing history (all partners shared with, dates, statuses, methods)
 * - BASE64 content (or download link for the PDF file)
 */
export const fetchCertificateById = async (certificateId: string): Promise<CertificateDetail | null> => {
  try {
    if (!backendUrl) {
      console.warn('[CCM] Backend URL not configured — using mock certificate detail');
      return mockFetchCertificateDetail(certificateId);
    }
    
    const response = await httpClient.get<CertificateDetail>(
      `${backendUrl}${CCM_BASE_PATH}/certificates/${certificateId}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch certificate detail:', error);
    return null;
  }
};

/**
 * Upload a new certificate
 * POST /api/ccm/certificates
 * 
 * Accepts multipart request with PDF file + metadata
 * PDF file is converted to BASE64 encoded string
 * 
 * Metadata fields mapped to BusinessPartnerCertificate v3.1.0:
 * - Certificate Type (e.g., ISO 9001, IATF 16949, ISO 14001)
 * - Certificate Name
 * - Issuer / Certification Body
 * - Valid From / Valid Until
 * - BPN-L of the certificate holder
 * - Description (optional)
 * 
 * Validation:
 * - File type validation (PDF only or PDF/PNG/JPG)
 * - File size limit (max 10MB)
 * - Required fields validation (type, name, issuer, dates)
 * - Date consistency (Valid From < Valid Until)
 */
export const createCertificate = async (certificateData: CertificateFormData): Promise<Certificate> => {
  const formData = new FormData();
  formData.append('name', certificateData.name);
  formData.append('type', certificateData.type);
  formData.append('bpn', certificateData.bpn);
  formData.append('issuer', certificateData.issuer);
  formData.append('validFrom', certificateData.validFrom);
  formData.append('validUntil', certificateData.validUntil);
  
  if (certificateData.certificateIdentifier) {
    formData.append('certificateIdentifier', certificateData.certificateIdentifier);
  }

  if (certificateData.certificateScope) {
    formData.append('certificateScope', certificateData.certificateScope);
  }

  if (certificateData.enclosedSitesBpn?.length) {
    // Send as JSON array string — backend expects JSON-encoded list
    formData.append('enclosedSitesBpn', JSON.stringify(certificateData.enclosedSitesBpn));
  }

  if (certificateData.description) {
    formData.append('description', certificateData.description);
  }
  
  if (certificateData.document) {
    formData.append('document', certificateData.document);
  }
  
  const response = await httpClient.post<Certificate>(
    `${backendUrl}${CCM_BASE_PATH}/certificates`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Replace the PDF document of an existing certificate.
 * PUT /api/ccm/certificates/{id}/document
 *
 * @param certificateId - ID of the certificate to update
 * @param document - New PDF file
 */
export const updateCertificateDocument = async (
  certificateId: string,
  document: File,
): Promise<void> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — mock update document');
    return;
  }
  const formData = new FormData();
  formData.append('document', document);
  await httpClient.put(
    `${backendUrl}${CCM_BASE_PATH}/certificates/${certificateId}/document`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
};

/**
 * Share a certificate with a partner via EDC
 * POST /api/ccm/certificates/{id}/share
 * 
 * Triggers EDC sharing workflow:
 * - Creates an EDC Data Asset for the certificate using CX-0135 data model
 * - Configures Access Policy and Usage Policy as specified in CX-0135
 * - Registers the asset with the EDC connector for the target partner's BPN
 * 
 * Stores sharing record in database:
 * - Target Partner BPN
 * - Shared Date
 * - EDC Contract ID
 * - Status (Active/Pending/Revoked)
 * 
 * @param certificateId - ID of the certificate to share
 * @param partnerBpn - BPN of the target partner
 * @param method - Sharing method: 'PULL' (EDC data offer) or 'PUSH' (notification)
 */
export const shareCertificate = async (
  certificateId: string,
  partnerBpn: string,
  method: 'PULL' | 'PUSH'
): Promise<SharedCertificate> => {
  const response = await httpClient.post<SharedCertificate>(
    `${backendUrl}${CCM_BASE_PATH}/certificates/${certificateId}/share`,
    { partnerBpn, method }
  );
  return response.data;
};

/**
 * Revoke shared access to a certificate
 * DELETE /api/ccm/certificates/{id}/share/{shareId}
 * 
 * Revokes the EDC contract and updates sharing record status to 'Revoked'
 */
export const revokeShare = async (certificateId: string, shareId: string): Promise<void> => {
  await httpClient.delete(
    `${backendUrl}${CCM_BASE_PATH}/certificates/${certificateId}/share/${shareId}`
  );
};

// ─── Sharing Outbox ───────────────────────────────────────────────────────────

/**
 * Fetch all sharing records (outbox) across all certificates.
 * GET /api/ccm/certificates/shares
 */
export const fetchSharingRecords = async (): Promise<SharedCertificate[]> => {
  try {
    if (!backendUrl) {
      console.warn('[CCM] Backend URL not configured — using mock sharing records');
      return mockFetchSharingRecords();
    }
    const response = await httpClient.get<SharedCertificate[]>(
      `${backendUrl}${CCM_BASE_PATH}/certificates/shares`
    );
    return response.data;
  } catch (error) {
    console.warn('[CCM] Sharing records API unavailable — using mock data', error);
    return mockFetchSharingRecords();
  }
};

// ─── DTR Registration ─────────────────────────────────────────────────────────

/**
 * Trigger DTR registration for a certificate.
 * Creates the Submodel Descriptor in the Digital Twin Registry and the
 * corresponding EDC Asset + Access/Usage Policies.
 * POST /api/ccm/certificates/{id}/register-dtr
 */
export const registerCertificateInDtr = async (
  certificateId: string,
): Promise<{ dtrStatus: 'registered'; edcAssetId: string }> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — using mock DTR registration');
    return mockRegisterInDtr(certificateId);
  }
  const response = await httpClient.post<{ dtrStatus: 'registered'; edcAssetId: string }>(
    `${backendUrl}${CCM_BASE_PATH}/certificates/${certificateId}/register-dtr`
  );
  return response.data;
};

// ─── Consumer / Discovery ─────────────────────────────────────────────────────

/**
 * Search for a partner's certificates by BPN.
 * Triggers the full discovery flow: BPN Lookup → DTR Resolution → Asset Discovery.
 * POST /api/ccm/consumer/search
 */
export const searchPartnerCertificates = async (
  partnerBpn: string,
): Promise<PartnerCertificateSearchResult> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — using mock partner search');
    return mockSearchPartnerCertificates(partnerBpn);
  }
  const response = await httpClient.post<PartnerCertificateSearchResult>(
    `${backendUrl}${CCM_BASE_PATH}/consumer/search`,
    { partnerBpn }
  );
  return response.data;
};

/**
 * Initiate EDC contract negotiation to access a partner certificate.
 * POST /api/ccm/consumer/negotiate
 */
export const initiateNegotiation = async (
  partnerBpn: string,
  edcAssetId: string,
): Promise<{ negotiationId: string }> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — using mock negotiation');
    return mockInitiateNegotiation(partnerBpn, edcAssetId);
  }
  const response = await httpClient.post<{ negotiationId: string }>(
    `${backendUrl}${CCM_BASE_PATH}/consumer/negotiate`,
    { partnerBpn, edcAssetId }
  );
  return response.data;
};

/**
 * Poll the status of an ongoing EDC contract negotiation.
 * GET /api/ccm/consumer/negotiate/{negotiationId}/status
 *
 * @param callCount - number of times this has been called; used by mock to simulate progression
 */
export const checkNegotiationStatus = async (
  negotiationId: string,
  callCount: number = 0,
): Promise<{ status: NegotiationStatus; transferId?: string }> => {
  if (!backendUrl) {
    return mockCheckNegotiationStatus(negotiationId, callCount);
  }
  const response = await httpClient.get<{ status: NegotiationStatus; transferId?: string }>(
    `${backendUrl}${CCM_BASE_PATH}/consumer/negotiate/${negotiationId}/status`
  );
  return response.data;
};

/**
 * Fetch the certificate payload retrieved after a successful EDC transfer.
 * GET /api/ccm/consumer/transfer/{transferId}
 */
export const fetchTransferredCertificate = async (
  transferId: string,
): Promise<Record<string, unknown>> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — using mock transferred certificate');
    return mockFetchTransferredCertificate(transferId);
  }
  const response = await httpClient.get<Record<string, unknown>>(
    `${backendUrl}${CCM_BASE_PATH}/consumer/transfer/${transferId}`
  );
  return response.data;
};

// ─── Incoming Notifications ───────────────────────────────────────────────────

/**
 * Fetch all incoming certificate push notifications.
 * GET /api/ccm/notifications/incoming
 */
export const fetchIncomingNotifications = async (): Promise<IncomingCertificateNotification[]> => {
  try {
    if (!backendUrl) {
      console.warn('[CCM] Backend URL not configured — using mock incoming notifications');
      return mockFetchIncomingNotifications();
    }
    const response = await httpClient.get<IncomingCertificateNotification[]>(
      `${backendUrl}${CCM_BASE_PATH}/notifications/incoming`
    );
    return response.data;
  } catch (error) {
    console.warn('[CCM] Notifications API unavailable — using mock data', error);
    return mockFetchIncomingNotifications();
  }
};

/**
 * Acknowledge an incoming certificate notification.
 * POST /api/ccm/notifications/incoming/{id}/acknowledge
 */
export const acknowledgeNotification = async (notificationId: string): Promise<void> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — mock acknowledge');
    return;
  }
  await httpClient.post(`${backendUrl}${CCM_BASE_PATH}/notifications/incoming/${notificationId}/acknowledge`);
};

/**
 * Reject an incoming certificate notification.
 * POST /api/ccm/notifications/incoming/{id}/reject
 */
export const rejectNotification = async (notificationId: string): Promise<void> => {
  if (!backendUrl) {
    console.warn('[CCM] Backend URL not configured — mock reject');
    return;
  }
  await httpClient.post(`${backendUrl}${CCM_BASE_PATH}/notifications/incoming/${notificationId}/reject`);
};

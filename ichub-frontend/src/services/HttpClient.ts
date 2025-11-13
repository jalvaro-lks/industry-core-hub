// HttpClient.ts - centralized axios instance with auth & API key headers
/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import axios, { AxiosError, AxiosInstance } from 'axios';
import authService from './AuthService';
import environmentService, { getIchubBackendUrl } from './EnvironmentService';

const httpClient: AxiosInstance = axios.create({
  timeout: environmentService.getApiConfig().timeout || 30000,
});

httpClient.interceptors.request.use((config) => {
  const envHeaders = environmentService.getApiHeaders();
  const authHeaders = authService.getAuthHeaders();
  config.headers = {
    ...(config.headers || {}),
    ...envHeaders,
    ...authHeaders,
  } as any;
  const backendUrl = getIchubBackendUrl();
  if (backendUrl && config.url && config.url.startsWith('/')) {
    config.url = `${backendUrl}${config.url}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try { await authService.logout(); } catch {}
    }
    return Promise.reject(error);
  }
);

export default httpClient;

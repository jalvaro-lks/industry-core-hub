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

import SystemManagement from './pages/SystemManagement';
import { FeatureConfig } from '@/types/routing';

/**
 * System Management feature configuration
 * This feature allows users to configure and manage connections to
 * Industry Core Hub components like Connectors, DTR, Submodel Server, etc.
 */
export const systemManagementFeature: FeatureConfig = {
  name: 'System Management',
  navigationPath: '/system-management',
  disabled: false,
  routes: [
    {
      path: '/system-management',
      element: <SystemManagement />,
      meta: {
        title: 'System Management',
        description: 'Configure and manage Industry Core Hub system connections'
      }
    }
  ]
};

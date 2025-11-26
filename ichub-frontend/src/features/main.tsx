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

import { 
  Assignment,
  Hub,
  Recycling,
  Link,
  DeviceHub,
  Timeline,
  Build,
  Science
} from '@mui/icons-material';
import { kitFeaturesFeature } from './kit-features/routes';
import { FeatureConfig, NavigationItem } from '@/types/routing';
import { KitFeature } from './kit-features/types';

// Import feature modules
import { catalogManagementFeature } from './industry-core-kit/catalog-management/routes';
import { partDiscoveryFeature } from './industry-core-kit/part-discovery/routes';
import { partnerManagementFeature } from './industry-core-kit/partner-management/routes';
import { serializedPartsFeature } from './industry-core-kit/serialized-parts/routes';

// KIT configurations with feature toggles
export const kits: KitFeature[] = [
  // 1. Industry Core KIT
  {
    id: 'industry-core',
    name: 'Industry Core KIT',
    description: 'Core functionality for industrial data management, partner discovery, and catalog management.',
    status: 'available',
    icon: <Hub />,
    image: '/src/assets/kit-images/industry-core-kit.svg',
    features: [
      { id: 'catalog-management', name: 'Catalog Management', description: 'Manage service catalogs and registrations', enabled: true, default: true, module: catalogManagementFeature },
      { id: 'serialized-parts', name: 'Serialized Parts', description: 'Track and manage serialized components', enabled: true, default: true, module: serializedPartsFeature },
      { id: 'dataspace-discovery', name: 'Dataspace Discovery', description: 'Discover and connect to data spaces', enabled: true, default: true, module: partDiscoveryFeature },
      { id: 'participants', name: 'Participants Management', description: 'Manage ecosystem participants', enabled: true, default: true, module: partnerManagementFeature }
    ],
    category: 'core',
    version: '1.0.0',
    lastUpdated: '2024-10-15'
  },
  {
    id: 'eco-pass',
    name: 'Eco Pass KIT',
    description: 'Environmental sustainability tracking and carbon footprint management for supply chains.',
    status: 'available',
    icon: <Recycling />,
    image: '/src/assets/kit-images/eco-pass-kit.svg',
    features: [
      { id: 'carbon-footprint', name: 'Carbon Footprint', description: 'Environmental impact tracking', enabled: false },
      { id: 'environmental-impact', name: 'Environmental Impact', description: 'Assess environmental impacts', enabled: false },
      { id: 'sustainability-reports', name: 'Sustainability Reports', description: 'Generate sustainability reports', enabled: false },
      { id: 'green-metrics', name: 'Green Metrics', description: 'Track green performance metrics', enabled: false }
    ],
    category: 'sustainability'
  },
  // 2. PCF KIT
  {
    id: 'pcf',
    name: 'PCF KIT',
    description: 'Product Carbon Footprint calculation and lifecycle assessment tools.',
    status: 'coming-soon',
    icon: <Science />,
    image: '/src/assets/kit-images/pcf-kit.svg',
    features: [
      { id: 'carbon-calculation', name: 'Carbon Calculation', description: 'Calculate product carbon footprints', enabled: false },
      { id: 'lifecycle-assessment', name: 'Lifecycle Assessment', description: 'Perform comprehensive LCA analysis', enabled: false },
      { id: 'emission-tracking', name: 'Emission Tracking', description: 'Track and monitor emissions', enabled: false },
      { id: 'reports', name: 'Sustainability Reports', description: 'Generate detailed sustainability reports', enabled: false }
    ],
    category: 'sustainability',
    version: '0.9.0',
    lastUpdated: '2024-10-10'
  },
  // 3. Data Chain KIT
  {
    id: 'data-chain',
    name: 'Data Chain KIT',
    description: 'Secure data sharing and interoperability across automotive value chains.',
    status: 'coming-soon',
    icon: <Link />,
    image: '/src/assets/kit-images/data-chain-kit.svg',
    features: [
      { id: 'data-sharing', name: 'Data Sharing', description: 'Secure data sharing capabilities', enabled: false },
      { id: 'interoperability', name: 'Interoperability', description: 'Cross-platform interoperability', enabled: false },
      { id: 'chain-management', name: 'Chain Management', description: 'Manage data chains', enabled: false },
      { id: 'data-governance', name: 'Data Governance', description: 'Data governance and policies', enabled: false }
    ],
    category: 'collaboration'
  },
  // 4. Business Partner KIT
  {
    id: 'business-partner',
    name: 'Business Partner KIT',
    description: 'Comprehensive business partner data management and validation.',
    status: 'coming-soon',
    icon: <Build />,
    image: '/src/assets/kit-images/business-partner-kit.svg',
    features: [
      { id: 'partner-data', name: 'Partner Data', description: 'Manage partner information', enabled: false },
      { id: 'validation', name: 'Validation', description: 'Validate partner data', enabled: false },
      { id: 'master-data', name: 'Master Data', description: 'Master data management', enabled: false },
      { id: 'golden-record', name: 'Golden Record', description: 'Create golden records', enabled: false }
    ],
    category: 'core'
  },
  // 5. DCM KIT
  {
    id: 'dcm',
    name: 'DCM KIT',
    description: 'Demand and Capacity Management for optimizing supply chain operations.',
    status: 'coming-soon',
    icon: <DeviceHub />,
    image: '/src/assets/kit-images/dcm-kit.svg',
    features: [
      { id: 'demand-planning', name: 'Demand Planning', description: 'Plan and forecast demand', enabled: false },
      { id: 'capacity-planning', name: 'Capacity Planning', description: 'Optimize capacity planning', enabled: false },
      { id: 'resource-optimization', name: 'Resource Optimization', description: 'Optimize resource allocation', enabled: false },
      { id: 'analytics', name: 'Analytics', description: 'Advanced analytics and insights', enabled: false }
    ],
    category: 'core'
  },
  // 7. Traceability KIT
  {
    id: 'traceability',
    name: 'Traceability KIT',
    description: 'End-to-end traceability of parts and components throughout the supply chain.',
    status: 'coming-soon',
    icon: <Timeline />,
    image: '/src/assets/kit-images/traceability-kit.svg',
    features: [
      { id: 'part-tracking', name: 'Part Tracking', description: 'Track parts through supply chain', enabled: false },
      { id: 'supply-chain-visibility', name: 'Supply Chain Visibility', description: 'Full supply chain visibility', enabled: false },
      { id: 'origin-verification', name: 'Origin Verification', description: 'Verify part origins', enabled: false },
      { id: 'recall-management', name: 'Recall Management', description: 'Manage product recalls', enabled: false }
    ],
    category: 'traceability',
    version: '1.0.0',
    lastUpdated: '2024-10-24'
  }
];

// Get enabled features from kits configuration
const getEnabledFeatures = (): FeatureConfig[] => {
  return kits
    .flatMap(kit => kit.features)
    .filter(feature => feature.enabled && feature.module)
    .map(feature => feature.module!);
};

// Import all feature configurations (only enabled ones)
export const allFeatures: FeatureConfig[] = [
  ...getEnabledFeatures(),
  // Add placeholder for status feature (disabled)
  {
    name: 'Status',
    icon: <Assignment />,
    navigationPath: '/status',
    disabled: true,
    routes: []
  }
];

export const kitFeaturesConfig = kitFeaturesFeature;

// Extract just the navigation items for the sidebar (backward compatibility)
export const features: NavigationItem[] = allFeatures.map(feature => ({
  icon: feature.icon,
  path: feature.navigationPath,
  disabled: feature.disabled
}));

// Get all routes from all features
export const getAllRoutes = () => {
return [...allFeatures.flatMap(feature => feature.routes), ...kitFeaturesConfig.routes];
};

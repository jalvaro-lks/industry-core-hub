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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  Hub,
  Recycling,
  Link,
  Security,
  Analytics,
  DeviceHub,
  Timeline,
  Inventory,
  AccountTree,
  Cloud,
  Build,
  Engineering,
  VerifiedUser,
  Science,
  QrCode,
  LocalShipping
} from '@mui/icons-material';
import KitCard from '../components/KitCard';
import { KitFeature } from '../types';

const KitFeaturesPage: React.FC = () => {
  const [kits, setKits] = useState<KitFeature[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());

  // Mock data for KITs - en producción esto vendría de una API
  const mockKits: KitFeature[] = [
    {
      id: 'industry-core',
      name: 'Industry Core KIT',
      description: 'Core functionality for industrial data management, partner discovery, and catalog management.',
      enabled: true,
      icon: <Hub />,
      features: ['Catalog Management', 'Serialized Parts', 'Dataspace Discovery', 'Participants'],
      category: 'core'
    },
    {
      id: 'eco-pass',
      name: 'Eco Pass KIT',
      description: 'Environmental sustainability tracking and carbon footprint management for supply chains.',
      enabled: false,
      icon: <Recycling />,
      features: ['Carbon Footprint', 'Environmental Impact', 'Sustainability Reports', 'Green Metrics'],
      category: 'sustainability'
    },
    {
      id: 'data-chain',
      name: 'Data Chain KIT',
      description: 'Secure data sharing and interoperability across automotive value chains.',
      enabled: false,
      icon: <Link />,
      features: ['Data Sharing', 'Interoperability', 'Chain Management', 'Data Governance'],
      category: 'collaboration'
    },
    {
      id: 'certificate',
      name: 'Certificate KIT',
      description: 'Digital certificates and compliance management for automotive components.',
      enabled: false,
      icon: <VerifiedUser />,
      features: ['Digital Certificates', 'Compliance Check', 'Verification', 'Audit Trail'],
      category: 'quality'
    },
    {
      id: 'pcf',
      name: 'PCF KIT',
      description: 'Product Carbon Footprint calculation and lifecycle assessment tools.',
      enabled: false,
      icon: <Science />,
      features: ['Carbon Calculation', 'Lifecycle Assessment', 'Emission Tracking', 'Reports'],
      category: 'sustainability'
    },
    {
      id: 'dcm',
      name: 'DCM KIT',
      description: 'Demand and Capacity Management for optimizing supply chain operations.',
      enabled: false,
      icon: <DeviceHub />,
      features: ['Demand Planning', 'Capacity Planning', 'Resource Optimization', 'Analytics'],
      category: 'core'
    },
    {
      id: 'traceability',
      name: 'Traceability KIT',
      description: 'End-to-end traceability of parts and components throughout the supply chain.',
      enabled: false,
      icon: <Timeline />,
      features: ['Part Tracking', 'Supply Chain Visibility', 'Origin Verification', 'Recall Management'],
      category: 'traceability'
    },
    {
      id: 'material-pass',
      name: 'Material Pass KIT',
      description: 'Digital material passports for transparency and compliance in material sourcing.',
      enabled: false,
      icon: <QrCode />,
      features: ['Material Passport', 'Sourcing Transparency', 'Composition Analysis', 'Compliance'],
      category: 'quality'
    },
    {
      id: 'behaviour-twin',
      name: 'Behaviour Twin KIT',
      description: 'Digital twins for predictive behavior modeling and simulation.',
      enabled: false,
      icon: <AccountTree />,
      features: ['Digital Twin', 'Behavior Modeling', 'Predictive Analytics', 'Simulation'],
      category: 'core'
    },
    {
      id: 'connector',
      name: 'Connector KIT',
      description: 'Eclipse Dataspace Connector for secure and sovereign data exchange.',
      enabled: false,
      icon: <Cloud />,
      features: ['Data Connector', 'Sovereign Exchange', 'Policy Management', 'Identity Hub'],
      category: 'collaboration'
    },
    {
      id: 'business-partner',
      name: 'Business Partner KIT',
      description: 'Comprehensive business partner data management and validation.',
      enabled: false,
      icon: <Build />,
      features: ['Partner Data', 'Validation', 'Master Data', 'Golden Record'],
      category: 'core'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing KIT',
      description: 'Manufacturing process optimization and production data management.',
      enabled: false,
      icon: <Engineering />,
      features: ['Process Optimization', 'Production Data', 'Quality Control', 'Efficiency'],
      category: 'core'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setKits(mockKits);
  }, []);

  const handleKitToggle = (kitId: string, enabled: boolean) => {
    setKits(prevKits => 
      prevKits.map(kit => 
        kit.id === kitId ? { ...kit, enabled } : kit
      )
    );
    
    const kit = kits.find(k => k.id === kitId);
    setSnackbarMessage(
      `${kit?.name} has been ${enabled ? 'enabled' : 'disabled'}`
    );
    setSnackbarOpen(true);
  };



  const handleViewFeatures = (kitId: string) => {
    setExpandedKits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kitId)) {
        newSet.delete(kitId);
      } else {
        newSet.add(kitId);
      }
      return newSet;
    });
  };

  const categories = [
    { value: 'all', label: 'All KITs' },
    { value: 'core', label: 'Core' },
    { value: 'sustainability', label: 'Sustainability' },
    { value: 'quality', label: 'Quality' },
    { value: 'traceability', label: 'Traceability' },
    { value: 'collaboration', label: 'Collaboration' }
  ];

  const filteredKits = selectedCategory === 'all' 
    ? kits 
    : kits.filter(kit => kit.category === selectedCategory);

  return (
    <Box className="kit-features-container" sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", pt: 2, px: 3 }}>
      <Box mb={2} textAlign="center">
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: '800', 
            color: 'primary.main',
            textAlign: 'center',
            mb: 2,
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
            textShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          KIT Features
        </Typography>
        <Typography variant="body1" className="kit-features-subtitle" paragraph sx={{ mb: 2 }}>
          Manage and configure Tractus-X KITs. Enable or disable specific KITs to customize your application features.
        </Typography>
      </Box>

      <Paper className="kit-category-tabs" sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map((category) => (
            <Tab
              key={category.value}
              label={category.label}
              value={category.value}
            />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {filteredKits.map((kit) => (
          <Grid item xs={12} sm={6} md={4} key={kit.id}>
            <KitCard
              kit={kit}
              onToggle={handleKitToggle}
              onViewFeatures={handleViewFeatures}
              isExpanded={expandedKits.has(kit.id)}
            />
          </Grid>
        ))}
      </Grid>

      {filteredKits.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No KITs found in this category
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KitFeaturesPage;
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

import React from 'react';
import { Box, Typography, Paper, Container, Chip } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

/**
 * Placeholder page for PCF Provision feature.
 * This page will be implemented with full functionality in a future release.
 */
const PcfProvisionPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          border: '2px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <ConstructionIcon 
          sx={{ 
            fontSize: 80, 
            color: 'warning.main',
            mb: 3 
          }} 
        />
        <Typography variant="h4" gutterBottom fontWeight={600}>
          PCF Provision & Management
        </Typography>
        <Chip 
          label="Coming Soon" 
          color="warning" 
          size="small" 
          sx={{ mb: 3 }} 
        />
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          This feature will allow you to create, manage, and share Product Carbon Footprint (PCF) 
          declarations with your dataspace partners. Track emissions data across your product 
          lifecycle and contribute to sustainability reporting.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PcfProvisionPage;

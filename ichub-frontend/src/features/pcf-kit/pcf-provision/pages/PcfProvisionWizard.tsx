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
import { useNavigate } from 'react-router-dom';
import { Typography, Paper, Container, Chip, Button } from '@mui/material';
import { 
  Construction as ConstructionIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

/**
 * Placeholder page for PCF Creation Wizard.
 * This page will be implemented with full functionality in a future release.
 */
const PcfProvisionWizard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/pcf/provision')}
        sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
      >
        Back to PCF List
      </Button>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          border: '2px dashed',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          backgroundColor: 'rgba(30, 30, 30, 0.5)'
        }}
      >
        <ConstructionIcon 
          sx={{ 
            fontSize: 80, 
            color: '#22c55e',
            mb: 3 
          }} 
        />
        <Typography variant="h4" gutterBottom fontWeight={600} color="white">
          Create PCF Declaration
        </Typography>
        <Chip 
          label="Coming Soon" 
          size="small" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: '#22c55e'
          }} 
        />
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          The PCF creation wizard will allow you to create new Product Carbon Footprint 
          declarations following the Pathfinder Framework. You'll be able to input emission 
          data, set reference periods, and register your PCF in the dataspace.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PcfProvisionWizard;

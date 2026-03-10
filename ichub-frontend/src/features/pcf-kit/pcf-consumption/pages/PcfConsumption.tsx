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
import { useParams, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Container,
  InputAdornment
} from '@mui/material';
import {
  QrCodeScanner,
  Search,
  Close as CloseIcon,
  CheckCircle,
  RadioButtonUnchecked,
  Downloading,
  Security,
  VerifiedUser,
  Storage,
  Co2 as Co2Icon,
  EnergySavingsLeaf as EnergySavingsLeafIcon
} from '@mui/icons-material';
import { PCFData } from '../api/pcfConsumptionApi';
import { pcfCardStyles } from '../../pcf-provision/styles/cardStyles';
import PcfVisualization from '../components/PcfVisualization';

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const LOADING_STEPS: LoadingStep[] = [
  { id: 'lookup', label: 'Looking up PCF', icon: Search, description: 'Searching in the dataspace registry' },
  { id: 'retrieve', label: 'Retrieving Data', icon: Downloading, description: 'Fetching PCF from provider' },
  { id: 'verify', label: 'Verifying Data', icon: Security, description: 'Validating data integrity' },
  { id: 'parse', label: 'Parsing Content', icon: Storage, description: 'Processing PCF structure' },
  { id: 'complete', label: 'Ready', icon: VerifiedUser, description: 'PCF loaded successfully' }
];

const PcfConsumption: React.FC = () => {
  // const { t } = useTranslation(['pcfConsumption', 'common']);
  const [discoveryId, setDiscoveryId] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [pcfData, setPcfData] = useState<PCFData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const params = useParams();
  const navigate = useNavigate();

  // Validate Discovery ID format: CX:<manufacturerPartId>:<partInstanceId>
  const isValidDiscoveryId = (id: string): boolean => {
    const pattern = /^CX:[^:]+:[^:]+$/;
    return pattern.test(id.trim());
  };

  const handleSearch = async () => {
    const trimmedId = discoveryId.trim();
    if (!trimmedId) {
      setValidationError('Please enter a Discovery ID');
      return;
    }
    
    if (!isValidDiscoveryId(trimmedId)) {
      setValidationError('Invalid format. Expected: CX:<manufacturerPartId>:<partInstanceId>');
      return;
    }
    
    setValidationError(null);
    navigate(`/pcf/consume/${encodeURIComponent(trimmedId)}`);
  };

  const handleBack = () => {
    setShowVisualization(false);
    setPcfData(null);
    setDiscoveryId('');
    setIsLoading(false);
    setCurrentStep(0);
    setLoadingError(null);
    navigate('/pcf/consume');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Mock data for demo purposes
  const fetchMockPCFData = async (id: string): Promise<PCFData> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const [_, manufacturerPartId, partInstanceId] = id.split(':');
    
    return {
      id: `pcf-${Date.now()}`,
      specVersion: '2.2.0',
      version: 1,
      created: new Date().toISOString(),
      status: 'Active',
      companyName: 'Example Manufacturer GmbH',
      companyIds: ['BPNL00000001CRHK'],
      productDescription: 'Electric Vehicle Battery Module',
      productIds: [`urn:example:${manufacturerPartId}:${partInstanceId}`],
      productCategoryCpc: '43911',
      productNameCompany: 'EV Battery Module Type A',
      pcfExcludingBiogenic: 125.5,
      pcfIncludingBiogenic: 118.2,
      fossilGhgEmissions: 98.3,
      fossilCarbonContent: 12.5,
      biogenicCarbonContent: 7.3,
      aircraftGhgEmissions: 5.2,
      packagingGhgEmissions: 3.8,
      referencePeriodStart: '2024-01-01T00:00:00Z',
      referencePeriodEnd: '2024-12-31T23:59:59Z',
      geographyCountry: 'DE',
      characterizationFactors: 'AR6',
      primaryDataShare: 68.5,
      dqi: {
        coveragePercent: 95,
        technologicalDQR: 1.5,
        temporalDQR: 1.2,
        geographicalDQR: 1.3,
        completenessDQR: 1.4,
        reliabilityDQR: 1.1
      },
      assurance: {
        coverage: 'PCF system',
        level: 'limited',
        boundary: 'Cradle-to-Gate',
        providerName: 'TÜV Rheinland',
        completedAt: '2024-06-15T00:00:00Z',
        standardName: 'ISO 14064-3'
      }
    };
  };

  // Load PCF when route contains id
  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) {
      setDiscoveryId(id);
      setPcfData(null);
      setShowVisualization(false);
      setIsLoading(true);
      setLoadingError(null);
      setCurrentStep(0);
      
      const loadPCF = async () => {
        try {
          // Simulate step-by-step loading
          for (let step = 0; step < LOADING_STEPS.length - 1; step++) {
            setCurrentStep(step);
            await new Promise(resolve => setTimeout(resolve, 800));
          }

          // Fetch PCF data (mock for now)
          const data = await fetchMockPCFData(id);
          
          setCurrentStep(LOADING_STEPS.length - 1);
          await new Promise(resolve => setTimeout(resolve, 400));
          
          setPcfData(data);
          setIsLoading(false);
          setShowVisualization(true);
        } catch (error) {
          setLoadingError(error instanceof Error ? error.message : 'Failed to load PCF data');
          setIsLoading(false);
        }
      };
      
      loadPCF();
    }
  }, [params?.id]);

  // Show visualization
  if (showVisualization && pcfData) {
    return (
      <PcfVisualization
        data={pcfData}
        discoveryId={discoveryId}
        onBack={handleBack}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Card
          sx={{
            maxWidth: '600px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Co2Icon sx={{ fontSize: 48, color: '#22c55e', mb: 2 }} />
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                Loading PCF Data
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }}>
                {discoveryId}
              </Typography>
            </Box>

            {/* Progress Steps */}
            <Box sx={{ mb: 3 }}>
              {LOADING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isPending = index > currentStep;

                return (
                  <Box
                    key={step.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      opacity: isPending ? 0.4 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted
                          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                          : isActive
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isActive ? '2px solid #22c55e' : 'none',
                        ...(isActive && {
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
                            '50%': { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0)' }
                          }
                        })
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle sx={{ fontSize: 22, color: '#fff' }} />
                      ) : isActive ? (
                        <Icon sx={{ fontSize: 22, color: '#22c55e' }} />
                      ) : (
                        <RadioButtonUnchecked sx={{ fontSize: 22, color: 'rgba(255, 255, 255, 0.3)' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography
                        variant="body1"
                        sx={{
                          color: isCompleted || isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                          fontWeight: isActive ? 600 : 400
                        }}
                      >
                        {step.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Cancel button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={handleBack}
                startIcon={<CloseIcon />}
                sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Show search page
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <EnergySavingsLeafIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
        <Typography variant="h3" color="white" fontWeight={700} gutterBottom>
          PCF Data Consumption
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Search and retrieve Product Carbon Footprint data from your dataspace partners
        </Typography>
      </Box>

      {/* Search Card */}
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" color="white" fontWeight={600} gutterBottom>
            Search by Discovery ID
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the Discovery ID to retrieve the PCF declaration from the provider.
          </Typography>

          {/* Validation error */}
          {validationError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setValidationError(null)}>
              {validationError}
            </Alert>
          )}

          {/* Loading error */}
          {loadingError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadingError(null)}>
              {loadingError}
            </Alert>
          )}

          {/* Discovery ID input */}
          <TextField
            fullWidth
            placeholder="CX:manufacturerPartId:partInstanceId"
            value={discoveryId}
            onChange={(e) => setDiscoveryId(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={{
              ...pcfCardStyles.textField,
              mb: 3,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '1rem'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              )
            }}
          />

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search />}
              sx={pcfCardStyles.button.primary}
            >
              Search PCF
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/pcf/consume/scan')}
              startIcon={<QrCodeScanner />}
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)'
                }
              }}
            >
              Scan
            </Button>
          </Box>

          {/* Example format hint */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Example Discovery ID format:
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', color: '#22c55e' }}
            >
              CX:PART-001:SERIAL-12345
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PcfConsumption;

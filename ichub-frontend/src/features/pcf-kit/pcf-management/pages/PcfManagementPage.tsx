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
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  alpha,
  CircularProgress,
  Tooltip,
  LinearProgress,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle,
  RadioButtonUnchecked,
  Downloading,
  Security,
  VerifiedUser,
  ArrowBack,
  Refresh,
  Search,
  Co2,
  Edit,
  Visibility,
  DraftsOutlined,
  CalendarMonth,
  Info,
  Public,
  Speed,
  Inventory,
  AddBox,
  PlaylistAdd,
  OpenInNew
} from '@mui/icons-material';
import { CatalogPartSearch, CatalogPartSearchResult } from '../../shared/components';
import {
  getPcfData,
  publishPcfData,
  ManagedPart,
  PcfDataRecord
} from '../../pcf-exchange/api/pcfExchangeApi';
import { PcfDetailsDialog, PcfEditDialog } from '../../pcf-exchange/components';

// PCF Green Theme
const PCF_PRIMARY = '#10b981';
const PCF_SECONDARY = '#059669';

// Custom styled step connector
const ColoredStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: `linear-gradient(90deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: `linear-gradient(90deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
  },
}));

// Part readiness status
type PartReadiness = 'draft' | 'registered-no-pcf' | 'has-pcf';

// Loading steps for animation
interface LoadingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const LOADING_STEPS: LoadingStep[] = [
  { id: 'search', label: 'Searching', icon: Search, description: 'Locating catalog part in registry' },
  { id: 'pcf', label: 'Loading PCF', icon: Downloading, description: 'Fetching PCF data' },
  { id: 'validate', label: 'Validating', icon: Security, description: 'Validating PCF structure' },
  { id: 'complete', label: 'Ready', icon: VerifiedUser, description: 'Data loaded successfully' }
];

type PageState = 'search' | 'loading' | 'visualization' | 'error';

const PcfManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  // Page state
  const [pageState, setPageState] = useState<PageState>('search');
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Part readiness state
  const [partReadiness, setPartReadiness] = useState<PartReadiness>('has-pcf');
  // Track selected part status from search - used in loadPartData
  const [, setSelectedPartStatus] = useState<'Draft' | 'Registered' | null>(null);

  // Data state
  const [managedPart, setManagedPart] = useState<ManagedPart | null>(null);
  const [pcfData, setPcfData] = useState<PcfDataRecord | null>(null);

  // Dialog state
  const [pcfDetailsDialogOpen, setPcfDetailsDialogOpen] = useState(false);
  const [pcfEditDialogOpen, setPcfEditDialogOpen] = useState(false);

  // PCF loading state
  const [isPcfLoading, setIsPcfLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Parse part ID from URL
  const partIdFromUrl = params?.partId;

  // Load part data when URL contains partId
  useEffect(() => {
    if (partIdFromUrl) {
      const decodedPartId = decodeURIComponent(partIdFromUrl);
      loadPartData(decodedPartId);
    }
  }, [partIdFromUrl]);

  const loadPartData = async (manufacturerPartId: string, partStatus?: 'Draft' | 'Registered') => {
    setPageState('loading');
    setError(null);
    setCurrentStep(0);
    setSelectedPartStatus(partStatus || null);

    try {
      // Step 1: Search for part
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Simulate different readiness levels based on part status or ID pattern
      // In reality, this would come from the API
      const isDraft = partStatus === 'Draft' || manufacturerPartId.includes('DRAFT') || manufacturerPartId === 'CELL-HP-01' || manufacturerPartId === 'BMS-CTRL-V2';
      const hasNoPcf = manufacturerPartId.includes('MOTOR') || manufacturerPartId.includes('INV');
      
      if (isDraft) {
        // Part is in Draft status - not registered
        setPartReadiness('draft');
        const part: ManagedPart = {
          catenaXId: '',
          manufacturerPartId,
          partInstanceId: 'CATALOG',
          partName: `Product ${manufacturerPartId}`,
          hasPcf: false,
          pcfStatus: 'DRAFT'
        };
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));
        setManagedPart(part);
        setPcfData(null);
        setPageState('visualization');
        return;
      }

      // Create managed part from catalog part
      const part: ManagedPart = {
        catenaXId: `urn:uuid:${crypto.randomUUID()}`,
        manufacturerPartId,
        partInstanceId: 'CATALOG',
        partName: `Product ${manufacturerPartId}`,
        hasPcf: !hasNoPcf,
        pcfVersion: hasNoPcf ? undefined : 1,
        pcfLastUpdated: hasNoPcf ? undefined : new Date().toISOString(),
        pcfValue: hasNoPcf ? undefined : Math.round(50 + Math.random() * 150),
        pcfValueUnit: hasNoPcf ? undefined : 'kg CO2e',
        pcfStatus: hasNoPcf ? undefined : 'PUBLISHED'
      };

      // Step 2: Load PCF data
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (hasNoPcf) {
        // Part is registered but has no PCF submodel
        setPartReadiness('registered-no-pcf');
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));
        setManagedPart(part);
        setPcfData(null);
        setPageState('visualization');
        return;
      }

      const pcf = await getPcfData(part.catenaXId);

      // Step 3: Validate
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 4: Complete
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      setPartReadiness('has-pcf');
      setManagedPart(part);
      setPcfData(pcf);
      setPageState('visualization');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load part data';
      setError(message);
      setPageState('error');
    }
  };

  // Handle selecting a part from search
  const handlePartSelect = (part: CatalogPartSearchResult) => {
    const partId = encodeURIComponent(part.manufacturerPartId);
    // Store the status to use in loadPartData
    setSelectedPartStatus(part.status ?? null);
    navigate(`/pcf/management/${partId}`);
    // Also pass status through state if navigating
    loadPartData(part.manufacturerPartId, part.status);
  };

  // Handle back to search
  const handleBackToSearch = () => {
    setPageState('search');
    setManagedPart(null);
    setPcfData(null);
    setError(null);
    navigate('/pcf/management');
  };

  // Handle refresh data
  const handleRefresh = async () => {
    if (!managedPart) return;
    
    setIsRefreshing(true);
    try {
      const pcf = await getPcfData(managedPart.catenaXId);
      setPcfData(pcf);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle upload/publish PCF
  const handleUploadPcf = async () => {
    if (!pcfData) return;

    setIsPcfLoading(true);
    try {
      const updatedPcf = await publishPcfData(pcfData.id);
      setPcfData(updatedPcf);
    } catch (err) {
      console.error('Failed to upload PCF:', err);
    } finally {
      setIsPcfLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render loading state
  const renderLoading = () => (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
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
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
              Loading Catalog Part
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }}>
              {partIdFromUrl && decodeURIComponent(partIdFromUrl)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            {LOADING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isPending = index > currentStep;

              return (
                <React.Fragment key={step.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, opacity: isPending ? 0.4 : 1 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted
                          ? `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`
                          : isActive
                          ? alpha(PCF_PRIMARY, 0.2)
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isActive ? `2px solid ${PCF_PRIMARY}` : 'none',
                        ...(isActive && {
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(PCF_PRIMARY, 0.4)}` },
                            '50%': { boxShadow: `0 0 0 8px ${alpha(PCF_PRIMARY, 0)}` }
                          }
                        })
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle sx={{ fontSize: 24, color: '#fff' }} />
                      ) : isActive ? (
                        <Icon sx={{ fontSize: 24, color: PCF_PRIMARY }} />
                      ) : (
                        <RadioButtonUnchecked sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.3)' }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: isActive || isCompleted ? '#fff' : 'rgba(255, 255, 255, 0.5)', fontWeight: isActive ? 600 : 500, mt: 1 }}>
                      {step.label}
                    </Typography>
                  </Box>
                  {index < LOADING_STEPS.length - 1 && (
                    <Box sx={{ height: 2, flex: 1, mx: 1, background: isCompleted ? `linear-gradient(90deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)` : 'rgba(255, 255, 255, 0.1)', position: 'relative', top: -18 }} />
                  )}
                </React.Fragment>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button variant="outlined" onClick={handleBackToSearch} sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'none', px: 4, borderRadius: '10px' }}>
              Cancel
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  // Render error state
  const renderError = () => (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
      <Card sx={{ maxWidth: '500px', width: '100%', background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>{error}</Typography>
          <Button variant="contained" onClick={handleBackToSearch} sx={{ background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`, textTransform: 'none', borderRadius: '10px' }}>
            Back to Search
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  // Render visualization state
  const renderVisualization = () => {
    if (!managedPart) return null;

    const hasPcf = managedPart.hasPcf && pcfData;
    const isDraft = pcfData?.status === 'DRAFT';
    const isPublished = pcfData?.status === 'PUBLISHED';

    return (
      <Box sx={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header - Passport Provisioning style */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {/* Back Button */}
            <Tooltip title="New Search">
              <IconButton
                onClick={handleBackToSearch}
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
            {/* Icon */}
            <Box
              sx={{
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px ${alpha(PCF_PRIMARY, 0.3)}`
              }}
            >
              <CloudUploadIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: '#fff' }} />
            </Box>
            {/* Title & Subtitle */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
                }}
              >
                PCF Management
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Manage and upload Product Carbon Footprint data for your catalog parts
              </Typography>
            </Box>
            {/* Right side: Part info and refresh */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box 
                onClick={() => navigate(`/catalog-management/parts/${encodeURIComponent(managedPart.manufacturerPartId)}`)}
                sx={{ 
                  cursor: 'pointer',
                  p: 1.5,
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease',
                  display: { xs: 'none', md: 'block' },
                  '&:hover': { 
                    background: alpha(PCF_PRIMARY, 0.08),
                    borderColor: alpha(PCF_PRIMARY, 0.2)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Manufacturer Part ID
                    </Typography>
                    <Typography variant="body2" sx={{ color: PCF_PRIMARY, fontWeight: 600, fontFamily: 'monospace' }}>
                      {managedPart.manufacturerPartId}
                    </Typography>
                  </Box>
                  <Box sx={{ borderLeft: '1px solid rgba(255,255,255,0.1)', pl: 3 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Part Name
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                      {managedPart.partName}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': { color: PCF_PRIMARY, borderColor: alpha(PCF_PRIMARY, 0.3), background: alpha(PCF_PRIMARY, 0.1) }
                  }}
                >
                  {isRefreshing ? <CircularProgress size={22} sx={{ color: PCF_PRIMARY }} /> : <Refresh />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, px: { xs: 2, sm: 3, md: 4 }, pb: 4 }}>
          <Card
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Section Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: '8px', background: alpha(PCF_PRIMARY, 0.15) }}>
                    <Co2 sx={{ color: PCF_PRIMARY }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                      PCF Data
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Product Carbon Footprint information for this part
                    </Typography>
                  </Box>
                </Box>

                {/* Status Badge */}
                {hasPcf && (
                  <Chip
                    icon={isPublished ? <CheckCircle sx={{ fontSize: 14 }} /> : <DraftsOutlined sx={{ fontSize: 14 }} />}
                    label={isPublished ? 'Published' : 'Draft'}
                    size="small"
                    sx={{
                      backgroundColor: isPublished ? alpha(PCF_PRIMARY, 0.15) : alpha('#eab308', 0.15),
                      color: isPublished ? PCF_PRIMARY : '#eab308',
                      border: `1px solid ${alpha(isPublished ? PCF_PRIMARY : '#eab308', 0.3)}`,
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: isPublished ? PCF_PRIMARY : '#eab308' }
                    }}
                  />
                )}
              </Box>

              {/* Loading State */}
              {isPcfLoading && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress
                    sx={{
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': { backgroundColor: PCF_PRIMARY }
                    }}
                  />
                </Box>
              )}

              {/* Wizard for Draft or No PCF */}
              {!hasPcf && !isPcfLoading && (
                <Box sx={{ py: 3 }}>
                  {/* 3-Step Wizard */}
                  <Stepper
                    alternativeLabel
                    activeStep={partReadiness === 'draft' ? 0 : partReadiness === 'registered-no-pcf' ? 1 : 2}
                    connector={<ColoredStepConnector />}
                    sx={{ mb: 4 }}
                  >
                    {/* Step 1: Register Catalog Part */}
                    <Step completed={partReadiness !== 'draft'}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: completed
                                ? `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`
                                : active
                                ? alpha(PCF_PRIMARY, 0.2)
                                : 'rgba(255, 255, 255, 0.05)',
                              border: active ? `2px solid ${PCF_PRIMARY}` : 'none',
                              boxShadow: completed ? `0 4px 12px ${alpha(PCF_PRIMARY, 0.3)}` : 'none'
                            }}
                          >
                            {completed ? (
                              <CheckCircle sx={{ fontSize: 22, color: '#fff' }} />
                            ) : (
                              <Inventory sx={{ fontSize: 20, color: active ? PCF_PRIMARY : 'rgba(255, 255, 255, 0.3)' }} />
                            )}
                          </Box>
                        )}
                      >
                        <Typography sx={{ color: partReadiness !== 'draft' ? PCF_PRIMARY : '#fff', fontWeight: 600 }}>
                          Register Catalog Part
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Part must be registered in catalog
                        </Typography>
                      </StepLabel>
                    </Step>

                    {/* Step 2: Create PCF Submodel */}
                    <Step completed={partReadiness === 'has-pcf'}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: completed
                                ? `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`
                                : active
                                ? alpha(PCF_PRIMARY, 0.2)
                                : 'rgba(255, 255, 255, 0.05)',
                              border: active ? `2px solid ${PCF_PRIMARY}` : 'none',
                              boxShadow: completed ? `0 4px 12px ${alpha(PCF_PRIMARY, 0.3)}` : 'none'
                            }}
                          >
                            {completed ? (
                              <CheckCircle sx={{ fontSize: 22, color: '#fff' }} />
                            ) : (
                              <AddBox sx={{ fontSize: 20, color: active ? PCF_PRIMARY : 'rgba(255, 255, 255, 0.3)' }} />
                            )}
                          </Box>
                        )}
                      >
                        <Typography sx={{ color: partReadiness === 'has-pcf' ? PCF_PRIMARY : partReadiness === 'registered-no-pcf' ? '#fff' : 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                          Create PCF Submodel
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Add PCF data to the part
                        </Typography>
                      </StepLabel>
                    </Step>

                    {/* Step 3: PCF Data */}
                    <Step completed={partReadiness === 'has-pcf'}>
                      <StepLabel
                        StepIconComponent={({ active, completed }) => (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: completed
                                ? `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`
                                : active
                                ? alpha(PCF_PRIMARY, 0.2)
                                : 'rgba(255, 255, 255, 0.05)',
                              border: active ? `2px solid ${PCF_PRIMARY}` : 'none',
                              boxShadow: completed ? `0 4px 12px ${alpha(PCF_PRIMARY, 0.3)}` : 'none'
                            }}
                          >
                            {completed ? (
                              <CheckCircle sx={{ fontSize: 22, color: '#fff' }} />
                            ) : (
                              <PlaylistAdd sx={{ fontSize: 20, color: active ? PCF_PRIMARY : 'rgba(255, 255, 255, 0.3)' }} />
                            )}
                          </Box>
                        )}
                      >
                        <Typography sx={{ color: partReadiness === 'has-pcf' ? PCF_PRIMARY : 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                          PCF Data
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          View and manage PCF
                        </Typography>
                      </StepLabel>
                    </Step>
                  </Stepper>

                  {/* Action Card based on current step */}
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '12px',
                      background: alpha(PCF_PRIMARY, 0.05),
                      border: `1px solid ${alpha(PCF_PRIMARY, 0.15)}`,
                      textAlign: 'center'
                    }}
                  >
                    {partReadiness === 'draft' && (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<DraftsOutlined sx={{ fontSize: 14 }} />}
                            label="Draft Part"
                            size="small"
                            sx={{
                              backgroundColor: alpha('#eab308', 0.15),
                              color: '#eab308',
                              border: `1px solid ${alpha('#eab308', 0.3)}`,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                          Register Your Catalog Part
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3, maxWidth: 400, mx: 'auto' }}>
                          This part is currently in draft status. Register it in the catalog to enable PCF data management.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Inventory />}
                          endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/catalog-management/parts/${encodeURIComponent(managedPart.manufacturerPartId)}`)}
                          sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
                            '&:hover': { background: `linear-gradient(135deg, ${PCF_SECONDARY} 0%, ${PCF_PRIMARY} 100%)` }
                          }}
                        >
                          Go to Catalog Management
                        </Button>
                      </>
                    )}

                    {partReadiness === 'registered-no-pcf' && (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: 14 }} />}
                            label="Registered Part"
                            size="small"
                            sx={{
                              backgroundColor: alpha(PCF_PRIMARY, 0.15),
                              color: PCF_PRIMARY,
                              border: `1px solid ${alpha(PCF_PRIMARY, 0.3)}`,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                          Create PCF Submodel
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3, maxWidth: 400, mx: 'auto' }}>
                          Your catalog part is registered. Add a PCF submodel to enable carbon footprint tracking and sharing.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddBox />}
                          endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/submodel-creator?partId=${encodeURIComponent(managedPart.manufacturerPartId)}&type=pcf`)}
                          sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
                            '&:hover': { background: `linear-gradient(135deg, ${PCF_SECONDARY} 0%, ${PCF_PRIMARY} 100%)` }
                          }}
                        >
                          Create PCF Submodel
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              )}

              {/* Has PCF Data */}
              {hasPcf && !isPcfLoading && pcfData && (
                <>
                  {/* PCF Values Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 2,
                      p: 2,
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    {/* PCF Value (excl. biogenic) */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Co2 sx={{ fontSize: 14, color: PCF_PRIMARY }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          PCF (excl. biogenic)
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                        {pcfData.pcfExcludingBiogenic.toFixed(1)}
                        <Typography component="span" variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 0.5 }}>
                          kg CO2e
                        </Typography>
                      </Typography>
                    </Box>

                    {/* PCF Value (incl. biogenic) */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Co2 sx={{ fontSize: 14, color: '#3b82f6' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          PCF (incl. biogenic)
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                        {pcfData.pcfIncludingBiogenic.toFixed(1)}
                        <Typography component="span" variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 0.5 }}>
                          kg CO2e
                        </Typography>
                      </Typography>
                    </Box>

                    {/* Primary Data Share */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Speed sx={{ fontSize: 14, color: '#a855f7' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Primary Data
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                          {pcfData.primaryDataShare.toFixed(0)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={pcfData.primaryDataShare}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor:
                                pcfData.primaryDataShare >= 70
                                  ? PCF_PRIMARY
                                  : pcfData.primaryDataShare >= 50
                                  ? '#eab308'
                                  : '#ef4444'
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Geography */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <Public sx={{ fontSize: 14, color: '#f97316' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Geography
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                        {pcfData.geographyCountry}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Metadata */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarMonth sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Reference: {formatDate(pcfData.referencePeriodStart)} - {formatDate(pcfData.referencePeriodEnd)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Info sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Spec Version: {pcfData.specVersion}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={`Created: ${formatDate(pcfData.created)}, Updated: ${formatDate(pcfData.updated)}`}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', cursor: 'help' }}>
                          Version {pcfData.version}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Draft Alert */}
                  {isDraft && (
                    <Alert
                      severity="warning"
                      icon={<DraftsOutlined />}
                      sx={{
                        mt: 2,
                        borderRadius: '10px',
                        backgroundColor: alpha('#eab308', 0.1),
                        border: `1px solid ${alpha('#eab308', 0.2)}`,
                        '& .MuiAlert-icon': { color: '#eab308' },
                        '& .MuiAlert-message': { color: '#eab308' }
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#eab308' }}>
                        This PCF is in draft status. Upload it to make it available for sharing with customers.
                      </Typography>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => setPcfDetailsDialogOpen(true)}
                      sx={{
                        flex: 1,
                        py: 1.25,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          borderColor: PCF_PRIMARY,
                          backgroundColor: alpha(PCF_PRIMARY, 0.1),
                          color: '#fff',
                          '& .MuiSvgIcon-root': { color: PCF_PRIMARY }
                        }
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setPcfEditDialogOpen(true)}
                      sx={{
                        flex: 1,
                        py: 1.25,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          borderColor: '#3b82f6',
                          backgroundColor: alpha('#3b82f6', 0.1),
                          color: '#fff',
                          '& .MuiSvgIcon-root': { color: '#3b82f6' }
                        }
                      }}
                    >
                      Update
                    </Button>
                    {isDraft && (
                      <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleUploadPcf}
                        sx={{
                          flex: 1,
                          py: 1.25,
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
                          '&:hover': { background: `linear-gradient(135deg, ${PCF_SECONDARY} 0%, ${PCF_PRIMARY} 100%)` }
                        }}
                      >
                        Upload
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Dialogs */}
        <PcfDetailsDialog
          open={pcfDetailsDialogOpen}
          onClose={() => setPcfDetailsDialogOpen(false)}
          pcfData={pcfData}
          part={managedPart}
        />

        <PcfEditDialog
          open={pcfEditDialogOpen}
          onClose={() => setPcfEditDialogOpen(false)}
          onSave={async (data) => {
            console.log('Saving PCF data:', data);
          }}
          pcfData={pcfData}
          part={managedPart}
        />
      </Box>
    );
  };

  // Render search state
  const renderSearch = () => (
    <CatalogPartSearch
      icon={<CloudUploadIcon sx={{ fontSize: 36, color: '#fff' }} />}
      title="PCF Management"
      subtitle="Manage and upload Product Carbon Footprint data for your catalog parts"
      onPartSelect={handlePartSelect}
      searchPlaceholder="Enter Manufacturer Part ID..."
      searchButtonText="Manage PCF"
    />
  );

  return (
    <Box>
      {pageState === 'search' && renderSearch()}
      {pageState === 'loading' && renderLoading()}
      {pageState === 'error' && renderError()}
      {pageState === 'visualization' && renderVisualization()}
    </Box>
  );
};

export default PcfManagementPage;

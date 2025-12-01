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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Grid2,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  ArrowBack,
  ArrowForward,
  Save,
  Link as LinkIcon,
  Add,
} from '@mui/icons-material';
import { DPP_VERSION_REGISTRY } from '../config/dppVersionRegistry';
import { createDPP } from '../api/provisionApi';
import { TwinAssociation } from '../types';
import SubmodelCreator from '@/components/submodel-creation/SubmodelCreator';
import { darkCardStyles } from '../styles/cardStyles';
import { fetchAllSerializedParts } from '@/features/industry-core-kit/serialized-parts/api';
import { SerializedPart } from '@/features/industry-core-kit/serialized-parts/types';
import AddSerializedPartDialog from '@/features/industry-core-kit/serialized-parts/components/AddSerializedPartDialog';

const steps = ['Select Version', 'Twin Association', 'DPP Data', 'Review & Create'];

const PassportProvisionWizard: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Version Selection
  const [selectedVersion, setSelectedVersion] = useState(DPP_VERSION_REGISTRY[0]);

  // Step 2: Twin Association
  const [serializedParts, setSerializedParts] = useState<SerializedPart[]>([]);
  const [selectedPart, setSelectedPart] = useState<SerializedPart | null>(null);
  const [partsLoading, setPartsLoading] = useState(false);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);

  // Step 3: DPP Data (via SubmodelCreator)
  const [showSubmodelCreator, setShowSubmodelCreator] = useState(false);
  const [dppData, setDppData] = useState<any>(null);

  // Step 4: Review
  const [status] = useState<'draft' | 'active'>('draft');

  const handleNext = async () => {
    setError(null);

    if (activeStep === 0) {
      // Version selected, move to twin association and load parts
      await loadSerializedParts();
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Twin association step
      if (!selectedPart) {
        setError('Please select a serialized part to associate with this DPP');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      // DPP Data step - open SubmodelCreator
      if (!dppData) {
        setShowSubmodelCreator(true);
        return;
      }
      setActiveStep(3);
    } else if (activeStep === 3) {
      // Final step - create DPP
      await handleCreate();
    }
  };

  const handleBack = () => {
    setError(null);
    if (activeStep === 2 && showSubmodelCreator) {
      setShowSubmodelCreator(false);
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const loadSerializedParts = async () => {
    setPartsLoading(true);
    try {
      const parts = await fetchAllSerializedParts();
      setSerializedParts(parts);
    } catch (err) {
      setError('Failed to load serialized parts');
    } finally {
      setPartsLoading(false);
    }
  };

  const handlePartCreated = async () => {
    setShowAddPartDialog(false);
    await loadSerializedParts();
  };

  const handleSubmodelCreated = async (submodelData: any) => {
    setDppData(submodelData);
    setShowSubmodelCreator(false);
    setActiveStep(3);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      let twinAssociation: TwinAssociation | undefined;

      if (selectedPart) {
        twinAssociation = {
          twinId: `twin-${selectedPart.id}`,
          manufacturerPartId: selectedPart.manufacturerPartId,
          serialNumber: selectedPart.partInstanceId,
          twinName: selectedPart.name,
        };
      }

      await createDPP(
        selectedVersion.version,
        selectedVersion.semanticId,
        dppData,
        status,
        twinAssociation
      );

      navigate('/passport/provision');
    } catch (err) {
      setError('Failed to create Digital Product Passport');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Select DPP Version
            </Typography>
            <Grid2 container spacing={2}>
              {DPP_VERSION_REGISTRY.map((version) => (
                <Grid2 size={{ xs: 12, md: 6 }} key={version.semanticId}>
                  <Card
                    sx={{
                      ...darkCardStyles.card,
                      cursor: 'pointer',
                      borderColor:
                        selectedVersion.semanticId === version.semanticId
                          ? version.color
                          : 'rgba(255, 255, 255, 0.12)',
                      borderWidth: selectedVersion.semanticId === version.semanticId ? 2 : 1,
                      '&:hover': {
                        borderColor: version.color,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: `${version.color}20`,
                            color: version.color,
                          }}
                        >
                          {version.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ color: '#fff' }}>
                            {version.name}
                          </Typography>
                          <Chip
                            label={`v${version.version}`}
                            size="small"
                            sx={{
                              bgcolor: `${version.color}20`,
                              color: version.color,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        {selectedVersion.semanticId === version.semanticId && (
                          <CheckCircle sx={{ color: version.color }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                        {version.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {version.features.slice(0, 3).map((feature, idx) => (
                          <Chip
                            key={idx}
                            label={feature}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.6)',
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid2>
              ))}
            </Grid2>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Associate with Serialized Part
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Alert
                severity="info"
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                }}
              >
                Select an existing serialized part to link with this Digital Product Passport
              </Alert>
            </Box>

            {partsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : serializedParts.length === 0 ? (
              <Card sx={darkCardStyles.card}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Warning sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                    No Serialized Parts Available
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                    You need to create a serialized part before you can provision a DPP
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowAddPartDialog(true)}
                    sx={darkCardStyles.button.primary}
                  >
                    Create Serialized Part
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card sx={darkCardStyles.card}>
                <CardContent>
                  <Autocomplete
                    fullWidth
                    options={serializedParts}
                    getOptionLabel={(option) =>
                      `${option.manufacturerPartId} - ${option.partInstanceId} (${option.name})`
                    }
                    value={selectedPart}
                    onChange={(_, value) => {
                      setSelectedPart(value);
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: '#1e1e1e',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          '& .MuiAutocomplete-listbox': {
                            bgcolor: '#1e1e1e',
                            '& .MuiAutocomplete-option': {
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                              },
                              '&[aria-selected="true"]': {
                                bgcolor: 'rgba(255, 255, 255, 0.12)',
                              },
                            },
                          },
                        },
                      },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Serialized Part"
                        placeholder="Choose a serialized part..."
                        sx={{
                          ...darkCardStyles.textField,
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#fff',
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props as any;
                      return (
                        <Box component="li" {...otherProps} key={option.id}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                              {option.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              Manufacturer Part ID: {option.manufacturerPartId} • Part Instance ID: {option.partInstanceId}
                            </Typography>
                            {option.van && (
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                                VAN: {option.van}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                  />

                  {selectedPart && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                        Selected Part:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<LinkIcon />}
                          label={`${selectedPart.name}`}
                          size="small"
                          sx={darkCardStyles.chip.active}
                        />
                        <Chip
                          label={`Part ID: ${selectedPart.manufacturerPartId}`}
                          size="small"
                          sx={darkCardStyles.chip.default}
                        />
                        <Chip
                          label={`Serial: ${selectedPart.partInstanceId}`}
                          size="small"
                          sx={darkCardStyles.chip.default}
                        />
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setShowAddPartDialog(true)}
                    sx={darkCardStyles.button.outlined}
                  >
                    Create New Serialized Part
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              DPP Data Entry
            </Typography>

            {!dppData ? (
              <Card sx={darkCardStyles.card}>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Warning sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                    DPP Data Required
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                    Click "Next" to open the form builder and enter DPP data
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card sx={darkCardStyles.card}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CheckCircle sx={{ color: '#10b981' }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      DPP Data Collected
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    All required data has been entered. Review in the next step.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setShowSubmodelCreator(true)}
                    sx={darkCardStyles.button.outlined}
                  >
                    Edit DPP Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Review & Create
            </Typography>

            <Card sx={darkCardStyles.card}>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    DPP Version
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: `${selectedVersion.color}20`,
                        color: selectedVersion.color,
                      }}
                    >
                      {selectedVersion.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ color: '#fff' }}>{selectedVersion.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        v{selectedVersion.version}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Serialized Part Association
                  </Typography>
                  {selectedPart ? (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={selectedPart.name}
                          size="small"
                          sx={darkCardStyles.chip.active}
                        />
                        <Chip
                          label={`Part ID: ${selectedPart.manufacturerPartId}`}
                          size="small"
                          sx={darkCardStyles.chip.default}
                        />
                        <Chip
                          label={`Serial: ${selectedPart.partInstanceId}`}
                          size="small"
                          sx={darkCardStyles.chip.default}
                        />
                      </Box>
                      {selectedPart.van && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          VAN: {selectedPart.van}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Chip label="No part selected" size="small" sx={darkCardStyles.chip.draft} />
                  )}
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Status
                  </Typography>
                  <Chip
                    label={status.toUpperCase()}
                    size="small"
                    sx={status === 'draft' ? darkCardStyles.chip.draft : darkCardStyles.chip.active}
                  />
                </Box>
              </CardContent>
            </Card>

            <Alert
              severity="success"
              sx={{
                mt: 3,
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#10b981',
              }}
            >
              Ready to create your Digital Product Passport
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 3,
      }}
    >
      <Container maxWidth="lg" sx={{ pb: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/passport/provision')}
            sx={{
              color: '#fff',
              mb: 1.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Back to List
          </Button>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
            Create Digital Product Passport
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            Follow the steps to create and provision a new DPP
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 2,
            p: 2.5,
            mb: 2.5,
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: 'rgba(255,255,255,0.5)',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      '&.Mui-active': { 
                        color: '#fff',
                        fontWeight: 600,
                      },
                      '&.Mui-completed': { 
                        color: '#a78bfa',
                        fontWeight: 500,
                      },
                    },
                    '& .MuiStepIcon-root': {
                      color: 'rgba(255,255,255,0.2)',
                      fontSize: '1.75rem',
                      '&.Mui-active': {
                        color: '#8b5cf6',
                        filter: 'drop-shadow(0 4px 20px rgba(139, 92, 246, 0.6))',
                        '& .MuiStepIcon-text': {
                          fill: '#fff',
                          fontWeight: 600,
                        },
                      },
                      '&.Mui-completed': {
                        color: '#10b981',
                        filter: 'drop-shadow(0 2px 10px rgba(16, 185, 129, 0.4))',
                        '& .MuiStepIcon-text': {
                          fill: '#fff',
                        },
                      },
                    },
                    '& .MuiStepConnector-line': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Content */}
        <Paper
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 2,
            p: 3,
            mb: 2.5,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={darkCardStyles.button.outlined}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={activeStep === 3 ? <Save /> : <ArrowForward />}
            sx={darkCardStyles.button.primary}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === 3 ? (
              'Create DPP'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Container>

      {/* SubmodelCreator Dialog */}
      {showSubmodelCreator && selectedVersion.schema && (
        <SubmodelCreator
          open={showSubmodelCreator}
          onClose={() => setShowSubmodelCreator(false)}
          onBack={() => setShowSubmodelCreator(false)}
          onCreateSubmodel={handleSubmodelCreated}
          selectedSchema={selectedVersion.schema}
          schemaKey={selectedVersion.semanticId}
          manufacturerPartId={selectedPart?.manufacturerPartId}
          twinId={selectedPart?.id?.toString()}
        />
      )}

      {/* Add Serialized Part Dialog */}
      <AddSerializedPartDialog
        open={showAddPartDialog}
        onClose={() => setShowAddPartDialog(false)}
        onSuccess={handlePartCreated}
      />
    </Box>
  );
};

export default PassportProvisionWizard;

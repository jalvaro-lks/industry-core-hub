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

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  alpha,
  IconButton,
  Collapse,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled
} from '@mui/material';
import {
  Close as CloseIcon,
  SettingsInputComponent as ConnectorIcon,
  CloudSync as DataPlaneIcon,
  AccountTree as DtrIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  KeyboardArrowRight as ArrowRightIcon,
  KeyboardArrowLeft as ArrowLeftIcon,
  Check as CheckIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import {
  SystemType,
  SystemFormData,
  ConnectorVersion,
  SYSTEM_TYPE_METADATA,
  CONNECTOR_VERSIONS,
  SystemConfig
} from '../../types';

interface AddSystemDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (formData: SystemFormData) => Promise<void>;
  editSystem?: SystemConfig | null;
}

/**
 * Custom styled connector for the stepper
 */
const CustomStepConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
  },
}));

/**
 * Custom step icon component
 */
interface StepIconProps {
  active?: boolean;
  completed?: boolean;
  stepIndex: number;
}

const CustomStepIcon: React.FC<StepIconProps> = ({ active, completed, stepIndex }) => {
  const icons: { [key: number]: React.ReactNode } = {
    0: <CategoryIcon />,
    1: <DescriptionIcon />,
    2: <TuneIcon />,
  };

  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: completed 
          ? '#4ade80' 
          : active 
            ? 'rgba(74, 222, 128, 0.15)' 
            : 'rgba(255,255,255,0.05)',
        border: '2px solid',
        borderColor: completed 
          ? '#4ade80' 
          : active 
            ? 'rgba(74, 222, 128, 0.5)' 
            : 'rgba(255,255,255,0.1)',
        color: completed 
          ? '#000' 
          : active 
            ? '#4ade80' 
            : 'rgba(255,255,255,0.4)',
        transition: 'all 0.3s ease',
        boxShadow: active ? '0 0 20px rgba(74, 222, 128, 0.3)' : 'none',
        '& svg': {
          fontSize: 20,
        },
      }}
    >
      {completed ? <CheckIcon /> : icons[stepIndex]}
    </Box>
  );
};

/**
 * Get icon component for system type
 */
const getSystemIcon = (type: SystemType): React.ReactElement => {
  switch (type) {
    case 'connector-control-plane':
      return <ConnectorIcon />;
    case 'connector-data-plane':
      return <DataPlaneIcon />;
    case 'dtr':
      return <DtrIcon />;
    case 'submodel-server':
      return <StorageIcon />;
    case 'keycloak':
      return <SecurityIcon />;
    case 'backend-service':
      return <ApiIcon />;
    default:
      return <ApiIcon />;
  }
};

const SYSTEM_TYPES: SystemType[] = [
  'connector-control-plane',
  'connector-data-plane',
  'dtr',
  'submodel-server',
  'keycloak',
  'backend-service'
];

// Styled input component
const StyledInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  icon?: React.ReactNode;
  helperText?: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, error, type = 'text', multiline, rows, icon, helperText, required }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography 
      variant="caption" 
      sx={{ 
        color: error ? '#f87171' : 'rgba(255,255,255,0.7)', 
        fontWeight: 500, 
        mb: 0.75, 
        display: 'block',
        fontSize: '0.8rem',
        letterSpacing: '0.02em'
      }}
    >
      {label} {required && <Box component="span" sx={{ color: '#f87171' }}>*</Box>}
    </Typography>
    <TextField
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      multiline={multiline}
      rows={rows}
      error={!!error}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            <Box sx={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</Box>
          </InputAdornment>
        ) : undefined
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 1.5,
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
          '& fieldset': { 
            borderColor: error ? 'rgba(248, 113, 113, 0.5)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease'
          },
          '&:hover fieldset': { 
            borderColor: error ? 'rgba(248, 113, 113, 0.7)' : 'rgba(255,255,255,0.25)' 
          },
          '&.Mui-focused fieldset': { 
            borderColor: error ? '#f87171' : '#4ade80',
            borderWidth: 1
          }
        },
        '& .MuiOutlinedInput-input': { 
          color: '#fff',
          py: 1.5,
          '&::placeholder': { color: 'rgba(255,255,255,0.35)' }
        }
      }}
    />
    {(error || helperText) && (
      <Typography 
        variant="caption" 
        sx={{ 
          color: error ? '#f87171' : 'rgba(255,255,255,0.5)', 
          mt: 0.75, 
          display: 'block',
          fontSize: '0.75rem'
        }}
      >
        {error || helperText}
      </Typography>
    )}
  </Box>
);

const steps = ['Select Type', 'Basic Details', 'Configuration'];

/**
 * Dialog for adding or editing a system configuration
 */
const AddSystemDialog: React.FC<AddSystemDialogProps> = ({
  open,
  onClose,
  onAdd,
  editSystem
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<SystemFormData>({
    name: '',
    type: 'connector-control-plane',
    endpoint: '',
    version: 'saturn',
    description: ''
  });

  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof SystemFormData, string>>>({});

  // Reset form when dialog opens/closes or when editing a different system
  useEffect(() => {
    if (open) {
      if (editSystem) {
        // Editing existing system
        setFormData({
          name: editSystem.name,
          type: editSystem.type,
          endpoint: editSystem.endpoint,
          description: editSystem.description || '',
          version: (editSystem as SystemFormData).version || 'saturn',
          managementApiEndpoint: (editSystem as SystemFormData).managementApiEndpoint,
          protocolEndpoint: (editSystem as SystemFormData).protocolEndpoint,
          publicApiEndpoint: (editSystem as SystemFormData).publicApiEndpoint,
          apiKey: (editSystem as SystemFormData).apiKey,
          apiVersion: (editSystem as SystemFormData).apiVersion,
          registryPath: (editSystem as SystemFormData).registryPath,
          lookupEndpoint: (editSystem as SystemFormData).lookupEndpoint,
          storageType: (editSystem as SystemFormData).storageType,
          submodelPath: (editSystem as SystemFormData).submodelPath,
          realm: (editSystem as SystemFormData).realm,
          clientId: (editSystem as SystemFormData).clientId
        });
        setActiveStep(1); // Skip type selection when editing
      } else {
        // Adding new system
        setFormData({
          name: '',
          type: 'connector-control-plane',
          endpoint: '',
          version: 'saturn',
          description: ''
        });
        setActiveStep(0);
      }
      setErrors({});
      setError(null);
      setShowAdvanced(false);
    }
  }, [open, editSystem]);

  const handleTypeSelect = (type: SystemType) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof SystemFormData, string>> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.endpoint.trim()) {
        newErrors.endpoint = 'Endpoint URL is required';
      } else if (!formData.endpoint.startsWith('http://') && !formData.endpoint.startsWith('https://')) {
        newErrors.endpoint = 'Must be a valid URL (http:// or https://)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save system configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConnectorType = formData.type === 'connector-control-plane' || formData.type === 'connector-data-plane';
  const metadata = SYSTEM_TYPE_METADATA[formData.type];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography 
              variant="body2" 
              sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, textAlign: 'center', fontSize: '0.9rem' }}
            >
              Choose the type of external system you want to connect
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              {SYSTEM_TYPES.map((type) => {
                const meta = SYSTEM_TYPE_METADATA[type];
                const isSelected = formData.type === type;
                
                return (
                  <Box
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: isSelected ? meta.color : 'rgba(255,255,255,0.08)',
                      backgroundColor: isSelected ? alpha(meta.color, 0.08) : 'rgba(0,0,0,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        backgroundColor: alpha(meta.color, 0.06),
                        borderColor: alpha(meta.color, 0.4),
                        transform: 'translateY(-3px)',
                        boxShadow: `0 8px 25px ${alpha(meta.color, 0.15)}`
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: alpha(meta.color, 0.15),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: meta.color,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {React.cloneElement(getSystemIcon(type), { sx: { fontSize: 24 } })}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600, 
                            color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)',
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                            mb: 0.5
                          }}
                        >
                          {meta.label}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '0.75rem',
                            display: 'block',
                            lineHeight: 1.4
                          }}
                        >
                          {meta.description.length > 50 ? meta.description.substring(0, 50) + '...' : meta.description}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: meta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 16, color: '#000' }} />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Selected type indicator */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 4,
                p: 2,
                backgroundColor: alpha(metadata.color, 0.06),
                borderRadius: 2,
                border: `1px solid ${alpha(metadata.color, 0.2)}`
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  backgroundColor: alpha(metadata.color, 0.15),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: metadata.color
                }}
              >
                {React.cloneElement(getSystemIcon(formData.type), { sx: { fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="body1" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                  {metadata.label}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  {metadata.description}
                </Typography>
              </Box>
            </Box>

            <StyledInput
              label="System Name"
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., Production Connector"
              error={errors.name}
              helperText="A friendly name to identify this system"
              required
            />

            <StyledInput
              label="Endpoint URL"
              value={formData.endpoint}
              onChange={(value) => setFormData(prev => ({ ...prev, endpoint: value }))}
              placeholder="https://your-system.example.com/api"
              error={errors.endpoint}
              icon={<LinkIcon sx={{ fontSize: 18 }} />}
              required
            />

            {isConnectorType && (
              <Box sx={{ mb: 2.5 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: 500, 
                    mb: 1, 
                    display: 'block',
                    fontSize: '0.8rem'
                  }}
                >
                  Connector Version
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {Object.entries(CONNECTOR_VERSIONS).map(([key, value]) => (
                    <Box
                      key={key}
                      onClick={() => setFormData(prev => ({ ...prev, version: key as ConnectorVersion }))}
                      sx={{
                        flex: 1,
                        p: 2,
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: formData.version === key ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                        backgroundColor: formData.version === key ? 'rgba(96, 165, 250, 0.08)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'rgba(96, 165, 250, 0.5)',
                          backgroundColor: 'rgba(96, 165, 250, 0.05)'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                        {value.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                        {value.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <StyledInput
              label="Description"
              value={formData.description || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Brief description of this system's purpose"
              multiline
              rows={3}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            {/* Summary card */}
            <Box 
              sx={{ 
                p: 3,
                mb: 3,
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    backgroundColor: alpha(metadata.color, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: metadata.color
                  }}
                >
                  {React.cloneElement(getSystemIcon(formData.type), { sx: { fontSize: 26 } })}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                    {formData.name || 'Unnamed System'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: metadata.color, fontWeight: 500 }}>
                    {metadata.label}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ 
                  p: 1.5,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 1.5,
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.7)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {formData.endpoint}
              </Box>
            </Box>

            {/* Advanced Configuration */}
            <Box
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                p: 2,
                borderRadius: 1.5,
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                mb: showAdvanced ? 2 : 0,
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SettingsIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                    Advanced Configuration
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                    Optional settings for this system
                  </Typography>
                </Box>
              </Box>
              {showAdvanced ? 
                <ExpandLessIcon sx={{ color: 'rgba(255,255,255,0.5)' }} /> : 
                <ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              }
            </Box>

            <Collapse in={showAdvanced}>
              <Box sx={{ pt: 2, pb: 1 }}>
                {/* Connector-specific fields */}
                {formData.type === 'connector-control-plane' && (
                  <>
                    <StyledInput
                      label="Management API Endpoint"
                      value={formData.managementApiEndpoint || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, managementApiEndpoint: value }))}
                      placeholder="https://connector.example.com/management"
                    />
                    <StyledInput
                      label="API Key"
                      value={formData.apiKey || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, apiKey: value }))}
                      placeholder="Your API key"
                      type="password"
                    />
                  </>
                )}

                {formData.type === 'connector-data-plane' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <StyledInput
                      label="Protocol Endpoint"
                      value={formData.protocolEndpoint || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, protocolEndpoint: value }))}
                      placeholder="/protocol"
                    />
                    <StyledInput
                      label="Public API Endpoint"
                      value={formData.publicApiEndpoint || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, publicApiEndpoint: value }))}
                      placeholder="/public"
                    />
                  </Box>
                )}

                {/* DTR-specific fields */}
                {formData.type === 'dtr' && (
                  <>
                    <StyledInput
                      label="API Version"
                      value={formData.apiVersion || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, apiVersion: value }))}
                      placeholder="v3"
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <StyledInput
                        label="Registry Path"
                        value={formData.registryPath || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, registryPath: value }))}
                        placeholder="/shell-descriptors"
                      />
                      <StyledInput
                        label="Lookup Endpoint"
                        value={formData.lookupEndpoint || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, lookupEndpoint: value }))}
                        placeholder="/lookup/shells"
                      />
                    </Box>
                  </>
                )}

                {/* Submodel Server-specific fields */}
                {formData.type === 'submodel-server' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <StyledInput
                      label="Storage Type"
                      value={formData.storageType || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, storageType: value }))}
                      placeholder="PostgreSQL"
                    />
                    <StyledInput
                      label="Submodel Path"
                      value={formData.submodelPath || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, submodelPath: value }))}
                      placeholder="/submodels"
                    />
                  </Box>
                )}

                {/* Keycloak-specific fields */}
                {formData.type === 'keycloak' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <StyledInput
                      label="Realm"
                      value={formData.realm || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, realm: value }))}
                      placeholder="catena-x"
                    />
                    <StyledInput
                      label="Client ID"
                      value={formData.clientId || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                      placeholder="industry-core-hub"
                    />
                  </Box>
                )}

                {/* Backend Service-specific fields */}
                {formData.type === 'backend-service' && (
                  <StyledInput
                    label="API Version"
                    value={formData.apiVersion || ''}
                    onChange={(value) => setFormData(prev => ({ ...prev, apiVersion: value }))}
                    placeholder="v1"
                  />
                )}
              </Box>
            </Collapse>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0d0d10',
          backgroundImage: 'linear-gradient(180deg, rgba(74, 222, 128, 0.02) 0%, transparent 50%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          minHeight: 600,
          maxHeight: '85vh'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 4,
        py: 3,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', fontSize: '1.35rem', mb: 0.5 }}>
            {editSystem ? 'Edit System' : 'Add New System'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {editSystem ? 'Update your system configuration' : 'Connect a new external system to Industry Core Hub'}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: 'rgba(255,255,255,0.5)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            width: 40,
            height: 40,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      {/* Stepper */}
      <Box sx={{ px: 4, py: 3, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Stepper 
          activeStep={activeStep} 
          alternativeLabel 
          connector={<CustomStepConnector />}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={() => (
                  <CustomStepIcon 
                    stepIndex={index} 
                    active={activeStep === index}
                    completed={activeStep > index}
                  />
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: activeStep >= index ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontWeight: activeStep === index ? 600 : 400,
                    fontSize: '0.9rem',
                    mt: 1.5
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <Box sx={{ 
        px: 4, 
        py: 3, 
        flex: 1, 
        overflowY: 'auto',
        minHeight: 320
      }}>
        {/* Error alert */}
        {error && (
          <Box 
            sx={{ 
              mb: 3, 
              p: 2, 
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <CloseIcon sx={{ color: '#f87171', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#f87171' }}>
              {error}
            </Typography>
          </Box>
        )}

        {/* Step content */}
        {renderStepContent()}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 4, 
        py: 2.5,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'none',
            fontSize: '0.9rem',
            px: 3,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' }
          }}
        >
          Cancel
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {activeStep > 0 && !editSystem && (
            <Button 
              onClick={handleBack}
              startIcon={<ArrowLeftIcon />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                textTransform: 'none',
                fontSize: '0.9rem',
                px: 2.5,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.1)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              Back
            </Button>
          )}
          
          {activeStep < 2 ? (
            <Button 
              onClick={handleNext}
              endIcon={<ArrowRightIcon />}
              sx={{
                backgroundColor: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 3,
                borderRadius: 2,
                border: '1px solid rgba(74, 222, 128, 0.3)',
                '&:hover': { 
                  backgroundColor: 'rgba(74, 222, 128, 0.25)',
                  borderColor: 'rgba(74, 222, 128, 0.5)'
                }
              }}
            >
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={!isSubmitting && <CheckIcon />}
              sx={{
                backgroundColor: '#4ade80',
                color: '#000',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 4,
                py: 1.25,
                borderRadius: 2,
                '&:hover': { backgroundColor: '#22c55e' },
                '&:disabled': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {isSubmitting ? 'Saving...' : (editSystem ? 'Save Changes' : 'Add System')}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default AddSystemDialog;

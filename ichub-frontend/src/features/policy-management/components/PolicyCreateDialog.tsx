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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentPaste as PasteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import {
  Policy,
  PolicyVersion,
  PolicyType,
  PolicyDataType,
  DATA_TYPE_INFO,
  POLICY_VERSION_INFO
} from '../types/types';

interface PolicyCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editPolicy?: Policy | null;
}

const POLICY_BUILDER_URL = 'https://eclipse-tractusx.github.io/tractusx-edc-dashboard/policy-builder/';

const steps = ['Configure JSON', 'Policy Details'];

/**
 * Dialog for creating or editing policies
 * Step 1: Configure JSON using Policy Builder iframe + collapsible paste JSON panel (fullscreen)
 * Step 2: Policy details (name, version, description, data type, tags) + JSON preview (floating dialog)
 */
const PolicyCreateDialog: React.FC<PolicyCreateDialogProps> = ({
  open,
  onClose,
  onSave,
  editPolicy
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState<PolicyVersion>('saturn');
  const [dataType, setDataType] = useState<PolicyDataType>('digital-product-passport');
  const [policyJson, setPolicyJson] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Detected policy type from JSON
  const [detectedPolicyType, setDetectedPolicyType] = useState<PolicyType | null>(null);

  // Reset form when dialog opens/closes or edit policy changes
  useEffect(() => {
    if (open) {
      if (editPolicy) {
        setName(editPolicy.name);
        setDescription(editPolicy.description || '');
        setVersion(editPolicy.version);
        setDataType(editPolicy.dataType);
        setPolicyJson(JSON.stringify(editPolicy.policyJson, null, 2));
        setTags(editPolicy.tags || []);
        setDetectedPolicyType(editPolicy.type);
        setActiveStep(1); // Go directly to step 2 when editing
      } else {
        resetForm();
      }
      setJsonError(null);
      setIframeLoaded(false);
      setIsPanelExpanded(true);
    }
  }, [open, editPolicy]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setVersion('saturn');
    setDataType('digital-product-passport');
    setPolicyJson('');
    setTags([]);
    setTagInput('');
    setActiveStep(0);
    setDetectedPolicyType(null);
  };

  /**
   * Detect policy type from JSON content
   */
  const detectPolicyType = useCallback((jsonContent: string): PolicyType | null => {
    try {
      const parsed = JSON.parse(jsonContent);
      const permissions = parsed.policy?.permission || parsed.permission || [];
      
      for (const permission of permissions) {
        const action = permission.action?.toLowerCase() || '';
        if (action === 'use') {
          const constraints = permission.constraint || [];
          for (const constraint of constraints) {
            const and = constraint.and || [];
            for (const andConstraint of and) {
              const leftOperand = andConstraint.leftOperand?.toLowerCase() || '';
              if (leftOperand.includes('usagepurpose') || leftOperand.includes('frameworkagreement')) {
                return 'usage';
              }
            }
          }
        }
      }
      return 'access';
    } catch {
      return null;
    }
  }, []);

  /**
   * Update the JSON with the policy name
   */
  const getUpdatedJson = useCallback((): string => {
    if (!policyJson.trim()) return '';
    
    try {
      const parsed = JSON.parse(policyJson);
      if (parsed['@id'] !== undefined) {
        parsed['@id'] = name.trim() || 'CHANGE-ME';
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return policyJson;
    }
  }, [policyJson, name]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateJson = (): boolean => {
    try {
      JSON.parse(policyJson);
      setJsonError(null);
      return true;
    } catch {
      setJsonError('Invalid JSON format. Please check your input.');
      return false;
    }
  };

  /**
   * Handle paste from clipboard
   */
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPolicyJson(text);
      
      try {
        JSON.parse(text);
        setJsonError(null);
        const type = detectPolicyType(text);
        setDetectedPolicyType(type);
      } catch {
        setJsonError('Invalid JSON format. Please check your input.');
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setJsonError('Failed to read from clipboard. Please paste manually.');
    }
  };

  /**
   * Handle JSON input change
   */
  const handleJsonChange = (value: string) => {
    setPolicyJson(value);
    setJsonError(null);
    
    if (value.trim()) {
      try {
        JSON.parse(value);
        const type = detectPolicyType(value);
        setDetectedPolicyType(type);
      } catch {
        setDetectedPolicyType(null);
      }
    } else {
      setDetectedPolicyType(null);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!policyJson.trim()) {
        setJsonError('Policy JSON is required');
        return;
      }
      if (!validateJson()) {
        return;
      }
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateJson()) {
      return;
    }

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedJson = getUpdatedJson();
      
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        version,
        type: detectedPolicyType || 'access',
        dataType,
        status: editPolicy?.status || 'draft',
        policyJson: JSON.parse(updatedJson),
        tags: tags.length > 0 ? tags : undefined,
        createdBy: 'admin'
      });
      onClose();
    } catch (error) {
      console.error('Error saving policy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const togglePanel = () => {
    setIsPanelExpanded(prev => !prev);
  };

  const isStep1Valid = policyJson.trim().length > 0 && !jsonError;
  const isStep2Valid = name.trim().length > 0;

  /**
   * Step 1: Configure JSON - Policy Builder iframe + collapsible paste panel (FULLSCREEN)
   */
  const renderStep1 = () => (
    <Box sx={{ 
      display: 'flex', 
      height: '100%',
      position: 'relative'
    }}>
      {/* Policy Builder iframe - takes full width when panel collapsed */}
      <Box sx={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease'
      }}>
        {!iframeLoaded && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            gap: 2
          }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Opening Policy Builder...
            </Typography>
          </Box>
        )}
        <iframe
          src={POLICY_BUILDER_URL}
          title="Policy Builder"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: iframeLoaded ? 'block' : 'none',
            backgroundColor: '#fff'
          }}
          onLoad={handleIframeLoad}
        />
      </Box>

      {/* Collapsible toggle bar - more transparent */}
      <Box
        onClick={togglePanel}
        sx={{
          position: 'absolute',
          right: isPanelExpanded ? 350 : 0,
          top: 0,
          bottom: 0,
          width: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 30, 30, 0.5)',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.3s ease',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: isPanelExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          '&:hover': {
            backgroundColor: 'rgba(60, 60, 60, 0.7)',
            '& .toggle-icon': {
              color: '#60a5fa'
            }
          }
        }}
      >
        <IconButton 
          size="small" 
          className="toggle-icon"
          sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            p: 0,
            transition: 'color 0.2s ease'
          }}
        >
          {isPanelExpanded ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Close button - top right, adapts to panel state */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: isPanelExpanded ? 358 : 8,
          zIndex: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'rgba(255, 255, 255, 0.8)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            color: '#fff'
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Collapsible Configure JSON panel */}
      <Collapse 
        in={isPanelExpanded} 
        orientation="horizontal"
        sx={{
          '& .MuiCollapse-wrapperInner': {
            width: 350
          }
        }}
      >
        <Box sx={{ 
          width: 350,
          height: '100%',
          display: 'flex', 
          flexDirection: 'column',
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Configure JSON
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Build your policy using the Policy Builder, then <strong>select and copy (Ctrl+C)</strong> the JSON and paste it here.
          </Typography>

          {/* Paste JSON area */}
          <Paper
            sx={{
              flex: 1,
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Policy JSON
              </Typography>
              {detectedPolicyType && (
                <Chip
                  icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
                  label={detectedPolicyType === 'access' ? 'Access Policy' : 'Usage Policy'}
                  size="small"
                  sx={{
                    backgroundColor: detectedPolicyType === 'access' 
                      ? 'rgba(96, 165, 250, 0.15)' 
                      : 'rgba(244, 143, 177, 0.15)',
                    color: detectedPolicyType === 'access' ? '#60a5fa' : '#f48fb1',
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }}
                />
              )}
            </Box>

            {!policyJson.trim() ? (
              // Empty state - show paste button
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 2,
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                p: 3
              }}>
                <PasteIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  Copy the JSON from Policy Builder and paste it here
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PasteIcon />}
                  onClick={handlePasteFromClipboard}
                  sx={{ mt: 1 }}
                >
                  Paste JSON
                </Button>
              </Box>
            ) : (
              // JSON content
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <TextField
                  multiline
                  value={policyJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  error={!!jsonError}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      height: '100%',
                      alignItems: 'flex-start',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    },
                    '& .MuiInputBase-input': {
                      height: '100% !important',
                      overflow: 'auto !important'
                    }
                  }}
                />
                {jsonError && (
                  <Alert 
                    severity="error" 
                    sx={{ mt: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    icon={<ErrorIcon />}
                  >
                    {jsonError}
                  </Alert>
                )}
                {!jsonError && policyJson.trim() && (
                  <Alert 
                    severity="success" 
                    sx={{ mt: 1, backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                    icon={<CheckIcon />}
                  >
                    Valid JSON
                  </Alert>
                )}
                <Button
                  variant="text"
                  size="small"
                  startIcon={<PasteIcon />}
                  onClick={handlePasteFromClipboard}
                  sx={{ mt: 1, alignSelf: 'flex-start' }}
                >
                  Paste from Clipboard
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </Collapse>
    </Box>
  );

  /**
   * Step 2: Policy Details + JSON preview (FLOATING DIALOG content)
   */
  const renderStep2 = () => {
    const updatedJson = getUpdatedJson();
    const versionInfo = POLICY_VERSION_INFO[version];
    const dataTypeInfo = DATA_TYPE_INFO[dataType] || { label: dataType, color: '#9ca3af' };

    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3
      }}>
        {/* Policy Type Badge */}
        {detectedPolicyType && (
          <Alert
            severity="info"
            icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
            sx={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}
          >
            <Typography variant="body2">
              This is an <strong>{detectedPolicyType === 'access' ? 'Access' : 'Usage'} Policy</strong> (detected from JSON configuration)
            </Typography>
          </Alert>
        )}

        {/* Name */}
        <TextField
          label="Policy Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          placeholder="e.g., Default Access Policy"
          helperText="This name will replace 'CHANGE-ME' in the JSON @id field"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        />

        {/* Version Selector */}
        <Paper
          sx={{
            p: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Connector Version
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {(['saturn', 'jupiter'] as PolicyVersion[]).map((v) => {
              const info = POLICY_VERSION_INFO[v];
              return (
                <Paper
                  key={v}
                  onClick={() => setVersion(v)}
                  sx={{
                    flex: 1,
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: version === v 
                      ? alpha(info.color, 0.15) 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `2px solid ${version === v ? info.color : 'rgba(255, 255, 255, 0.12)'}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: info.color,
                      backgroundColor: alpha(info.color, 0.1)
                    }
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: info.color, fontWeight: 600, mb: 0.5 }}
                  >
                    {info.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {info.description}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Paper>

        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={2}
          fullWidth
          placeholder="Describe what this policy is for..."
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)'
            }
          }}
        />

        {/* Data Type */}
        <FormControl fullWidth>
          <InputLabel>Data Type</InputLabel>
          <Select
            value={dataType}
            label="Data Type"
            onChange={(e) => setDataType(e.target.value as PolicyDataType)}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            {Object.entries(DATA_TYPE_INFO).map(([key, info]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: info.color
                    }}
                  />
                  {info.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Tags */}
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Tags (optional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
                sx={{
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  color: '#60a5fa'
                }}
              />
            ))}
          </Box>
          <TextField
            size="small"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag and press Enter"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          />
        </Box>

        {/* JSON Preview with updated name */}
        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Policy JSON Preview
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {detectedPolicyType && (
                <Chip
                  icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
                  label={detectedPolicyType === 'access' ? 'Access' : 'Usage'}
                  size="small"
                  sx={{
                    backgroundColor: detectedPolicyType === 'access' 
                      ? 'rgba(96, 165, 250, 0.15)' 
                      : 'rgba(244, 143, 177, 0.15)',
                    color: detectedPolicyType === 'access' ? '#60a5fa' : '#f48fb1',
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }}
                />
              )}
              <Chip
                label={versionInfo.label}
                size="small"
                sx={{
                  backgroundColor: alpha(versionInfo.color, 0.15),
                  color: versionInfo.color
                }}
              />
              <Chip
                label={dataTypeInfo.label}
                size="small"
                sx={{
                  backgroundColor: alpha(dataTypeInfo.color, 0.15),
                  color: dataTypeInfo.color
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              maxHeight: 200,
              overflow: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 1,
              p: 1.5,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
              }
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
              {updatedJson}
            </pre>
          </Box>
          {name.trim() && (
            <Typography variant="caption" sx={{ color: 'success.main', mt: 1, display: 'block' }}>
              ✓ Policy ID will be set to "{name.trim()}"
            </Typography>
          )}
        </Paper>
      </Box>
    );
  };

  // Step 1 = fullScreen, Step 2 = floating dialog
  const isFullScreen = activeStep === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isFullScreen}
      maxWidth={isFullScreen ? false : 'md'}
      fullWidth={!isFullScreen}
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          backgroundImage: 'none',
          border: isFullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          ...(isFullScreen ? {} : { minHeight: '70vh', maxHeight: '90vh' }),
          // Custom scrollbar
          '& .MuiDialogContent-root': {
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
          },
        }
      }}
    >
      {/* Header only for Step 2 (floating dialog) */}
      {!isFullScreen && (
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            pb: 2
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editPolicy ? 'Edit Policy' : 'Create New Policy'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Configure policy details and review
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent sx={{ 
        flex: 1, 
        p: isFullScreen ? 0 : 3, 
        overflow: isFullScreen ? 'hidden' : 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
      </DialogContent>

      {/* Footer with Cancel, Steps, and Next/Create */}
      <DialogActions sx={{ 
        px: 3, 
        py: 1.5, 
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: isFullScreen ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>

        {/* Steps in the middle */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              width: 'auto',
              '& .MuiStepLabel-label': {
                fontSize: '0.875rem'
              },
              '& .MuiStepConnector-line': {
                minWidth: 40
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && !editPolicy && (
            <Button onClick={handleBack}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStep1Valid}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep2Valid}
              sx={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                }
              }}
            >
              {isSubmitting ? 'Creating...' : editPolicy ? 'Save Changes' : 'Create Policy'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default PolicyCreateDialog;

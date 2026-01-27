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

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Alert,
  Snackbar,
  Fade,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentPaste as PasteIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  OpenInNew as OpenInNewIcon,
  AutoAwesome as AutoAwesomeIcon,
  Visibility as VisibilityIcon
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

  // Policy Builder window and clipboard monitoring
  const [policyBuilderOpen, setPolicyBuilderOpen] = useState(false);
  const [isWaitingForClipboard, setIsWaitingForClipboard] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const lastClipboardContentRef = useRef<string>('');
  const policyBuilderWindowRef = useRef<Window | null>(null);

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
    } else {
      // Clean up when dialog closes
      if (policyBuilderWindowRef.current && !policyBuilderWindowRef.current.closed) {
        policyBuilderWindowRef.current.close();
      }
      setPolicyBuilderOpen(false);
      setIsWaitingForClipboard(false);
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
    lastClipboardContentRef.current = '';
  };

  /**
   * Check if content looks like a valid ODRL/JSON-LD policy
   */
  const isValidPolicyJson = useCallback((content: string): boolean => {
    try {
      const parsed = JSON.parse(content);
      // Check for ODRL/JSON-LD policy indicators
      const hasContext = parsed['@context'] !== undefined;
      const hasType = parsed['@type'] !== undefined;
      const hasId = parsed['@id'] !== undefined;
      const hasPermission = parsed.permission !== undefined || 
                           (parsed.policy && parsed.policy.permission !== undefined);
      const hasOdrlIndicators = content.includes('odrl') || 
                                content.includes('permission') ||
                                content.includes('constraint');
      
      return (hasContext || hasType || hasId) && (hasPermission || hasOdrlIndicators);
    } catch {
      return false;
    }
  }, []);

  /**
   * Check clipboard for policy JSON when window regains focus
   */
  const checkClipboardForPolicy = useCallback(async () => {
    try {
      const clipboardContent = await navigator.clipboard.readText();
      
      // Skip if content hasn't changed
      if (clipboardContent === lastClipboardContentRef.current) return;
      
      // Check if it looks like a valid policy JSON
      if (isValidPolicyJson(clipboardContent)) {
        lastClipboardContentRef.current = clipboardContent;
        
        // Auto-import the JSON
        setPolicyJson(clipboardContent);
        setJsonError(null);
        
        // Detect policy type
        const type = detectPolicyType(clipboardContent);
        setDetectedPolicyType(type);
        
        // Show success notification
        setNotificationMessage(
          `✨ Policy JSON imported! (${type === 'access' ? 'Access' : type === 'usage' ? 'Usage' : 'Unknown'} Policy)`
        );
        setShowSuccessNotification(true);
        setIsWaitingForClipboard(false);
      }
    } catch (err) {
      // Clipboard access denied - ignore silently
      console.debug('Clipboard access denied:', err);
    }
  }, [isValidPolicyJson]);

  /**
   * Effect to monitor window focus and check clipboard
   */
  useEffect(() => {
    if (!open || activeStep !== 0) return;

    const handleFocus = () => {
      // Check if Policy Builder window was opened and is now closed or user returned
      if (policyBuilderOpen) {
        checkClipboardForPolicy();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && policyBuilderOpen) {
        checkClipboardForPolicy();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [open, activeStep, policyBuilderOpen, checkClipboardForPolicy]);

  /**
   * Monitor if Policy Builder window is closed
   */
  useEffect(() => {
    if (!policyBuilderOpen || !policyBuilderWindowRef.current) return;

    const checkWindowInterval = setInterval(() => {
      if (policyBuilderWindowRef.current?.closed) {
        setPolicyBuilderOpen(false);
        setIsWaitingForClipboard(false);
        checkClipboardForPolicy();
        clearInterval(checkWindowInterval);
      }
    }, 500);

    return () => clearInterval(checkWindowInterval);
  }, [policyBuilderOpen, checkClipboardForPolicy]);

  /**
   * Detect policy type from JSON content
   */
  const detectPolicyType = useCallback((jsonContent: string): PolicyType | null => {
    try {
      const parsed = JSON.parse(jsonContent);
      const permissions = parsed.policy?.permission || parsed.permission || [];
      
      for (const permission of permissions) {
        const action = permission.action?.toLowerCase?.() || 
                       (typeof permission.action === 'object' ? permission.action['@id']?.toLowerCase?.() : '');
        if (action === 'use' || action?.includes('use')) {
          return 'usage';
        }
        const constraints = permission.constraint || [];
        for (const constraint of constraints) {
          const and = constraint.and || (constraint['odrl:and'] ? [constraint] : []);
          for (const andConstraint of and) {
            const leftOperand = andConstraint.leftOperand?.toLowerCase?.() || 
                               andConstraint['odrl:leftOperand']?.toLowerCase?.() || '';
            if (leftOperand.includes('usagepurpose') || leftOperand.includes('frameworkagreement')) {
              return 'usage';
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
   * Open Policy Builder in a new tab
   */
  const handleOpenPolicyBuilder = () => {
    // Store current clipboard content to detect changes
    navigator.clipboard.readText()
      .then(content => {
        lastClipboardContentRef.current = content;
      })
      .catch(() => {
        lastClipboardContentRef.current = '';
      });

    // Open Policy Builder in new tab
    const newWindow = window.open(POLICY_BUILDER_URL, '_blank', 'noopener');
    policyBuilderWindowRef.current = newWindow;
    setPolicyBuilderOpen(true);
    setIsWaitingForClipboard(true);
  };

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

  const isStep1Valid = policyJson.trim().length > 0 && !jsonError;
  const isStep2Valid = name.trim().length > 0;

  /**
   * Step 1: Configure JSON - Open Policy Builder in new tab + auto-import
   */
  const renderStep1 = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      p: 3,
      gap: 3
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', pt: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Configure Policy JSON
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
          Use the Catena-X Policy Builder to create your policy, then click "Copy JSON-LD" and come back here.
          <br />
          <strong>The JSON will be imported automatically!</strong>
        </Typography>
      </Box>

      {/* Main content */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        gap: 3,
        minHeight: 0 // Important for flex child scrolling
      }}>
        {/* Left side - Open Policy Builder */}
        <Paper sx={{ 
          flex: 1, 
          p: 3, 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3
        }}>
          {!policyBuilderOpen ? (
            // Initial state - show open button
            <>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <OpenInNewIcon sx={{ fontSize: 56, color: '#60a5fa' }} />
              </Box>
              <Typography variant="h6" sx={{ color: 'text.primary', textAlign: 'center' }}>
                Catena-X Policy Builder
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 300 }}>
                The Policy Builder will open in a new tab. Configure your policy there and click "Copy JSON-LD" to import it here.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenPolicyBuilder}
                sx={{ 
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  }
                }}
              >
                Open Policy Builder
              </Button>
            </>
          ) : isWaitingForClipboard && !policyJson.trim() ? (
            // Waiting for clipboard state
            <>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.05)', opacity: 0.8 }
                  }
                }}>
                  <AutoAwesomeIcon sx={{ fontSize: 56, color: '#22c55e' }} />
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: '#22c55e', textAlign: 'center' }}>
                Waiting for Policy JSON...
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 350 }}>
                Click <strong>"Copy JSON-LD"</strong> in the Policy Builder tab, then come back here.
                The JSON will be imported automatically!
              </Typography>
              <LinearProgress 
                sx={{ 
                  width: '80%', 
                  mt: 2,
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#22c55e',
                    animation: 'indeterminate 1.5s linear infinite'
                  }
                }} 
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PasteIcon />}
                  onClick={handlePasteFromClipboard}
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  Paste Manually
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  onClick={handleOpenPolicyBuilder}
                  sx={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  Reopen Builder
                </Button>
              </Box>
            </>
          ) : policyJson.trim() ? (
            // JSON imported successfully
            <>
              <Box sx={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckIcon sx={{ fontSize: 56, color: '#22c55e' }} />
              </Box>
              <Typography variant="h6" sx={{ color: '#22c55e', textAlign: 'center' }}>
                Policy JSON Imported!
              </Typography>
              {detectedPolicyType && (
                <Chip
                  icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
                  label={detectedPolicyType === 'access' ? 'Access Policy' : 'Usage Policy'}
                  sx={{
                    backgroundColor: detectedPolicyType === 'access' 
                      ? 'rgba(96, 165, 250, 0.15)' 
                      : 'rgba(244, 143, 177, 0.15)',
                    color: detectedPolicyType === 'access' ? '#60a5fa' : '#f48fb1',
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />
              )}
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={handleOpenPolicyBuilder}
                sx={{ mt: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                Open Policy Builder Again
              </Button>
            </>
          ) : null}
        </Paper>

        {/* Right side - JSON Preview/Edit */}
        <Paper sx={{ 
          flex: 1, 
          p: 2, 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Policy JSON
              </Typography>
            </Box>
            {detectedPolicyType && policyJson.trim() && (
              <Chip
                icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
                label={detectedPolicyType === 'access' ? 'Access Policy' : 'Usage Policy'}
                size="small"
                sx={{
                  backgroundColor: detectedPolicyType === 'access' 
                    ? 'rgba(96, 165, 250, 0.15)' 
                    : 'rgba(244, 143, 177, 0.15)',
                  color: detectedPolicyType === 'access' ? '#60a5fa' : '#f48fb1',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
          </Box>

          {!policyJson.trim() ? (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: 1
            }}>
              <PasteIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                JSON will appear here after you copy it from Policy Builder
              </Typography>
              <Button
                variant="text"
                startIcon={<PasteIcon />}
                onClick={handlePasteFromClipboard}
                size="small"
              >
                Or Paste Manually
              </Button>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <TextField
                multiline
                value={policyJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                error={!!jsonError}
                placeholder="Paste your policy JSON here..."
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
                  Valid JSON - Ready to continue
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
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

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '80vh',
          maxHeight: '90vh',
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
      {/* Header */}
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
            {activeStep === 0 ? 'Step 1: Configure your policy JSON' : 'Step 2: Add policy details'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ 
        flex: 1, 
        p: activeStep === 0 ? 0 : 3, 
        overflow: 'auto',
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

    {/* Success notification for auto-imported JSON */}
    <Snackbar
      open={showSuccessNotification}
      autoHideDuration={4000}
      onClose={() => setShowSuccessNotification(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={Fade}
    >
      <Alert
        onClose={() => setShowSuccessNotification(false)}
        severity="success"
        variant="filled"
        icon={<AutoAwesomeIcon />}
        sx={{ 
          minWidth: 300,
          backgroundColor: '#22c55e',
          '& .MuiAlert-icon': { color: '#fff' }
        }}
      >
        {notificationMessage}
      </Alert>
    </Snackbar>
    </>
  );
};

export default PolicyCreateDialog;

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
  Delete as DeleteIcon,
  Tab as TabIcon
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
  const [dataType, setDataType] = useState<PolicyDataType | ''>('');
  const [policyJson, setPolicyJson] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Detected policy type from JSON
  const [detectedPolicyType, setDetectedPolicyType] = useState<PolicyType | null>(null);
  
  // Detected policy version from JSON (Saturn vs Jupiter)
  const [detectedPolicyVersion, setDetectedPolicyVersion] = useState<PolicyVersion | null>(null);

  // Policy Builder window and clipboard monitoring
  const [policyBuilderOpen, setPolicyBuilderOpen] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const lastClipboardContentRef = useRef<string>('');
  const policyBuilderWindowRef = useRef<Window | null>(null);

  // New state for enhanced features
  // true = mostrar JSON-LD completo (por defecto), false = mostrar formato simplificado
  const [showLdMode, setShowLdMode] = useState(true);
  const [existingClipboardJson, setExistingClipboardJson] = useState<string | null>(null);
  const [showExistingJsonDialog, setShowExistingJsonDialog] = useState(false);
  const [tabClosedNotification, setTabClosedNotification] = useState(false);

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
        // Check for existing JSON in clipboard when dialog opens
        checkForExistingClipboardJson();
      }
      setJsonError(null);
    } else {
      // Clean up when dialog closes
      if (policyBuilderWindowRef.current && !policyBuilderWindowRef.current.closed) {
        policyBuilderWindowRef.current.close();
      }
      setPolicyBuilderOpen(false);
      setShowExistingJsonDialog(false);
      setExistingClipboardJson(null);
      setTabClosedNotification(false);
    }
  }, [open, editPolicy]);

  /**
   * Check if there's already a valid policy JSON in the clipboard when dialog opens
   */
  const checkForExistingClipboardJson = async () => {
    try {
      const clipboardContent = await navigator.clipboard.readText();
      if (isValidPolicyJson(clipboardContent)) {
        setExistingClipboardJson(clipboardContent);
        setShowExistingJsonDialog(true);
      }
    } catch {
      // Clipboard access denied - proceed normally
      console.debug('Clipboard access denied on dialog open');
    }
  };

  /**
   * Use the existing JSON from clipboard
   */
  const handleUseExistingJson = () => {
    if (existingClipboardJson) {
      setPolicyJson(existingClipboardJson);
      const type = detectPolicyType(existingClipboardJson);
      setDetectedPolicyType(type);
      const policyVersion = detectPolicyVersion(existingClipboardJson);
      setDetectedPolicyVersion(policyVersion);
      if (policyVersion) {
        setVersion(policyVersion);
      }
      lastClipboardContentRef.current = existingClipboardJson;
      const versionLabel = policyVersion === 'saturn' ? 'Saturn' : policyVersion === 'jupiter' ? 'Jupiter' : '';
      setNotificationMessage(
        `✨ Existing Policy JSON imported! (${type === 'access' ? 'Access' : type === 'usage' ? 'Usage' : 'Unknown'} Policy${versionLabel ? ` - ${versionLabel}` : ''})`
      );
      setShowSuccessNotification(true);
    }
    setShowExistingJsonDialog(false);
  };

  /**
   * Clear clipboard and start fresh
   */
  const handleClearClipboardAndStartFresh = async () => {
    try {
      await navigator.clipboard.writeText('');
      lastClipboardContentRef.current = '';
    } catch {
      console.debug('Failed to clear clipboard');
    }
    setExistingClipboardJson(null);
    setShowExistingJsonDialog(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setVersion('saturn');
    setDataType('');
    setPolicyJson('');
    setTags([]);
    setTagInput('');
    setActiveStep(0);
    setDetectedPolicyType(null);
    setDetectedPolicyVersion(null);
    lastClipboardContentRef.current = '';
    setShowLdMode(true);
    setExistingClipboardJson(null);
    setShowExistingJsonDialog(false);
    setTabClosedNotification(false);
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
   * Detect policy type from JSON content
   * Must be defined before checkClipboardForPolicy which uses it
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
   * Detect policy version from JSON content (Saturn vs Jupiter)
   * Saturn: @context is array with w3id.org/catenax/2025 URLs, @type is "PolicyDefinition"
   * Jupiter: @context is object, @type is "PolicyDefinitionRequestDto", uses odrl: prefixes
   */
  const detectPolicyVersion = useCallback((jsonContent: string): PolicyVersion | null => {
    try {
      const parsed = JSON.parse(jsonContent);
      const context = parsed['@context'];
      const type = parsed['@type'];
      
      // Check for Saturn indicators
      if (Array.isArray(context)) {
        // Saturn uses array @context with w3id.org/catenax/2025 URLs
        const hasSaturnUrls = context.some((item: unknown) => 
          typeof item === 'string' && item.includes('w3id.org/catenax/2025')
        );
        if (hasSaturnUrls) return 'saturn';
      }
      
      // Check for Saturn @type
      if (type === 'PolicyDefinition') return 'saturn';
      
      // Check for Jupiter indicators
      if (context && typeof context === 'object' && !Array.isArray(context)) {
        // Jupiter uses object @context with odrl and cx-policy keys
        if ('odrl' in context || 'cx-policy' in context) return 'jupiter';
      }
      
      // Check for Jupiter @type
      if (type === 'PolicyDefinitionRequestDto') return 'jupiter';
      
      // Check for odrl: prefixes in stringified content (Jupiter uses them)
      if (jsonContent.includes('"odrl:')) return 'jupiter';
      
      // If none of the above, check for simplified format (Saturn style)
      const policy = parsed.policy || parsed;
      if (policy.permission && !jsonContent.includes('"odrl:permission"')) {
        return 'saturn';
      }
      
      return null;
    } catch {
      return null;
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
        
        // Detect policy version and auto-set it
        const policyVersion = detectPolicyVersion(clipboardContent);
        setDetectedPolicyVersion(policyVersion);
        if (policyVersion) {
          setVersion(policyVersion);
        }
        
        // Close the Policy Builder tab if it's open
        if (policyBuilderWindowRef.current && !policyBuilderWindowRef.current.closed) {
          policyBuilderWindowRef.current.close();
          policyBuilderWindowRef.current = null;
          setTabClosedNotification(true);
        }
        
        setPolicyBuilderOpen(false);
        
        // Show success notification
        const versionLabel = policyVersion === 'saturn' ? 'Saturn' : policyVersion === 'jupiter' ? 'Jupiter' : '';
        setNotificationMessage(
          `✨ Policy JSON imported! (${type === 'access' ? 'Access' : type === 'usage' ? 'Usage' : 'Unknown'} Policy${versionLabel ? ` - ${versionLabel}` : ''})`
        );
        setShowSuccessNotification(true);
      }
    } catch (err) {
      // Clipboard access denied - ignore silently
      console.debug('Clipboard access denied:', err);
    }
  }, [isValidPolicyJson, detectPolicyType, detectPolicyVersion]);

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
        checkClipboardForPolicy();
        clearInterval(checkWindowInterval);
      }
    }, 500);

    return () => clearInterval(checkWindowInterval);
  }, [policyBuilderOpen, checkClipboardForPolicy]);

  // Constant name for the Policy Builder window - allows reusing the same tab
  const POLICY_BUILDER_WINDOW_NAME = 'ICHub_PolicyBuilder';

  /**
   * Open Policy Builder in a new tab or reuse existing one
   * Uses a named window so the browser can reuse it if already open
   */
  const handleOpenPolicyBuilder = async () => {
    // Clear clipboard to ensure we can detect the new JSON (avoids same-content issue)
    try {
      await navigator.clipboard.writeText('');
      lastClipboardContentRef.current = '';
    } catch {
      // If we can't clear, at least store the current content
      try {
        const content = await navigator.clipboard.readText();
        lastClipboardContentRef.current = content;
      } catch {
        lastClipboardContentRef.current = '';
      }
    }

    // Check if we already have a reference to an open Policy Builder window
    if (policyBuilderWindowRef.current && !policyBuilderWindowRef.current.closed) {
      // Window exists and is open - just focus it
      try {
        policyBuilderWindowRef.current.focus();
        setNotificationMessage('📌 Policy Builder tab focused - it was already open');
        setShowSuccessNotification(true);
      } catch {
        // Focus might fail due to browser security, try to open/reuse anyway
        policyBuilderWindowRef.current = window.open(POLICY_BUILDER_URL, POLICY_BUILDER_WINDOW_NAME);
      }
    } else {
      // Open Policy Builder in new tab with a specific name to allow reuse
      // Using a named window allows the browser to reuse the tab if it already exists
      const newWindow = window.open(POLICY_BUILDER_URL, POLICY_BUILDER_WINDOW_NAME);
      policyBuilderWindowRef.current = newWindow;
      
      // Try to focus the window (might be blocked by popup blockers)
      try {
        newWindow?.focus();
      } catch {
        // Focus failed, but window should still be opened
      }
    }
    
    setPolicyBuilderOpen(true);
  };

  /**
   * Handle "Create Another" button - reset to initial state and open Policy Builder
   */
  const handleCreateAnother = async () => {
    // Reset to initial state
    setPolicyJson('');
    setJsonError(null);
    setShowLdMode(true);
    setTabClosedNotification(false);
    setPolicyBuilderOpen(false);
    
    // Small delay to let state reset, then open Policy Builder
    setTimeout(() => {
      handleOpenPolicyBuilder();
    }, 50);
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

  /**
   * Convert JSON-LD to simplified format
   * This removes verbose keys and simplifies the structure
   */
  const convertToLsFormat = useCallback((jsonContent: string): string => {
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Deep clone and transform - remove common verbose patterns
      const transform = (obj: unknown): unknown => {
        if (Array.isArray(obj)) {
          return obj.map(transform);
        }
        if (obj && typeof obj === 'object') {
          const transformed: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            // Replace @-prefixed keys with simpler versions
            let newKey = key;
            if (key.startsWith('@')) {
              newKey = key.substring(1); // Remove @ prefix
            }
            // Replace odrl: prefixed keys
            if (key.startsWith('odrl:')) {
              newKey = key.replace('odrl:', '');
            }
            // Replace cx-policy: prefixed values
            if (key.startsWith('cx-policy:')) {
              newKey = key.replace('cx-policy:', '');
            }
            transformed[newKey] = transform(value);
          }
          return transformed;
        }
        // Transform string values
        if (typeof obj === 'string') {
          return obj
            .replace(/^odrl:/, '')
            .replace(/^cx-policy:/, '');
        }
        return obj;
      };
      
      return JSON.stringify(transform(parsed), null, 2);
    } catch {
      return jsonContent;
    }
  }, []);

  /**
   * Get display JSON based on LD mode toggle
   */
  const getDisplayJson = useCallback((): string => {
    if (showLdMode) {
      return policyJson; // JSON-LD completo
    }
    return convertToLsFormat(policyJson); // Formato simplificado
  }, [policyJson, showLdMode, convertToLsFormat]);

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

    if (!name.trim() || !dataType) {
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
        dataType: dataType as PolicyDataType,
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
  const isStep2Valid = name.trim().length > 0 && !!dataType;

  /**
   * Step 1: Configure JSON - Open Policy Builder in new tab + auto-import
   * Only shows the right JSON panel when JSON is detected
   */
  const renderStep1 = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      p: policyJson.trim() ? 2 : 3,
      pt: policyJson.trim() ? 0 : 3,
      gap: policyJson.trim() ? 1.5 : 2,
      position: 'relative'
    }}>
      {/* Header - Siempre sticky cuando hay JSON */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        ...(policyJson.trim() ? {
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(12px)',
          mx: -2,
          px: 2,
          py: 1.5,
          mb: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        } : {
          pb: 0
        })
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {policyJson.trim() && (
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
            }} />
          )}
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 600, 
            color: 'text.primary',
            letterSpacing: '-0.01em'
          }}>
            {policyJson.trim() ? 'Policy JSON' : 'Configure Policy JSON'}
          </Typography>
          {!policyJson.trim() && (
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.7 }}>
              — Use the Policy Builder to create your policy
            </Typography>
          )}
        </Box>
        {policyJson.trim() && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* JSON-LD Mode Toggle - Modern switch design */}
            <Box 
              onClick={() => setShowLdMode(!showLdMode)}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 1.25,
                py: 0.625,
                borderRadius: 3,
                width: 80,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              {/* Toggle Switch Track */}
              <Box sx={{ 
                position: 'relative',
                width: 32,
                height: 16,
                borderRadius: 8,
                backgroundColor: showLdMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
              }}>
                {/* Toggle Switch Knob */}
                <Box sx={{ 
                  position: 'absolute',
                  top: 2,
                  left: showLdMode ? 2 : 16,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: showLdMode ? '#60a5fa' : '#f59e0b',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)'
                  }
                }} />
              </Box>
              {/* Label */}
              <Typography variant="caption" sx={{ 
                color: showLdMode ? '#60a5fa' : '#f59e0b',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.5px',
                transition: 'color 0.3s ease',
                width: 24,
                textAlign: 'center'
              }}>
                {showLdMode ? 'LD' : 'SIM'}
              </Typography>
            </Box>
            {detectedPolicyType && (
              <Chip
                icon={detectedPolicyType === 'access' ? <VpnKeyIcon /> : <SecurityIcon />}
                label={detectedPolicyType === 'access' ? 'Access' : 'Usage'}
                size="small"
                sx={{
                  height: 26,
                  backgroundColor: detectedPolicyType === 'access' 
                    ? 'rgba(96, 165, 250, 0.1)' 
                    : 'rgba(244, 143, 177, 0.1)',
                  border: `1px solid ${detectedPolicyType === 'access' 
                    ? 'rgba(96, 165, 250, 0.25)' 
                    : 'rgba(244, 143, 177, 0.25)'}`,
                  color: detectedPolicyType === 'access' ? '#60a5fa' : '#f48fb1',
                  '& .MuiChip-icon': { 
                    color: 'inherit',
                    fontSize: 14
                  },
                  '& .MuiChip-label': {
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    px: 0.75
                  }
                }}
              />
            )}
            {detectedPolicyVersion && (
              <Chip
                label={detectedPolicyVersion === 'saturn' ? 'Saturn' : 'Jupiter'}
                size="small"
                sx={{
                  height: 26,
                  backgroundColor: detectedPolicyVersion === 'saturn' 
                    ? 'rgba(245, 158, 11, 0.1)' 
                    : 'rgba(139, 92, 246, 0.1)',
                  border: `1px solid ${detectedPolicyVersion === 'saturn' 
                    ? 'rgba(245, 158, 11, 0.25)' 
                    : 'rgba(139, 92, 246, 0.25)'}`,
                  color: detectedPolicyVersion === 'saturn' ? '#f59e0b' : '#8b5cf6',
                  '& .MuiChip-label': {
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    px: 0.75
                  }
                }}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Tab closed notification - More subtle */}
      {tabClosedNotification && (
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 1.5
        }}>
          <TabIcon sx={{ color: '#60a5fa', fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: '#60a5fa', flex: 1 }}>
            Policy Builder tab closed automatically
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setTabClosedNotification(false)}
            sx={{ p: 0.25, color: 'rgba(96, 165, 250, 0.6)' }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      )}

      {/* Main content */}
      {!policyJson.trim() ? (
        // No JSON yet - show Policy Builder options centered
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          p: 3
        }}>
          <Paper sx={{ 
            width: '100%',
            height: '100%',
            maxWidth: 650,
            maxHeight: 500,
            p: 5, 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 3,
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
                <Typography variant="h5" sx={{ color: 'text.primary', textAlign: 'center', fontWeight: 500 }}>
                  Catena-X Policy Builder
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 420 }}>
                  Configure your policy in the Policy Builder, then click <strong>"Copy JSON-LD"</strong>.
                  <br />
                  <Typography component="span" sx={{ color: 'info.main', fontSize: '0.9rem' }}>
                    The JSON will be detected automatically!
                  </Typography>
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<OpenInNewIcon />}
                  onClick={handleOpenPolicyBuilder}
                  sx={{ 
                    mt: 2,
                    px: 5,
                    py: 1.75,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    }
                  }}
                >
                  Open Policy Builder
                </Button>
              </>
            ) : (
              // Waiting for clipboard state
              <>
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
                <Typography variant="h5" sx={{ color: '#22c55e', textAlign: 'center', fontWeight: 500 }}>
                  Monitoring Clipboard...
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 420 }}>
                  Click <strong>"Copy JSON-LD"</strong> in the Policy Builder tab.
                  <br />
                  The JSON will be imported automatically!
                </Typography>
                <LinearProgress 
                  sx={{ 
                    width: '85%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#22c55e'
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
            )}
          </Paper>
        </Box>
      ) : (
        // JSON detected - show JSON as main content with floating banner
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
          pb: 9, // Padding at bottom for the floating banner
          gap: 2,
          position: 'relative'
        }}>
          {/* JSON Content - Expands based on content */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: 2,
            border: showLdMode 
              ? '1px solid rgba(96, 165, 250, 0.25)' 
              : '1px solid rgba(245, 158, 11, 0.25)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}>
            {!showLdMode ? (
              // Read-only view for simplified mode
              <Box
                sx={{
                  p: 2.5
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  pb: 1.5,
                  borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    backgroundColor: '#f59e0b' 
                  }} />
                  <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 500, letterSpacing: '0.5px' }}>
                    SIMPLIFIED FORMAT
                  </Typography>
                </Box>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.82rem', 
                  color: '#e2e8f0', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                  lineHeight: 1.6
                }}>
                  {getDisplayJson()}
                </pre>
              </Box>
            ) : (
              <TextField
                multiline
                value={policyJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                error={!!jsonError}
                placeholder="Paste your policy JSON here..."
                minRows={10}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    alignItems: 'flex-start',
                    backgroundColor: 'transparent',
                    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    border: 'none',
                    '& fieldset': { border: 'none' },
                    '&:hover fieldset': { border: 'none' },
                    '&.Mui-focused fieldset': { border: 'none' }
                  },
                  '& .MuiInputBase-input': {
                    padding: '20px'
                  }
                }}
              />
            )}
            
            {/* Error overlay if any */}
            {jsonError && (
              <Box sx={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 1.5,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderTop: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <ErrorIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#ef4444' }}>
                  {jsonError}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Success Banner - Overlay flotante fijo justo encima del footer */}
      {policyJson.trim() && !jsonError && (
        <Box sx={{ 
          position: 'fixed',
          bottom: 107,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 1200,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          background: 'rgba(34, 197, 94, 0.15)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: 0,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckIcon sx={{ color: '#22c55e', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ 
                color: '#22c55e', 
                fontWeight: 600,
                letterSpacing: '0.3px'
              }}>
                Policy JSON imported successfully
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(34, 197, 94, 0.8)' }}>
                Valid JSON • Ready to continue
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            onClick={handleCreateAnother}
            sx={{ 
              color: '#22c55e',
              borderColor: 'rgba(34, 197, 94, 0.5)',
              fontSize: '0.85rem',
              fontWeight: 500,
              textTransform: 'none',
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              '&:hover': { 
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)'
              }
            }}
          >
            Create another
          </Button>
        </Box>
      )}

      {/* Existing JSON in Clipboard Dialog */}
      <Dialog
        open={showExistingJsonDialog}
        onClose={() => setShowExistingJsonDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PasteIcon sx={{ color: '#f59e0b' }} />
          <Typography variant="h6">Existing Policy JSON Detected</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            A valid Policy JSON was found in your clipboard. Would you like to use it, or start fresh with the Policy Builder?
          </Typography>
          <Paper sx={{ 
            p: 2, 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            maxHeight: 200,
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'pre-wrap' }}>
              {existingClipboardJson?.substring(0, 500)}
              {existingClipboardJson && existingClipboardJson.length > 500 && '...'}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setShowExistingJsonDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={handleClearClipboardAndStartFresh}
            sx={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
          >
            Clear & Start Fresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={handleUseExistingJson}
            sx={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
              }
            }}
          >
            Use This JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  /**
   * Step 2: Policy Details + JSON preview (FLOATING DIALOG content)
   */
  const renderStep2 = () => {
    const updatedJson = getUpdatedJson();
    const versionInfo = POLICY_VERSION_INFO[version];
    const dataTypeInfo = dataType ? DATA_TYPE_INFO[dataType as PolicyDataType] : { label: 'Not selected', color: '#9ca3af' };

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
            sx={{ backgroundColor: 'rgba(96, 165, 250, 0.1)', mt: 2 }}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              Connector Version
            </Typography>
            {detectedPolicyVersion && (
              <Chip
                label={`Detected: ${detectedPolicyVersion === 'saturn' ? 'Saturn' : 'Jupiter'}`}
                size="small"
                sx={{
                  height: 22,
                  backgroundColor: detectedPolicyVersion === 'saturn' 
                    ? 'rgba(245, 158, 11, 0.15)' 
                    : 'rgba(139, 92, 246, 0.15)',
                  border: `1px solid ${detectedPolicyVersion === 'saturn' 
                    ? 'rgba(245, 158, 11, 0.3)' 
                    : 'rgba(139, 92, 246, 0.3)'}`,
                  color: detectedPolicyVersion === 'saturn' ? '#f59e0b' : '#8b5cf6',
                  '& .MuiChip-label': {
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    px: 0.75
                  }
                }}
              />
            )}
          </Box>
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
        <FormControl fullWidth required>
          <InputLabel>Data Type</InputLabel>
          <Select
            value={dataType}
            label="Data Type"
            onChange={(e) => setDataType(e.target.value as PolicyDataType | '')}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <MenuItem value="">
              <Typography sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Select Data Type...
              </Typography>
            </MenuItem>
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

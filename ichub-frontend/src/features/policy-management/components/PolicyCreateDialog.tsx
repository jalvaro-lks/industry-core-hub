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
  Tooltip,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  Upload as UploadIcon,
  Code as CodeIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
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

const steps = ['Policy Details', 'Configure JSON', 'Review'];

/**
 * Dialog for creating or editing policies
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
  const [jsonTab, setJsonTab] = useState<'paste' | 'upload'>('paste');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState<PolicyVersion>('jupiter');
  const [type, setType] = useState<PolicyType>('access');
  const [dataType, setDataType] = useState<PolicyDataType>('catalog-parts');
  const [policyJson, setPolicyJson] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Reset form when dialog opens/closes or edit policy changes
  useEffect(() => {
    if (open) {
      if (editPolicy) {
        setName(editPolicy.name);
        setDescription(editPolicy.description || '');
        setVersion(editPolicy.version);
        setType(editPolicy.type);
        setDataType(editPolicy.dataType);
        setPolicyJson(JSON.stringify(editPolicy.policyJson, null, 2));
        setTags(editPolicy.tags || []);
      } else {
        resetForm();
      }
      setActiveStep(0);
      setJsonError(null);
    }
  }, [open, editPolicy]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setVersion('jupiter');
    setType('access');
    setDataType('catalog-parts');
    setPolicyJson('');
    setTags([]);
    setTagInput('');
  };

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
    } catch (e) {
      setJsonError('Invalid JSON format. Please check your input.');
      return false;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate step 1
      if (!name.trim()) {
        return;
      }
    } else if (activeStep === 1) {
      // Validate JSON
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPolicyJson(content);
        try {
          JSON.parse(content);
          setJsonError(null);
        } catch {
          setJsonError('Invalid JSON in uploaded file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateJson()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        version,
        type,
        dataType,
        status: editPolicy?.status || 'draft',
        policyJson: JSON.parse(policyJson),
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

  const isStep1Valid = name.trim().length > 0;
  const isStep2Valid = policyJson.trim().length > 0 && !jsonError;

  const renderStep1 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Version Selector - Prominent */}
      <Paper
        sx={{
          p: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
          Policy Version (Connector Compatibility)
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

      {/* Name & Description */}
      <TextField
        label="Policy Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
        placeholder="e.g., Default Catalog Access Policy"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      />

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

      {/* Policy Type & Data Type */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Policy Type</InputLabel>
          <Select
            value={type}
            label="Policy Type"
            onChange={(e) => setType(e.target.value as PolicyType)}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <MenuItem value="access">Access Policy</MenuItem>
            <MenuItem value="usage">Usage Policy</MenuItem>
          </Select>
        </FormControl>

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
      </Box>

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
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}>
        <Typography variant="body2">
          Paste or upload the policy JSON definition. This should be generated from a policy editor or provided by your administrator.
        </Typography>
      </Alert>

      <Tabs
        value={jsonTab}
        onChange={(_, newValue) => setJsonTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          value="paste"
          label="Paste JSON"
          icon={<CodeIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
        />
        <Tab
          value="upload"
          label="Upload File"
          icon={<UploadIcon sx={{ fontSize: 18 }} />}
          iconPosition="start"
        />
      </Tabs>

      {jsonTab === 'paste' ? (
        <TextField
          multiline
          rows={15}
          value={policyJson}
          onChange={(e) => {
            setPolicyJson(e.target.value);
            setJsonError(null);
          }}
          placeholder={`{
  "@context": {
    "odrl": "http://www.w3.org/ns/odrl/2/"
  },
  "@type": "odrl:Set",
  "odrl:permission": [{
    "odrl:action": "USE",
    "odrl:constraint": [{
      "odrl:leftOperand": "BusinessPartnerNumber",
      "odrl:operator": "eq",
      "odrl:rightOperand": "BPNL00000003CRHK"
    }]
  }]
}`}
          error={!!jsonError}
          helperText={jsonError}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }
          }}
        />
      ) : (
        <Paper
          sx={{
            p: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="json-file-upload"
          />
          <label htmlFor="json-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              sx={{ mb: 2 }}
            >
              Select JSON File
            </Button>
          </label>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            or drag and drop a .json file here
          </Typography>
          {policyJson && !jsonError && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CheckIcon sx={{ color: 'success.main' }} />
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                JSON loaded successfully
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );

  const renderStep3 = () => {
    const versionInfo = POLICY_VERSION_INFO[version];
    const dataTypeInfo = DATA_TYPE_INFO[dataType];

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Alert severity="success" sx={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          Review your policy configuration before creating it.
        </Alert>

        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 2 }}>
            Policy Summary
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Name</Typography>
              <Typography variant="body1">{name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Version</Typography>
              <Chip
                label={versionInfo.label}
                size="small"
                sx={{
                  backgroundColor: alpha(versionInfo.color, 0.15),
                  color: versionInfo.color,
                  ml: 1
                }}
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Type</Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{type}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Data Type</Typography>
              <Chip
                label={dataTypeInfo.label}
                size="small"
                sx={{
                  backgroundColor: alpha(dataTypeInfo.color, 0.15),
                  color: dataTypeInfo.color,
                  ml: 1
                }}
              />
            </Box>
          </Box>

          {description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Description</Typography>
              <Typography variant="body2">{description}</Typography>
            </Box>
          )}

          {tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Policy JSON Preview
          </Typography>
          <Box
            sx={{
              maxHeight: 200,
              overflow: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 1,
              p: 1.5
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#e2e8f0' }}>
              {policyJson}
            </pre>
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1e1e1e',
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          minHeight: '70vh',
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
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          pb: 2,
          mb: 2
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editPolicy ? 'Edit Policy' : 'Create New Policy'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {editPolicy ? 'Modify your policy configuration' : 'Define a new policy for your dataspace resources'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && renderStep1()}
        {activeStep === 1 && renderStep2()}
        {activeStep === 2 && renderStep3()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 0 && !isStep1Valid || activeStep === 1 && !isStep2Valid}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
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
      </DialogActions>
    </Dialog>
  );
};

export default PolicyCreateDialog;

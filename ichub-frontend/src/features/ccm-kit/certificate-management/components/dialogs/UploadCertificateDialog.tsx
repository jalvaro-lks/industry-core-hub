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

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid2,
  Typography,
  Box,
  SelectChangeEvent,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { CertificateFormData, UploadCertificateDialogProps } from '../../types/dialog-types';
import { certificateManagementConfig } from '../../config';
import { PartnerAutocomplete } from '@/features/business-partner-kit/partner-management/components';
import { PartnerInstance } from '@/features/business-partner-kit/partner-management/types/types';
import { fetchPartners } from '@/features/business-partner-kit/partner-management/api';

const initialFormData: CertificateFormData = {
  name: '',
  type: '',
  bpn: '',
  issuer: '',
  validFrom: '',
  validUntil: '',
  certificateIdentifier: '',
  certificateScope: 'BPNL',
  enclosedSitesBpn: [],
  description: '',
  document: undefined,
};

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export const UploadCertificateDialog = ({
  open,
  onClose,
  onSave,
  certificateData
}: UploadCertificateDialogProps) => {
  const [formData, setFormData] = useState<CertificateFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CertificateFormData | 'document', string>>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Text currently typed in the BPNS chip input before pressing Enter */
  const [bpnsInputValue, setBpnsInputValue] = useState('');
  const [bpnsInputError, setBpnsInputError] = useState<string | null>(null);
  
  // Partner autocomplete state
  const [partnersList, setPartnersList] = useState<PartnerInstance[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerInstance | null>(null);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [partnersError, setPartnersError] = useState(false);

  const isEditing = !!certificateData;
  const [activeStep, setActiveStep] = useState(0);
  const STEPS = ['Certificate Details', 'Partner & Validity', 'Certificate File'];

  useEffect(() => {
    if (certificateData) {
      setFormData(certificateData);
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setFileError(null);
    setIsSubmitting(false);
    setSelectedPartner(null);

    // Fetch partners when dialog opens
    if (open) {
      loadPartners();
    }
  }, [certificateData, open]);

  /**
   * Load available partners from the API
   */
  const loadPartners = async () => {
    setIsLoadingPartners(true);
    setPartnersError(false);
    try {
      const data = await fetchPartners();
      setPartnersList(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartnersList([]);
      setPartnersError(true);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  /**
   * Check if all required fields are filled (for enabling submit button)
   */
  const isFormValid = useMemo(() => {
    const hasRequiredFields = 
      formData.type.trim() !== '' &&
      formData.bpn.trim() !== '' &&
      formData.name.trim() !== '' &&
      formData.issuer.trim() !== '' &&
      formData.validFrom !== '' &&
      formData.validUntil !== '';
    
    const hasValidFile = isEditing || formData.document !== undefined;
    const hasNoFileError = !fileError;
    
    return hasRequiredFields && hasValidFile && hasNoFileError;
  }, [formData, fileError, isEditing]);

  const handleChange = (field: keyof CertificateFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSelectChange = (field: keyof CertificateFormData) => (
    event: SelectChangeEvent
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);
    
    if (file) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError('Invalid file type. Please upload a PDF, PNG, or JPG file.');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File size exceeds 10MB limit.');
        return;
      }
      
      setFormData(prev => ({ ...prev, document: file }));
      if (errors.document) {
        setErrors(prev => ({ ...prev, document: undefined }));
      }
    }
  };

  /**
   * Handle drag over event for file drop zone
   */
  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle file drop event
   */
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files?.[0];
    setFileError(null);
    
    if (file) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError('Invalid file type. Please upload a PDF, PNG, or JPG file.');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setFileError('File size exceeds 10MB limit.');
        return;
      }
      
      setFormData(prev => ({ ...prev, document: file }));
      if (errors.document) {
        setErrors(prev => ({ ...prev, document: undefined }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CertificateFormData | 'document', string>> = {};

    if (!formData.type) {
      newErrors.type = 'Certificate type is required';
    }
    if (!formData.bpn.trim()) {
      newErrors.bpn = 'Partner BPNL is required';
    } else if (!certificateManagementConfig.validation.bpn.pattern.test(formData.bpn)) {
      newErrors.bpn = certificateManagementConfig.validation.bpn.errorMessage;
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Certificate name is required';
    }
    if (!formData.issuer.trim()) {
      newErrors.issuer = 'Issuer / Certification Body is required';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }
    if (!formData.validUntil) {
      newErrors.validUntil = 'Valid until date is required';
    }
    if (formData.validFrom && formData.validUntil && new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      newErrors.validUntil = 'Valid until must be after valid from';
    }
    if (!formData.document && !isEditing) {
      newErrors.document = 'Certificate file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof CertificateFormData | 'document', string>> = {};
    if (step === 0) {
      if (!formData.type) newErrors.type = 'Certificate type is required';
      if (!formData.name.trim()) newErrors.name = 'Certificate name is required';
      if (!formData.issuer.trim()) newErrors.issuer = 'Issuer / Certification Body is required';
    }
    if (step === 1) {
      if (!formData.bpn.trim()) newErrors.bpn = 'Partner BPNL is required';
      else if (!certificateManagementConfig.validation.bpn.pattern.test(formData.bpn))
        newErrors.bpn = certificateManagementConfig.validation.bpn.errorMessage;
      if (!formData.validFrom) newErrors.validFrom = 'Valid from date is required';
      if (!formData.validUntil) newErrors.validUntil = 'Valid until date is required';
      if (formData.validFrom && formData.validUntil && new Date(formData.validFrom) >= new Date(formData.validUntil))
        newErrors.validUntil = 'Valid until must be after valid from';
    }
    if (step === 2) {
      if (!formData.document && !isEditing) newErrors.document = 'Certificate file is required';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const isStepComplete = (step: number): boolean => {
    if (step === 0) return !!(formData.type && formData.name.trim() && formData.issuer.trim());
    if (step === 1) {
      const bpnValid = certificateManagementConfig.validation.bpn.pattern.test(formData.bpn);
      return !!(formData.bpn.trim() && bpnValid && formData.validFrom && formData.validUntil);
    }
    if (step === 2) return isEditing || !!formData.document;
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(2) || fileError) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // On success: close modal (parent handles snackbar + table refresh)
      setFormData(initialFormData);
      setFileError(null);
    } catch (error) {
      // Error handling - keep modal open
      console.error('Failed to upload certificate:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData(initialFormData);
    setErrors({});
    setFileError(null);
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          minWidth: { xs: '90%', sm: 640 }
        }
      }}
    >
      <DialogTitle sx={{ 
        px: 3,
        py: 2,
        pr: 6,
        backgroundColor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VerifiedUserOutlinedIcon sx={{ fontSize: 24, color: 'white' }} />
          <Box>
            <Typography variant="h6" component="span" fontWeight={600} sx={{ color: 'white', lineHeight: 1.2 }}>
              {isEditing ? 'Edit Certificate' : 'Upload Certificate'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', display: 'block' }}>
              {STEPS[activeStep]}
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleClose} 
          size="medium"
          aria-label="close"
          sx={{ 
            position: 'absolute',
            right: 12,
            top: 12,
            color: 'primary.contrastText',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: 'background.paper', px: 3, py: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0 — Certificate Details */}
        {activeStep === 0 && (
          <Grid2 container spacing={2.5}>
            <Grid2 size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescriptionOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                  Certificate Details
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={12}>
              <TextField
                select
                fullWidth
                label="Certificate Type"
                value={formData.type}
                onChange={(e) => handleSelectChange('type')(e as SelectChangeEvent)}
                error={!!errors.type}
                helperText={errors.type}
                required
              >
                {certificateManagementConfig.certificateTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid2>
            <Grid2 size={12}>
              <TextField
                fullWidth
                label="Certificate Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid2>
            <Grid2 size={12}>
              <TextField
                fullWidth
                label="Issuer / Certification Body"
                value={formData.issuer}
                onChange={handleChange('issuer')}
                error={!!errors.issuer}
                helperText={errors.issuer}
                required
              />
            </Grid2>
            <Grid2 size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description || ''}
                onChange={handleChange('description')}
                multiline
                rows={2}
                placeholder="Optional description"
              />
            </Grid2>
          </Grid2>
        )}

        {/* Step 1 — Partner & Validity */}
        {activeStep === 1 && (
          <Grid2 container spacing={2.5}>
            <Grid2 size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                  Partner & Validity
                </Typography>
              </Box>
            </Grid2>
            <Grid2 size={12}>
              <PartnerAutocomplete
                value={formData.bpn}
                availablePartners={partnersList}
                selectedPartner={selectedPartner}
                isLoadingPartners={isLoadingPartners}
                partnersError={partnersError}
                hasError={!!errors.bpn}
                label="Partner BPNL"
                placeholder="Select partner or enter BPNL"
                helperText="Select the Business Partner this certificate belongs to"
                errorMessage={errors.bpn || 'Partner BPNL is required'}
                onBpnlChange={(bpnl) => {
                  setFormData(prev => ({ ...prev, bpn: bpnl }));
                  if (errors.bpn) setErrors(prev => ({ ...prev, bpn: undefined }));
                }}
                onPartnerChange={(partner) => {
                  setSelectedPartner(partner);
                  if (partner) setFormData(prev => ({ ...prev, bpn: partner.bpnl }));
                }}
                onRetryLoadPartners={loadPartners}
              />
            </Grid2>
            <Grid2 size={6}>
              <TextField
                fullWidth
                type="date"
                label="Valid From"
                value={formData.validFrom}
                onChange={handleChange('validFrom')}
                error={!!errors.validFrom}
                helperText={errors.validFrom}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid2>
            <Grid2 size={6}>
              <TextField
                fullWidth
                type="date"
                label="Valid Until"
                value={formData.validUntil}
                onChange={handleChange('validUntil')}
                error={!!errors.validUntil}
                helperText={errors.validUntil}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid2>
            <Grid2 size={12}>
              <TextField
                fullWidth
                label="Certificate Number / ID"
                placeholder="e.g. TÜV-2024-9001-12345"
                value={formData.certificateIdentifier || ''}
                onChange={handleChange('certificateIdentifier')}
                helperText="Optional — the physical registration ID on the certificate document"
              />
            </Grid2>
            <Grid2 size={12}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  Certificate Scope
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: formData.certificateScope === 'BPNS' ? 2 : 0 }}>
                  {(['BPNL', 'BPNS'] as const).map((scope) => (
                    <Button
                      key={scope}
                      size="small"
                      variant={formData.certificateScope === scope ? 'contained' : 'outlined'}
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        certificateScope: scope,
                        enclosedSitesBpn: scope === 'BPNL' ? [] : prev.enclosedSitesBpn,
                      }))}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      {scope === 'BPNL' ? 'BPNL — Legal Entity' : 'BPNS — Specific Sites'}
                    </Button>
                  ))}
                </Box>
                {formData.certificateScope === 'BPNS' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Type a BPN-S value and press Enter to add it as a tag.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="BPNS0000000000XY"
                      value={bpnsInputValue}
                      onChange={(e) => {
                        setBpnsInputValue(e.target.value);
                        setBpnsInputError(null);
                      }}
                      error={!!bpnsInputError}
                      helperText={bpnsInputError}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = bpnsInputValue.trim().toUpperCase();
                          if (!val) return;
                          const bpnsPattern = /^BPNS[A-Z0-9]{12}$/;
                          if (!bpnsPattern.test(val)) {
                            setBpnsInputError('Invalid BPNS format. Expected: BPNS followed by 12 alphanumeric characters.');
                            return;
                          }
                          if (formData.enclosedSitesBpn.includes(val)) {
                            setBpnsInputError('This BPNS has already been added.');
                            return;
                          }
                          setFormData((prev) => ({
                            ...prev,
                            enclosedSitesBpn: [...prev.enclosedSitesBpn, val],
                          }));
                          setBpnsInputValue('');
                        }
                      }}
                    />
                    {formData.enclosedSitesBpn.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {formData.enclosedSitesBpn.map((bpns) => (
                          <Box
                            key={bpns}
                            sx={{
                              display: 'inline-flex', alignItems: 'center', gap: 0.5,
                              bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
                              borderRadius: 1, px: 1, py: 0.25, fontSize: '0.75rem', fontFamily: 'monospace',
                            }}
                          >
                            {bpns}
                            <Box
                              component="span"
                              sx={{ cursor: 'pointer', ml: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  enclosedSitesBpn: prev.enclosedSitesBpn.filter((b) => b !== bpns),
                                }))
                              }
                            >
                              ×
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Grid2>
          </Grid2>
        )}

        {/* Step 2 — Certificate File */}
        {activeStep === 2 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FileUploadOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                Certificate File {!isEditing && <span style={{ color: '#d32f2f' }}>*</span>}
              </Typography>
            </Box>
            <Box
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              sx={{
                border: (fileError || errors.document)
                  ? '2px dashed #d32f2f'
                  : '2px dashed #bbdefb',
                borderRadius: 3,
                py: 4,
                px: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                background: (fileError || errors.document)
                  ? 'linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)'
                  : 'linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%)',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: (fileError || errors.document) ? '#d32f2f' : '#90caf9',
                  background: isSubmitting
                    ? 'linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%)'
                    : 'linear-gradient(180deg, #e3f2fd 0%, #ffffff 100%)',
                  transform: isSubmitting ? 'none' : 'translateY(-2px)',
                  boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(25,118,210,0.1)',
                },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: (fileError || errors.document) ? '#ffebee' : '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                }}
              >
                <FileUploadOutlinedIcon
                  sx={{ fontSize: 28, color: (fileError || errors.document) ? '#d32f2f' : '#1976d2' }}
                />
              </Box>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }} align="center">
                {formData.document ? formData.document.name : 'Drag & drop or click to browse'}
              </Typography>
              <Typography variant="caption" color="text.secondary" align="center">
                Supported formats: PDF, PNG, JPG (max 10MB)
              </Typography>
              {(fileError || errors.document) && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 1, fontWeight: 500 }} align="center">
                  {fileError || errors.document}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: 3,
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'grey.50',
        gap: 1,
      }}>
        <Button
          onClick={activeStep === 0 ? handleClose : handleBack}
          variant="outlined"
          disabled={isSubmitting}
          sx={{ textTransform: 'none', minWidth: 100 }}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepComplete(activeStep)}
            sx={{ textTransform: 'none', minWidth: 100, fontWeight: 600 }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => void handleSubmit()}
            variant="contained"
            disabled={isSubmitting}
            sx={{ textTransform: 'none', minWidth: 120, fontWeight: 600 }}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              isEditing ? 'Save Changes' : 'Upload'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

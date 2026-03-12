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
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  alpha,
  IconButton,
  FormHelperText
} from '@mui/material';
import {
  Business,
  Inventory,
  Close,
  LinkOutlined
} from '@mui/icons-material';
import { AddSubpartFormData } from '../api/pcfRequestApi';

// PCF Green Theme
const PCF_PRIMARY = '#10b981';
const PCF_SECONDARY = '#059669';

interface AddSubpartDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddSubpartFormData) => Promise<void>;
  parentManufacturerPartId: string;
}

const AddSubpartDialog: React.FC<AddSubpartDialogProps> = ({
  open,
  onClose,
  onSubmit,
  parentManufacturerPartId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [supplierBpn, setSupplierBpn] = useState('');
  const [manufacturerPartId, setManufacturerPartId] = useState('');

  // Validation errors
  const [bpnError, setBpnError] = useState('');
  const [partIdError, setPartIdError] = useState('');

  const resetForm = () => {
    setSupplierBpn('');
    setManufacturerPartId('');
    setBpnError('');
    setPartIdError('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateBpn = (bpn: string): boolean => {
    // Basic BPN validation: BPNL or BPNS followed by 12 alphanumeric characters
    const pattern = /^BPN[LS][0-9A-Z]{12}$/;
    return pattern.test(bpn.trim());
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate BPN
    if (!supplierBpn.trim()) {
      setBpnError('Supplier BPN is required');
      isValid = false;
    } else if (!validateBpn(supplierBpn)) {
      setBpnError('Invalid BPN format. Expected: BPNL or BPNS followed by 12 alphanumeric characters');
      isValid = false;
    } else {
      setBpnError('');
    }

    // Validate Manufacturer Part ID
    if (!manufacturerPartId.trim()) {
      setPartIdError('Manufacturer Part ID is required');
      isValid = false;
    } else {
      setPartIdError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Close dialog immediately and let parent handle loading
    const formData = {
      supplierBpn: supplierBpn.trim(),
      manufacturerPartId: manufacturerPartId.trim()
    };
    
    handleClose();
    
    // Call onSubmit after closing (parent will show loading state)
    await onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          py: 2.5,
          px: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              background: alpha(PCF_PRIMARY, 0.15)
            }}
          >
            <LinkOutlined sx={{ color: PCF_PRIMARY, fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
              Add Subpart Relation
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Parent Part: <Box component="span" sx={{ fontFamily: 'monospace', color: PCF_PRIMARY }}>{parentManufacturerPartId}</Box>
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            '&:hover': { color: '#fff' }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 4 }}>
            Enter the supplier BPN and manufacturer part ID to create a subpart relation and enable PCF data requests.
          </Typography>

          {/* Two-column form layout */}
          <Box sx={{ display: 'flex', gap: 4 }}>
            {/* Supplier BPN Field */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1.5, fontWeight: 600 }}>
                Supplier BPN *
              </Typography>
            <TextField
              fullWidth
              placeholder="BPNL00000001SUPP"
              value={supplierBpn}
              onChange={(e) => {
                setSupplierBpn(e.target.value.toUpperCase());
                setBpnError('');
              }}
              error={!!bpnError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: bpnError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: bpnError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: bpnError ? '#ef4444' : PCF_PRIMARY
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  fontFamily: 'monospace',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }
              }}
            />
            {bpnError && (
              <FormHelperText sx={{ color: '#ef4444', mt: 0.5 }}>
                {bpnError}
              </FormHelperText>
            )}
            <FormHelperText sx={{ color: 'rgba(255, 255, 255, 0.4)', mt: 0.5 }}>
              Business Partner Number (BPNL or BPNS)
            </FormHelperText>
          </Box>

          {/* Manufacturer Part ID Field */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1.5, fontWeight: 600 }}>
              Manufacturer Part ID *
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter supplier's part ID"
              value={manufacturerPartId}
              onChange={(e) => {
                setManufacturerPartId(e.target.value);
                setPartIdError('');
              }}
              error={!!partIdError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Inventory sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: partIdError ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: partIdError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: partIdError ? '#ef4444' : PCF_PRIMARY
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.3)'
                  }
                }
              }}
            />
            {partIdError && (
              <FormHelperText sx={{ color: '#ef4444', mt: 0.5 }}>
                {partIdError}
              </FormHelperText>
            )}
            <FormHelperText sx={{ color: 'rgba(255, 255, 255, 0.4)', mt: 0.5 }}>
              The part ID as assigned by the supplier
            </FormHelperText>
          </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 4,
            pb: 4,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 2
          }}
        >
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'none',
              borderRadius: '12px',
              px: 4,
              fontWeight: 500,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || !supplierBpn.trim() || !manufacturerPartId.trim()}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <LinkOutlined />}
            sx={{
              background: `linear-gradient(135deg, ${PCF_PRIMARY} 0%, ${PCF_SECONDARY} 100%)`,
              textTransform: 'none',
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                background: `linear-gradient(135deg, ${PCF_SECONDARY} 0%, #047857 100%)`
              },
              '&.Mui-disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            {isSubmitting ? 'Adding...' : 'Add Subpart Relation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddSubpartDialog;

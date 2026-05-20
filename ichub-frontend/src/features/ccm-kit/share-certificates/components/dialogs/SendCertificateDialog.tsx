/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
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
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Autocomplete,
  TextField,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';

import { Certificate } from '../../../certificate-management/types/types';
import {
  shareCertificate,
  fetchAllCertificates,
} from '../../../certificate-management/api';
import { certificateManagementConfig } from '../../../certificate-management/config';
import { fetchPartners } from '@/features/business-partner-kit/partner-management/api';
import { PartnerInstance } from '@/features/business-partner-kit/partner-management/types/types';

interface SendCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Section badge ────────────────────────────────────────────────────────────
const sectionBadge = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  backgroundColor: 'primary.main',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#fff',
  flexShrink: 0,
};

export const SendCertificateDialog = ({
  open,
  onClose,
  onSuccess,
}: SendCertificateDialogProps) => {
  const [certId, setCertId] = useState('');
  const [bpnInput, setBpnInput] = useState('');
  const [bpnError, setBpnError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerInstance | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [partners, setPartners] = useState<PartnerInstance[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) {
      setLoadingData(true);
      Promise.all([fetchAllCertificates(), fetchPartners()])
        .then(([certs, p]) => {
          setCertificates(certs.filter((c) => c.status !== 'expired'));
          setPartners(p);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [open]);

  const handleClose = () => {
    setCertId('');
    setBpnInput('');
    setBpnError(null);
    setSelectedPartner(null);
    onClose();
  };

  const handleSubmit = async () => {
    const bpn = bpnInput.trim().toUpperCase();
    if (!certificateManagementConfig.validation.bpn.pattern.test(bpn)) {
      setBpnError(certificateManagementConfig.validation.bpn.errorMessage);
      return;
    }
    setIsSending(true);
    try {
      await shareCertificate(certId, bpn, 'PUSH');
      setSnackbar({
        open: true,
        message: 'Certificate sent to partner successfully.',
        severity: 'success',
      });
      onSuccess();
      handleClose();
    } catch {
      setSnackbar({ open: true, message: 'Failed to send certificate.', severity: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            px: 3,
            py: 2,
            pr: 6,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SendIcon sx={{ fontSize: 22, color: 'inherit' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'inherit', lineHeight: 1.2 }}>
                Send Certificate
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Push a certificate to a Catena-X partner via EDC notification
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="medium"
            onClick={handleClose}
            aria-label="close"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'primary.contrastText',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ backgroundColor: 'background.paper', p: 0 }}>
          {loadingData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <Box>
              {/* Section 1 — Certificate */}
              <Box sx={{ px: 4, pt: 3, pb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box sx={sectionBadge}>1</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Certificate to send
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, pl: 5 }}>
                  Select a valid certificate from your portfolio to share with the partner.
                </Typography>
                <TextField
                  size="small"
                  select
                  label="Certificate"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: !!certId }}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: { sx: { maxHeight: 300 } },
                      anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                      transformOrigin: { vertical: 'top', horizontal: 'left' },
                    },
                  }}
                >
                  {certificates.length === 0 ? (
                    <MenuItem value="" disabled>
                      No certificates available
                    </MenuItem>
                  ) : (
                    certificates.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {c.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {c.type} · Until{' '}
                            {new Date(c.validUntil).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Box>

              <Divider sx={{ mx: 4 }} />

              {/* Section 2 — Recipient */}
              <Box sx={{ px: 4, pt: 2.5, pb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box sx={sectionBadge}>2</Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Recipient partner
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, pl: 5 }}>
                  Enter the partner BPN directly or select from your contact list.
                </Typography>
                <Autocomplete
                  freeSolo
                  options={partners}
                  value={selectedPartner}
                  inputValue={bpnInput}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.bpnl
                  }
                  onInputChange={(_, value) => {
                    setBpnInput(value);
                    setBpnError(null);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string') {
                      setSelectedPartner(value);
                      setBpnInput(value.bpnl);
                    } else {
                      setSelectedPartner(null);
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.bpnl}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {option.bpnl}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="Partner BPN"
                      placeholder="BPNL0000000000XX or select from contacts"
                      error={!!bpnError}
                      helperText={bpnError}
                    />
                  )}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'grey.50',
            gap: 1,
          }}
        >
          <Button onClick={handleClose} variant="outlined" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={isSending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            disabled={!certId || !bpnInput.trim() || isSending}
            onClick={() => void handleSubmit()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

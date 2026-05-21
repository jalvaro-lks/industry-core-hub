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

import {
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Certificate } from '../../types/types';
import { certificateManagementConfig } from '../../config';

interface CertificateCardGridProps {
  certificates: Certificate[];
  onView: (certificate: Certificate) => void;
  onShare: (certificate: Certificate) => void;
  onUpdate: (certificate: Certificate) => void;
  onDelete: (certificate: Certificate) => void;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const getStatusColor = (status: string) => {
  const config =
    certificateManagementConfig.statusConfig[
      status as keyof typeof certificateManagementConfig.statusConfig
    ];
  return config?.color || '#888';
};

const getCertificateTypeLabel = (type: string) => {
  return certificateManagementConfig.certificateTypes.find((t) => t.value === type)?.label ?? type;
};

export const CertificateCardGrid = ({
  certificates,
  onView,
  onShare,
  onUpdate,
  onDelete,
}: CertificateCardGridProps) => {

  if (certificates.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
          No certificates found. Upload a certificate to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 2.5,
      }}
    >
      {certificates.map((cert) => {
        const statusColor = getStatusColor(cert.status);
        const hasPdf = !!(cert.documentBase64 || cert.documentUrl);

        return (
          <Box
            key={cert.id}
            onClick={() => onView(cert)}
            sx={{
              borderRadius: '12px',
              border: `1px solid ${statusColor}33`,
              borderTop: `3px solid ${statusColor}`,
              backgroundColor: 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 32px ${statusColor}28`,
                backgroundColor: 'rgba(255,255,255,0.07)',
                borderColor: `${statusColor}66`,
              },
            }}
          >
            {/* ── Card Header ── */}
            <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={cert.status}
                size="small"
                sx={{
                  backgroundColor: `${statusColor}22`,
                  color: statusColor,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  border: `1px solid ${statusColor}44`,
                  fontSize: '0.68rem',
                  height: 22,
                }}
              />
              <Chip
                label={getCertificateTypeLabel(cert.type)}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.7)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  height: 22,
                }}
              />
              {hasPdf && (
                <Tooltip title="PDF attached">
                  <PictureAsPdfIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', ml: 'auto' }} />
                </Tooltip>
              )}
            </Box>

            {/* ── Card Content ── */}
            <Box sx={{ px: 2, pb: 1.5, flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.35,
                }}
              >
                {cert.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    Issuer
                  </Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {cert.issuer}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                    Valid Until
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: cert.status === 'expired' ? '#f44336' : cert.status === 'expiring' ? '#ed8936' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {formatDate(cert.validUntil)}
                  </Typography>
                </Box>
              </Box>

              {cert.sharedCount > 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                  Shared with {cert.sharedCount} partner{cert.sharedCount > 1 ? 's' : ''}
                </Typography>
              )}
            </Box>

            {/* ── Card Footer ── */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1,
                gap: 0.75,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 100%)',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShareIcon sx={{ fontSize: 13 }} />}
                disabled={cert.status === 'expired'}
                onClick={(e) => { e.stopPropagation(); onShare(cert); }}
                sx={{ textTransform: 'none', fontSize: '0.7rem', py: '3px', flex: 1, borderColor: 'rgba(100,181,246,0.4)', color: '#64b5f6', '&:hover': { borderColor: '#64b5f6', backgroundColor: 'rgba(100,181,246,0.1)' }, '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' } }}
              >
                Share
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
                onClick={(e) => { e.stopPropagation(); onUpdate(cert); }}
                sx={{ textTransform: 'none', fontSize: '0.7rem', py: '3px', flex: 1, borderColor: 'rgba(129,199,132,0.4)', color: '#81c784', '&:hover': { borderColor: '#81c784', backgroundColor: 'rgba(129,199,132,0.1)' } }}
              >
                Update
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DeleteOutlineIcon sx={{ fontSize: 13 }} />}
                onClick={(e) => { e.stopPropagation(); onDelete(cert); }}
                sx={{ textTransform: 'none', fontSize: '0.7rem', py: '3px', flex: 1, borderColor: 'rgba(239,154,154,0.4)', color: '#ef9a9a', '&:hover': { borderColor: '#ef9a9a', backgroundColor: 'rgba(239,154,154,0.1)' } }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

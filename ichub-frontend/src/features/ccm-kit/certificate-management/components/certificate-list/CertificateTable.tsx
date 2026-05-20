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

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Typography,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SyncIcon from '@mui/icons-material/Sync';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Certificate, DtrStatus } from '../../types/types';
import { certificateManagementConfig } from '../../config';
import { registerCertificateInDtr } from '../../api';

interface CertificateTableProps {
  certificates: Certificate[];
  onView: (certificate: Certificate) => void;
  onShare: (certificate: Certificate) => void;
  onDelete: (certificate: Certificate) => void;
  /** Called after a successful DTR registration so parent can reload data */
  onRefresh?: () => void;
}

export const CertificateTable = ({
  certificates,
  onView,
  onShare,
  onDelete,
  onRefresh,
}: CertificateTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [registeringIds, setRegisteringIds] = useState<Set<string>>(new Set());
  /** Row action menu anchor */
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; cert: Certificate } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(
    () => certificates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [certificates, page, rowsPerPage]
  );

  const getCertificateTypeLabel = (type: string) => {
    const typeConfig = certificateManagementConfig.certificateTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  /** Abbreviated type label for the Chip (e.g. "ISO 9001" → "9001") */
  const getCertificateTypeShort = (type: string) => {
    const map: Record<string, string> = {
      ISO9001: '9001',
      ISO14001: '14001',
      ISO45001: '45001',
      IATF16949: 'IATF',
      ISO27001: '27001',
      OTHER: 'Other',
    };
    return map[type] ?? type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const config = certificateManagementConfig.statusConfig[status as keyof typeof certificateManagementConfig.statusConfig];
    return config?.color || '#888';
  };

  const renderDtrStatus = (dtrStatus: DtrStatus) => {
    if (dtrStatus === 'registered') {
      return (
        <Tooltip title="Registered in DTR">
          <CloudDoneIcon sx={{ color: 'success.main', fontSize: 20 }} />
        </Tooltip>
      );
    }
    if (dtrStatus === 'pending') {
      return (
        <Tooltip title="DTR registration pending">
          <SyncIcon sx={{ color: 'warning.main', fontSize: 20 }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Not registered in DTR">
        <CloudOffIcon sx={{ color: 'rgba(255,255,255,0.28)', fontSize: 20 }} />
      </Tooltip>
    );
  };

  const handleRegisterInDtr = async (certificate: Certificate) => {
    setMenuAnchor(null);
    setRegisteringIds((prev) => new Set(prev).add(certificate.id));
    try {
      await registerCertificateInDtr(certificate.id);
      setSnackbar({ open: true, message: `"${certificate.name}" registered in DTR successfully.`, severity: 'success' });
      onRefresh?.();
    } catch {
      setSnackbar({ open: true, message: 'Failed to register certificate in DTR.', severity: 'error' });
    } finally {
      setRegisteringIds((prev) => {
        const next = new Set(prev);
        next.delete(certificate.id);
        return next;
      });
    }
  };

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
    <>
      <TableContainer sx={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.95) 100%)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              {(['Certificate', 'Type', 'Issuer', 'Valid Until', 'Status'] as const).map((label) => (
                <TableCell key={label} sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{label}</TableCell>
              ))}
              <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>DTR</TableCell>
              <TableCell align="center" sx={{ width: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((certificate) => {
              const statusColor = getStatusColor(certificate.status);
              const isRegistering = registeringIds.has(certificate.id);
              return (
                <TableRow
                  key={certificate.id}
                  onClick={() => onView(certificate)}
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { border: 0 },
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                  }}
                >
                  {/* Name + cert ID */}
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Tooltip title={certificate.bpn} placement="top">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.87)' }}>
                        {certificate.name}
                      </Typography>
                    </Tooltip>
                    {certificate.certificateIdentifier && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', color: 'rgba(255,255,255,0.4)' }}>
                        {certificate.certificateIdentifier}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Type chip */}
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Tooltip title={getCertificateTypeLabel(certificate.type)}>
                      <Chip
                        label={getCertificateTypeShort(certificate.type)}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          color: 'rgba(255,255,255,0.7)',
                          borderColor: 'rgba(255,255,255,0.18)',
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.18)',
                        }}
                      />
                    </Tooltip>
                  </TableCell>

                  {/* Issuer */}
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{certificate.issuer}</Typography>
                  </TableCell>

                  {/* Valid Until — colored when near expiry */}
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: certificate.status === 'expired'
                          ? '#f44336'
                          : certificate.status === 'expiring'
                          ? '#ed8936'
                          : 'rgba(255,255,255,0.87)',
                        fontWeight: certificate.status !== 'valid' ? 500 : undefined,
                      }}
                    >
                      {formatDate(certificate.validUntil)}
                    </Typography>
                  </TableCell>

                  {/* Status chip */}
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Chip
                      label={certificate.status}
                      size="small"
                      sx={{
                        backgroundColor: `${statusColor}22`,
                        color: statusColor,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        border: `1px solid ${statusColor}44`,
                      }}
                    />
                  </TableCell>

                  {/* DTR icon */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {isRegistering ? (
                      <CircularProgress size={16} />
                    ) : (
                      renderDtrStatus(certificate.dtrStatus)
                    )}
                  </TableCell>

                  {/* ⋮ Action menu */}
                  <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'rgba(255,255,255,0.85)' } }}
                      onClick={(e) => { e.stopPropagation(); setMenuAnchor({ el: e.currentTarget, cert: certificate }); }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={certificates.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            '& .MuiTablePagination-selectIcon': { color: 'rgba(255,255,255,0.5)' },
            '& .MuiTablePagination-select': { color: 'rgba(255,255,255,0.8)' },
            '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.6)' },
            '& .MuiIconButton-root.Mui-disabled': { color: 'rgba(255,255,255,0.2)' },
          }}
        />
      </TableContainer>

      {/* Row action menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d35',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            minWidth: 180,
            '& .MuiMenuItem-root': {
              color: 'rgba(255,255,255,0.87)',
              fontSize: '0.875rem',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
            },
            '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.55)' },
            '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.87)' },
          },
        }}
      >
        <MenuItem
          disabled={menuAnchor?.cert.status === 'expired'}
          onClick={() => {
            if (menuAnchor) { onShare(menuAnchor.cert); setMenuAnchor(null); }
          }}
        >
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <MenuItem
          disabled={
            !menuAnchor ||
            menuAnchor.cert.dtrStatus === 'registered' ||
            registeringIds.has(menuAnchor.cert.id)
          }
          onClick={() => menuAnchor && handleRegisterInDtr(menuAnchor.cert)}
        >
          <ListItemIcon>
            {menuAnchor && registeringIds.has(menuAnchor.cert.id) ? (
              <CircularProgress size={16} />
            ) : (
              <CloudDoneIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>Register in DTR</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            if (menuAnchor) { onDelete(menuAnchor.cert); setMenuAnchor(null); }
          }}
        >
          <ListItemIcon><DeleteOutlineIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

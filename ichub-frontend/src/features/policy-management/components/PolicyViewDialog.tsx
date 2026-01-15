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

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  Paper,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  Policy,
  DATA_TYPE_INFO,
  POLICY_VERSION_INFO
} from '../types/types';

interface PolicyViewDialogProps {
  open: boolean;
  onClose: () => void;
  policy: Policy | null;
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

/**
 * Dialog for viewing policy details
 */
const PolicyViewDialog: React.FC<PolicyViewDialogProps> = ({
  open,
  onClose,
  policy,
  onEdit,
  onDelete
}) => {
  if (!policy) return null;

  const dataTypeInfo = DATA_TYPE_INFO[policy.dataType];
  const versionInfo = POLICY_VERSION_INFO[policy.version];

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(policy.policyJson, null, 2));
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' };
      case 'inactive':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'draft':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.3)' };
    }
  };

  const statusColors = getStatusColor(policy.status);

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
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          pb: 2,
          mb: 2
        }}
      >
        <Box sx={{ flex: 1, pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {policy.name}
            </Typography>
            <Chip
              label={policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
              size="small"
              sx={{
                backgroundColor: statusColors.bg,
                color: statusColors.color,
                borderColor: statusColors.border,
                border: '1px solid',
                fontWeight: 500
              }}
            />
          </Box>
          {policy.description && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {policy.description}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3 }}>
        {/* Metadata Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mb: 3 }}>
          {/* Version */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: alpha(versionInfo.color, 0.1),
              border: `1px solid ${alpha(versionInfo.color, 0.3)}`
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Policy Version
            </Typography>
            <Typography variant="h6" sx={{ color: versionInfo.color, fontWeight: 600 }}>
              {versionInfo.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {versionInfo.description}
            </Typography>
          </Paper>

          {/* Policy Type */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: policy.type === 'access' 
                ? 'rgba(96, 165, 250, 0.1)' 
                : 'rgba(251, 146, 60, 0.1)',
              border: `1px solid ${policy.type === 'access' 
                ? 'rgba(96, 165, 250, 0.3)' 
                : 'rgba(251, 146, 60, 0.3)'}`
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Policy Type
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {policy.type === 'access' 
                ? <LockOpenIcon sx={{ color: '#60a5fa' }} /> 
                : <LockIcon sx={{ color: '#fb923c' }} />}
              <Typography 
                variant="h6" 
                sx={{ 
                  color: policy.type === 'access' ? '#60a5fa' : '#fb923c',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}
              >
                {policy.type} Policy
              </Typography>
            </Box>
          </Paper>

          {/* Data Type */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: alpha(dataTypeInfo.color, 0.1),
              border: `1px solid ${alpha(dataTypeInfo.color, 0.3)}`
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
              Applies To
            </Typography>
            <Typography variant="h6" sx={{ color: dataTypeInfo.color, fontWeight: 600 }}>
              {dataTypeInfo.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {dataTypeInfo.description}
            </Typography>
          </Paper>

          {/* Timestamps */}
          <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              Timeline
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  Created: {new Date(policy.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              {policy.createdBy && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    By: {policy.createdBy}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Tags */}
        {policy.tags && policy.tags.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {policy.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: 'text.primary',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Policy JSON */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Policy Definition (JSON)
            </Typography>
            <Tooltip title="Copy JSON to clipboard">
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyJson}
              >
                Copy JSON
              </Button>
            </Tooltip>
          </Box>
          <Paper
            sx={{
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <pre style={{ margin: 0, fontSize: '0.8rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(policy.policyJson, null, 2)}
            </pre>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)', gap: 1 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(policy)}
        >
          Delete
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(policy)}
        >
          Edit Policy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PolicyViewDialog;

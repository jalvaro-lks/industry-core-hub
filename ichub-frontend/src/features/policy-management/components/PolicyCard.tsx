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
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Badge as BadgeIcon,
  Inventory as InventoryIcon,
  Public as PublicIcon,
  EnergySavingsLeaf as EnergySavingsLeafIcon,
  Timeline as TimelineIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { Policy, PolicyDataType, DATA_TYPE_INFO, POLICY_VERSION_INFO } from '../types/types';

interface PolicyCardProps {
  policy: Policy;
  viewMode?: 'grid' | 'list';
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
  onView: (policy: Policy) => void;
  onDuplicate: (policy: Policy) => void;
}

/**
 * Get the icon component for a data type
 */
const getDataTypeIcon = (dataType: PolicyDataType): React.ReactElement => {
  const iconMap: Record<PolicyDataType, React.ReactElement> = {
    'digital-product-passport': <BadgeIcon />,
    'part-type-information': <InventoryIcon />,
    'us-tariff': <PublicIcon />,
    'pcf': <EnergySavingsLeafIcon />,
    'traceability': <TimelineIcon />,
    'other': <MoreHorizIcon />
  };
  return iconMap[dataType] || <MoreHorizIcon />;
};

/**
 * PolicyCard component - displays a single policy in a card format
 */
const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  viewMode = 'grid',
  onEdit,
  onDelete,
  onView,
  onDuplicate
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(policy);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(policy);
  };

  const handleDuplicate = () => {
    handleMenuClose();
    onDuplicate(policy);
  };

  // Fallback for legacy data types that may no longer exist
  const dataTypeInfo = DATA_TYPE_INFO[policy.dataType] || {
    label: policy.dataType,
    color: '#9ca3af',
    description: 'Unknown data type'
  };
  const versionInfo = POLICY_VERSION_INFO[policy.version] || {
    label: policy.version,
    color: '#9ca3af'
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

  // List view - horizontal layout
  if (viewMode === 'list') {
    return (
      <Card
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 1.5,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: alpha(dataTypeInfo.color, 0.5),
            boxShadow: `0 4px 16px ${alpha(dataTypeInfo.color, 0.15)}`
          }
        }}
        onClick={() => onView(policy)}
      >
        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Icon */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                backgroundColor: alpha(dataTypeInfo.color, 0.15),
                border: `1px solid ${alpha(dataTypeInfo.color, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dataTypeInfo.color,
                flexShrink: 0
              }}
            >
              {getDataTypeIcon(policy.dataType)}
            </Box>

            {/* Name & Data Type */}
            <Box sx={{ minWidth: 180, maxWidth: 220, flexShrink: 0 }}>
              <Tooltip title={policy.name}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {policy.name}
                </Typography>
              </Tooltip>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {dataTypeInfo.label}
              </Typography>
            </Box>

            {/* Description */}
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block'
                }}
              >
                {policy.description || '—'}
              </Typography>
            </Box>

            {/* Chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Tooltip title={policy.type === 'access' ? 'Access Policy' : 'Usage Policy'}>
                <Chip
                  icon={policy.type === 'access' ? <LockOpenIcon sx={{ fontSize: 14 }} /> : <LockIcon sx={{ fontSize: 14 }} />}
                  label={policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: policy.type === 'access' 
                      ? 'rgba(96, 165, 250, 0.15)' 
                      : 'rgba(251, 146, 60, 0.15)',
                    color: policy.type === 'access' ? '#60a5fa' : '#fb923c',
                    borderColor: policy.type === 'access' 
                      ? 'rgba(96, 165, 250, 0.3)' 
                      : 'rgba(251, 146, 60, 0.3)',
                    border: '1px solid',
                    '& .MuiChip-icon': { color: 'inherit' },
                    '& .MuiChip-label': { fontSize: '0.75rem' }
                  }}
                />
              </Tooltip>

              <Tooltip title={`Connector Version: ${versionInfo.label}`}>
                <Chip
                  label={versionInfo.label}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: alpha(versionInfo.color, 0.15),
                    color: versionInfo.color,
                    borderColor: alpha(versionInfo.color, 0.3),
                    border: '1px solid',
                    fontWeight: 600,
                    '& .MuiChip-label': { fontSize: '0.75rem' }
                  }}
                />
              </Tooltip>

              <Tooltip title={`Status: ${policy.status}`}>
                <Chip
                  label={policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: statusColors.bg,
                    color: statusColors.color,
                    borderColor: statusColors.border,
                    border: '1px solid',
                    fontWeight: 500,
                    '& .MuiChip-label': { fontSize: '0.75rem' }
                  }}
                />
              </Tooltip>
            </Box>

            {/* Date */}
            <Tooltip title={`Last updated: ${new Date(policy.updatedAt).toLocaleString()}`}>
              <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0, minWidth: 80 }}>
                {new Date(policy.updatedAt).toLocaleDateString()}
              </Typography>
            </Tooltip>

            {/* Actions */}
            <Tooltip title="More actions">
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{
                  color: 'text.secondary',
                  flexShrink: 0,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              minWidth: 180
            }
          }}
        >
          <MenuItem onClick={() => { handleMenuClose(); onView(policy); }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDuplicate}>
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" sx={{ color: 'primary.main' }} />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Card>
    );
  }

  // Grid view - vertical card layout (default)
  return (
    <Card
      sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderColor: alpha(dataTypeInfo.color, 0.5),
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(dataTypeInfo.color, 0.2)}`
        }
      }}
      onClick={() => onView(policy)}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                backgroundColor: alpha(dataTypeInfo.color, 0.15),
                border: `1px solid ${alpha(dataTypeInfo.color, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dataTypeInfo.color
              }}
            >
              {getDataTypeIcon(policy.dataType)}
            </Box>
            <Box>
              <Tooltip title={policy.name}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: '#ffffff',
                    lineHeight: 1.3,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {policy.name}
                </Typography>
              </Tooltip>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {dataTypeInfo.label}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="More actions">
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Description */}
        {policy.description && (
          <Tooltip title={policy.description}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                minHeight: '3em'
              }}
            >
              {policy.description}
            </Typography>
          </Tooltip>
        )}

        {/* Chips Row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {/* Policy Type */}
          <Tooltip title={policy.type === 'access' ? 'Access Policy' : 'Usage Policy'}>
            <Chip
              icon={policy.type === 'access' ? <LockOpenIcon sx={{ fontSize: 16 }} /> : <LockIcon sx={{ fontSize: 16 }} />}
              label={policy.type.charAt(0).toUpperCase() + policy.type.slice(1)}
              size="small"
              sx={{
                backgroundColor: policy.type === 'access' 
                  ? 'rgba(96, 165, 250, 0.15)' 
                  : 'rgba(251, 146, 60, 0.15)',
                color: policy.type === 'access' ? '#60a5fa' : '#fb923c',
                borderColor: policy.type === 'access' 
                  ? 'rgba(96, 165, 250, 0.3)' 
                  : 'rgba(251, 146, 60, 0.3)',
                border: '1px solid',
                '& .MuiChip-icon': {
                  color: 'inherit'
                }
              }}
            />
          </Tooltip>

          {/* Version */}
          <Tooltip title={`Connector Version: ${versionInfo.label}`}>
            <Chip
              label={versionInfo.label}
              size="small"
              sx={{
                backgroundColor: alpha(versionInfo.color, 0.15),
                color: versionInfo.color,
                borderColor: alpha(versionInfo.color, 0.3),
                border: '1px solid',
                fontWeight: 600
              }}
            />
          </Tooltip>

          {/* Status */}
          <Tooltip title={`Status: ${policy.status}`}>
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
          </Tooltip>
        </Box>

        {/* Tags */}
        {policy.tags && policy.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {policy.tags.slice(0, 3).map((tag, index) => (
              <Tooltip key={index} title={`Tag: ${tag}`}>
                <Chip
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    color: 'text.secondary',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              </Tooltip>
            ))}
            {policy.tags.length > 3 && (
              <Tooltip title={`${policy.tags.length - 3} more tags`}>
                <Chip
                  label={`+${policy.tags.length - 3}`}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'text.secondary'
                  }}
                />
              </Tooltip>
            )}
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Tooltip title={`Last updated: ${new Date(policy.updatedAt).toLocaleString()}`}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Updated: {new Date(policy.updatedAt).toLocaleDateString()}
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            minWidth: 180
          }
        }}
      >
        <MenuItem onClick={() => { handleMenuClose(); onView(policy); }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default PolicyCard;

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

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  alpha,
  Button
} from '@mui/material';
import {
  SettingsInputComponent as ConnectorIcon,
  CloudSync as DataPlaneIcon,
  AccountTree as DtrIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  MoreVert as MoreIcon,
  CheckCircle as ConnectedIcon,
  Cancel as DisconnectedIcon,
  Error as ErrorIcon,
  HelpOutline as UnknownIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Star as ActiveIcon,
  StarBorder as InactiveIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon
} from '@mui/icons-material';
import { 
  SystemConfig, 
  SystemType, 
  ConnectionStatus,
  SYSTEM_TYPE_METADATA,
  CONNECTOR_VERSIONS,
  ConnectorConfig
} from '../../types';

interface SystemCardProps {
  system: SystemConfig;
  onSetActive: (systemId: string) => void;
  onRemove: (systemId: string) => void;
  onEdit: (system: SystemConfig) => void;
  onCheckConnection: (systemId: string) => Promise<void>;
  onToggleLink: (systemId: string) => Promise<void>;
  isCheckingConnection?: boolean;
}

/**
 * Get icon component for system type
 */
const getSystemIcon = (type: SystemType): React.ReactElement => {
  switch (type) {
    case 'connector-control-plane':
      return <ConnectorIcon />;
    case 'connector-data-plane':
      return <DataPlaneIcon />;
    case 'dtr':
      return <DtrIcon />;
    case 'submodel-server':
      return <StorageIcon />;
    case 'keycloak':
      return <SecurityIcon />;
    case 'backend-service':
      return <ApiIcon />;
    default:
      return <ApiIcon />;
  }
};

/**
 * Get status icon and color
 */
const getStatusConfig = (status: ConnectionStatus): { icon: React.ReactElement; color: string; label: string } => {
  switch (status) {
    case 'connected':
      return { 
        icon: <ConnectedIcon sx={{ fontSize: 16 }} />, 
        color: '#22c55e', 
        label: 'Connected' 
      };
    case 'disconnected':
      return { 
        icon: <DisconnectedIcon sx={{ fontSize: 16 }} />, 
        color: '#ef4444', 
        label: 'Disconnected' 
      };
    case 'error':
      return { 
        icon: <ErrorIcon sx={{ fontSize: 16 }} />, 
        color: '#f59e0b', 
        label: 'Error' 
      };
    case 'unknown':
    default:
      return { 
        icon: <UnknownIcon sx={{ fontSize: 16 }} />, 
        color: '#6b7280', 
        label: 'Unknown' 
      };
  }
};

/**
 * SystemCard component for displaying a system configuration
 */
const SystemCard: React.FC<SystemCardProps> = ({
  system,
  onSetActive,
  onRemove,
  onEdit,
  onCheckConnection,
  onToggleLink,
  isCheckingConnection = false
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const metadata = SYSTEM_TYPE_METADATA[system.type];
  const statusConfig = getStatusConfig(system.status);
  const isConnector = system.type === 'connector-control-plane' || system.type === 'connector-data-plane';
  const connectorSystem = isConnector ? (system as ConnectorConfig) : null;
  const isLinked = system.isLinked !== false; // Default to true if undefined

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(system.endpoint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy endpoint:', error);
    }
  };

  const handleSetActive = () => {
    handleMenuClose();
    onSetActive(system.id);
  };

  const handleRemove = () => {
    handleMenuClose();
    onRemove(system.id);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(system);
  };

  const handleCheckConnection = async () => {
    handleMenuClose();
    await onCheckConnection(system.id);
  };

  const handleToggleLink = async () => {
    await onToggleLink(system.id);
  };

  // Handle double-click on card to toggle link
  const handleDoubleClick = async () => {
    await onToggleLink(system.id);
  };

  return (
    <Card
      onDoubleClick={handleDoubleClick}
      sx={{
        backgroundColor: 'rgba(30, 30, 35, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: isLinked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        opacity: isLinked ? 1 : 0.6,
        height: '100%',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          borderColor: 'rgba(255,255,255,0.25)',
          backgroundColor: 'rgba(40, 40, 45, 0.9)'
        }
      }}
    >
      {/* Colored top accent bar */}
      <Box sx={{ 
        height: 3, 
        backgroundColor: isLinked ? metadata.color : 'rgba(255,255,255,0.2)',
        opacity: isLinked ? 1 : 0.5
      }} />
      
      <CardContent sx={{ 
        p: 2, 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        '&:last-child': { pb: 2 } 
      }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: alpha(metadata.color, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isLinked ? metadata.color : 'rgba(255,255,255,0.4)',
                flexShrink: 0
              }}
            >
              {React.cloneElement(getSystemIcon(system.type), { sx: { fontSize: 18 } })}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: isLinked ? '#fff' : 'rgba(255,255,255,0.5)', 
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {system.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                {metadata.label}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {system.isActive && (
              <Chip
                label="Active"
                size="small"
                sx={{
                  backgroundColor: alpha('#22c55e', 0.2),
                  color: '#4ade80',
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 18,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                color: 'rgba(255,255,255,0.4)',
                p: 0.5,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
              }}
            >
              <MoreIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Status Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={isCheckingConnection ? <CircularProgress size={10} color="inherit" /> : statusConfig.icon}
            label={isCheckingConnection ? 'Checking...' : statusConfig.label}
            size="small"
            sx={{
              backgroundColor: alpha(statusConfig.color, 0.15),
              color: statusConfig.color,
              fontWeight: 500,
              fontSize: '0.65rem',
              height: 20,
              '& .MuiChip-icon': { color: statusConfig.color },
              '& .MuiChip-label': { px: 0.75 }
            }}
          />
          
          {connectorSystem && (
            <Chip
              label={CONNECTOR_VERSIONS[connectorSystem.version].label}
              size="small"
              sx={{
                backgroundColor: alpha('#3b82f6', 0.15),
                color: '#60a5fa',
                fontWeight: 500,
                fontSize: '0.65rem',
                height: 20,
                '& .MuiChip-label': { px: 0.75 }
              }}
            />
          )}
        </Box>

        {/* Endpoint */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            mb: 1.5
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.6)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {system.endpoint}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy'} arrow>
            <IconButton 
              size="small" 
              onClick={handleCopyEndpoint}
              sx={{ 
                color: 'rgba(255,255,255,0.4)',
                p: 0.25,
                '&:hover': { color: 'rgba(255,255,255,0.7)' }
              }}
            >
              <CopyIcon sx={{ fontSize: 11 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Description - takes remaining space */}
        <Box sx={{ flex: 1, minHeight: 32 }}>
          {system.description && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.7rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {system.description}
            </Typography>
          )}
        </Box>

        {/* Footer - always at bottom */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          pt: 1.5,
          mt: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Typography 
            variant="caption" 
            sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}
          >
            {system.lastChecked 
              ? `Checked ${new Date(system.lastChecked).toLocaleDateString()}`
              : 'Not checked yet'
            }
          </Typography>
          <Button
            variant="text"
            size="small"
            startIcon={isLinked ? <UnlinkIcon sx={{ fontSize: 12 }} /> : <LinkIcon sx={{ fontSize: 12 }} />}
            onClick={handleToggleLink}
            sx={{
              color: isLinked ? '#f87171' : '#4ade80',
              fontSize: '0.65rem',
              py: 0,
              px: 1,
              minWidth: 'auto',
              minHeight: 24,
              '&:hover': {
                backgroundColor: isLinked ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)'
              }
            }}
          >
            {isLinked ? 'Unlink' : 'Link'}
          </Button>
        </Box>
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(25, 25, 30, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden'
          }
        }}
      >
        <MenuItem 
          onClick={handleSetActive} 
          disabled={system.isActive}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
            '&.Mui-disabled': { opacity: 0.5 }
          }}
        >
          <ListItemIcon>
            {system.isActive ? <ActiveIcon sx={{ color: '#4ade80', fontSize: 20 }} /> : <InactiveIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }} />}
          </ListItemIcon>
          <ListItemText 
            primary={system.isActive ? 'Currently Active' : 'Set as Active'}
            primaryTypographyProps={{ 
              sx: { color: '#fff', fontSize: '0.85rem', fontWeight: 500 } 
            }}
          />
        </MenuItem>
        
        <MenuItem 
          onClick={handleCheckConnection} 
          disabled={isCheckingConnection}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': { backgroundColor: 'rgba(96, 165, 250, 0.15)' }
          }}
        >
          <ListItemIcon>
            <RefreshIcon sx={{ color: '#60a5fa', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Check Connection"
            primaryTypographyProps={{ 
              sx: { color: '#fff', fontSize: '0.85rem', fontWeight: 500 } 
            }}
          />
        </MenuItem>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 0.5 }} />
        
        <MenuItem 
          onClick={handleEdit}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': { backgroundColor: 'rgba(251, 191, 36, 0.15)' }
          }}
        >
          <ListItemIcon>
            <EditIcon sx={{ color: '#fbbf24', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Edit"
            primaryTypographyProps={{ 
              sx: { color: '#fff', fontSize: '0.85rem', fontWeight: 500 } 
            }}
          />
        </MenuItem>
        
        <MenuItem 
          onClick={handleRemove} 
          disabled={system.isActive}
          sx={{
            py: 1.25,
            px: 2,
            '&:hover': { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
            '&.Mui-disabled': { opacity: 0.4 }
          }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: system.isActive ? 'rgba(255,255,255,0.3)' : '#f87171', fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary="Remove"
            primaryTypographyProps={{ 
              sx: { color: system.isActive ? 'rgba(255,255,255,0.3)' : '#f87171', fontSize: '0.85rem', fontWeight: 500 } 
            }}
          />
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default SystemCard;

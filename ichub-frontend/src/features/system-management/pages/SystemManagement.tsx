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

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid2,
  alpha,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  SettingsInputComponent as ConnectorIcon,
  CloudSync as DataPlaneIcon,
  AccountTree as DtrIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Hub as HubIcon,
  CheckCircle as ConnectedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ViewModule as ViewCardsIcon,
  ViewList as ViewListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSystemContext } from '@/contexts/SystemContext';
import SystemCard from '../components/SystemCard';
import AddSystemDialog from '../components/AddSystemDialog';
import { 
  SystemType, 
  SystemConfig, 
  SystemFormData,
  SYSTEM_TYPE_METADATA 
} from '../types';

/**
 * Tab configuration for system categories
 */
interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
  types: SystemType[];
  color: string;
}

const TABS: TabConfig[] = [
  {
    id: 'all',
    label: 'All Systems',
    icon: <HubIcon />,
    types: ['connector-control-plane', 'connector-data-plane', 'dtr', 'submodel-server', 'keycloak', 'backend-service'],
    color: '#60a5fa'
  },
  {
    id: 'connectors',
    label: 'Connectors',
    icon: <ConnectorIcon />,
    types: ['connector-control-plane', 'connector-data-plane'],
    color: '#60a5fa'
  },
  {
    id: 'registries',
    label: 'Registries',
    icon: <DtrIcon />,
    types: ['dtr'],
    color: '#f472b6'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <StorageIcon />,
    types: ['submodel-server'],
    color: '#fbbf24'
  },
  {
    id: 'services',
    label: 'Services',
    icon: <ApiIcon />,
    types: ['keycloak', 'backend-service'],
    color: '#a78bfa'
  }
];

/**
 * SystemManagement page component
 */
const SystemManagement: React.FC = () => {
  const {
    systems,
    isLoading,
    addSystem,
    removeSystem,
    updateSystem,
    setActiveSystem,
    toggleLinkSystem,
    checkConnection
  } = useSystemContext();

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSystem, setEditSystem] = useState<SystemConfig | null>(null);
  const [checkingConnections, setCheckingConnections] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Filter systems based on active tab and search query
  const filteredSystems = useMemo(() => {
    const currentTab = TABS[activeTab];
    let filtered = systems.filter(s => currentTab.types.includes(s.type));
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.endpoint.toLowerCase().includes(query) ||
        SYSTEM_TYPE_METADATA[s.type].label.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [systems, activeTab, searchQuery]);

  // Count systems by category for badges
  const systemCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab.id] = systems.filter(s => tab.types.includes(s.type)).length;
      return acc;
    }, {} as Record<string, number>);
  }, [systems]);

  // Count connected systems
  const connectedCount = useMemo(() => {
    return systems.filter(s => s.status === 'connected').length;
  }, [systems]);

  const handleAddSystem = async (formData: SystemFormData) => {
    try {
      if (editSystem) {
        await updateSystem(editSystem.id, formData);
        setSnackbar({ open: true, message: 'System updated successfully', severity: 'success' });
      } else {
        await addSystem(formData);
        setSnackbar({ open: true, message: 'System added successfully', severity: 'success' });
      }
      setAddDialogOpen(false);
      setEditSystem(null);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to save system', 
        severity: 'error' 
      });
    }
  };

  const handleRemoveSystem = async (systemId: string) => {
    try {
      await removeSystem(systemId);
      setSnackbar({ open: true, message: 'System removed successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to remove system', 
        severity: 'error' 
      });
    }
  };

  const handleSetActive = async (systemId: string) => {
    try {
      await setActiveSystem(systemId);
      setSnackbar({ open: true, message: 'System set as active', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to set system as active', 
        severity: 'error' 
      });
    }
  };

  const handleToggleLink = async (systemId: string) => {
    try {
      await toggleLinkSystem(systemId);
      const system = systems.find(s => s.id === systemId);
      const wasLinked = system?.isLinked !== false;
      setSnackbar({ 
        open: true, 
        message: wasLinked ? 'System unlinked' : 'System linked', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to toggle system link', 
        severity: 'error' 
      });
    }
  };

  const handleCheckConnection = async (systemId: string) => {
    setCheckingConnections(prev => new Set(prev).add(systemId));
    try {
      const status = await checkConnection(systemId);
      setSnackbar({ 
        open: true, 
        message: `Connection status: ${status}`, 
        severity: status === 'connected' ? 'success' : 'warning' 
      });
    } finally {
      setCheckingConnections(prev => {
        const next = new Set(prev);
        next.delete(systemId);
        return next;
      });
    }
  };

  const handleCheckAllConnections = async () => {
    const currentTab = TABS[activeTab];
    const systemsToCheck = systems.filter(s => currentTab.types.includes(s.type));
    
    for (const system of systemsToCheck) {
      await handleCheckConnection(system.id);
    }
  };

  const handleEditSystem = (system: SystemConfig) => {
    setEditSystem(system);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setEditSystem(null);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Sticky Header Section */}
      <Box sx={{ 
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#121216',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        px: 3,
        py: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <HubIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>
                System Management
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Configure connections to external services
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#fff' }}>{systems.length}</Box> systems
              </Typography>
              <Typography variant="body2" sx={{ color: '#4ade80' }}>
                <Box component="span" sx={{ fontWeight: 600 }}>{connectedCount}</Box> connected
              </Typography>
              {systems.length - connectedCount > 0 && (
                <Typography variant="body2" sx={{ color: '#f87171' }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>{systems.length - connectedCount}</Box> issues
                </Typography>
              )}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                onClick={handleCheckAllConnections}
                disabled={isLoading}
                sx={{ 
                  borderColor: 'rgba(255,255,255,0.2)', 
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'none',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)' }
                }}
              >
                Check All
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  backgroundColor: '#4ade80',
                  color: '#000',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#22c55e' }
                }}
              >
                Add System
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, p: 3, pb: 10 }}>
        {/* Info Banner */}
        <Box 
          sx={{ 
            mb: 3, 
            p: 1.5,
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <InfoIcon sx={{ color: '#fbbf24', fontSize: 18 }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
            <strong>Preview:</strong> Backend integration coming soon. Changes are stored locally.
          </Typography>
        </Box>

        {/* Loading indicator */}
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Navigation Bar with Tabs, Search, and View Toggle */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          gap: 2
        }}>
          {/* Elegant Tab Navigation */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {TABS.map((tab, index) => {
              const isActive = activeTab === index;
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  startIcon={React.cloneElement(tab.icon, { 
                    sx: { 
                      fontSize: 18, 
                      color: isActive ? tab.color : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.2s ease'
                    } 
                  })}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isActive ? alpha(tab.color, 0.12) : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? alpha(tab.color, 0.3) : 'transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: isActive ? alpha(tab.color, 0.18) : 'rgba(255,255,255,0.05)',
                      borderColor: isActive ? alpha(tab.color, 0.5) : 'rgba(255,255,255,0.1)'
                    },
                    '&::before': isActive ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60%',
                      height: 2,
                      backgroundColor: tab.color,
                      borderRadius: '2px 2px 0 0'
                    } : {}
                  }}
                >
                  {tab.label}
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      backgroundColor: isActive ? alpha(tab.color, 0.2) : 'rgba(255,255,255,0.08)',
                      color: isActive ? tab.color : 'rgba(255,255,255,0.5)',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: 'center'
                    }}
                  >
                    {systemCounts[tab.id]}
                  </Box>
                </Button>
              );
            })}
          </Box>

          {/* Search and View Controls - Right aligned */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5
          }}>
            <TextField
              size="small"
              placeholder="Search systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                )
              }}
              sx={{
                width: 220,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 2,
                  color: '#fff',
                  fontSize: '0.85rem',
                  height: 38,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#4ade80' }
                },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.4)' }
              }}
            />

            {/* View Mode Toggle */}
            <Box sx={{ 
              display: 'flex', 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              borderRadius: 1.5, 
              p: 0.5,
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('cards')}
                sx={{
                  color: viewMode === 'cards' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                  backgroundColor: viewMode === 'cards' ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                  borderRadius: 1,
                  p: 0.75,
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: viewMode === 'cards' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)' }
                }}
              >
                <ViewCardsIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  color: viewMode === 'list' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                  backgroundColor: viewMode === 'list' ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                  borderRadius: 1,
                  p: 0.75,
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: viewMode === 'list' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)' }
                }}
              >
                <ViewListIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Systems Grid or List */}
        <Box>
          {filteredSystems.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              color: 'rgba(255,255,255,0.5)'
            }}>
              <HubIcon sx={{ fontSize: 48, mb: 2, color: 'rgba(255,255,255,0.2)' }} />
              <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                {searchQuery ? 'No systems found' : 'No systems configured'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: 'rgba(255,255,255,0.4)' }}>
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : `Add your first ${TABS[activeTab].label.toLowerCase()} to get started`
                }
              </Typography>
              {!searchQuery && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                >
                  Add System
                </Button>
              )}
            </Box>
          ) : viewMode === 'cards' ? (
            <Grid2 container spacing={2}>
              {filteredSystems.map((system) => (
                <Grid2 size={{ xs: 12, sm: 6, lg: 4 }} key={system.id}>
                  <SystemCard
                    system={system}
                    onSetActive={handleSetActive}
                    onRemove={handleRemoveSystem}
                    onEdit={handleEditSystem}
                    onCheckConnection={handleCheckConnection}
                    onToggleLink={handleToggleLink}
                    isCheckingConnection={checkingConnections.has(system.id)}
                  />
                </Grid2>
              ))}
            </Grid2>
          ) : (
            /* List View */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* List Header */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1.5fr 100px 80px 90px',
                gap: 2,
                px: 2,
                py: 1.5,
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'rgba(30, 30, 35, 0.6)',
                borderRadius: 1.5,
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <Box>System</Box>
                <Box>Type</Box>
                <Box>Endpoint</Box>
                <Box>Status</Box>
                <Box>Link</Box>
                <Box sx={{ textAlign: 'center' }}>Actions</Box>
              </Box>
              {/* List Items */}
              {filteredSystems.map((system) => {
                const metadata = SYSTEM_TYPE_METADATA[system.type];
                const isLinked = system.isLinked !== false;
                return (
                  <Box 
                    key={system.id}
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '2fr 1fr 1.5fr 100px 80px 90px',
                      gap: 2,
                      px: 2,
                      py: 1.5,
                      backgroundColor: 'rgba(30, 30, 35, 0.85)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 1.5,
                      alignItems: 'center',
                      opacity: isLinked ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(40, 40, 45, 0.9)',
                        borderColor: 'rgba(255,255,255,0.15)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 0.75,
                        backgroundColor: alpha(metadata.color, 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: metadata.color,
                        flexShrink: 0
                      }}>
                        {system.type === 'connector-control-plane' && <ConnectorIcon sx={{ fontSize: 16 }} />}
                        {system.type === 'connector-data-plane' && <DataPlaneIcon sx={{ fontSize: 16 }} />}
                        {system.type === 'dtr' && <DtrIcon sx={{ fontSize: 16 }} />}
                        {system.type === 'submodel-server' && <StorageIcon sx={{ fontSize: 16 }} />}
                        {system.type === 'keycloak' && <SecurityIcon sx={{ fontSize: 16 }} />}
                        {system.type === 'backend-service' && <ApiIcon sx={{ fontSize: 16 }} />}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500, 
                            color: '#fff', 
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {system.name}
                          {system.isActive && (
                            <Box 
                              component="span" 
                              sx={{ 
                                ml: 1,
                                backgroundColor: alpha('#4ade80', 0.2),
                                color: '#4ade80',
                                fontSize: '0.55rem',
                                fontWeight: 600,
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                verticalAlign: 'middle'
                              }}
                            >
                              ACTIVE
                            </Box>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {metadata.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.4)', 
                        fontFamily: 'monospace', 
                        fontSize: '0.7rem',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {system.endpoint}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: system.status === 'connected' ? '#4ade80' : 
                               system.status === 'disconnected' ? '#f87171' :
                               system.status === 'error' ? '#fbbf24' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%',
                          backgroundColor: system.status === 'connected' ? '#4ade80' : 
                                          system.status === 'disconnected' ? '#f87171' :
                                          system.status === 'error' ? '#fbbf24' : 'rgba(255,255,255,0.3)'
                        }} 
                      />
                      {system.status}
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleToggleLink(system.id)}
                      sx={{
                        fontSize: '0.65rem',
                        color: isLinked ? '#f87171' : '#4ade80',
                        fontWeight: 600,
                        minWidth: 'auto',
                        px: 1,
                        py: 0.25,
                        minHeight: 24,
                        borderRadius: 1,
                        backgroundColor: isLinked ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                        '&:hover': {
                          backgroundColor: isLinked ? 'rgba(248, 113, 113, 0.2)' : 'rgba(74, 222, 128, 0.2)'
                        }
                      }}
                    >
                      {isLinked ? 'Unlink' : 'Link'}
                    </Button>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditSystem(system)} 
                        sx={{ 
                          color: '#fbbf24',
                          backgroundColor: 'rgba(251, 191, 36, 0.1)',
                          p: 0.75,
                          borderRadius: 1,
                          '&:hover': { 
                            backgroundColor: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24'
                          }
                        }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveSystem(system.id)} 
                        disabled={system.isActive} 
                        sx={{ 
                          color: system.isActive ? 'rgba(255,255,255,0.2)' : '#f87171',
                          backgroundColor: system.isActive ? 'rgba(255,255,255,0.05)' : 'rgba(248, 113, 113, 0.1)',
                          p: 0.75,
                          borderRadius: 1,
                          '&:hover': { 
                            backgroundColor: system.isActive ? 'rgba(255,255,255,0.05)' : 'rgba(248, 113, 113, 0.2)',
                            color: system.isActive ? 'rgba(255,255,255,0.2)' : '#f87171'
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* Add/Edit System Dialog */}
      <AddSystemDialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        onAdd={handleAddSystem}
        editSystem={editSystem}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemManagement;

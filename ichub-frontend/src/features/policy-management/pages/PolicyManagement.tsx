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

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid2,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  createTheme,
  ThemeProvider,
  Collapse,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Policy as PolicyIcon
} from '@mui/icons-material';
import {
  Policy,
  PolicyVersion,
  PolicyType,
  PolicyDataType,
  PolicyStatus,
  PolicyGroupBy,
  PolicyFilters,
  DATA_TYPE_INFO,
  POLICY_VERSION_INFO
} from '../types/types';
import { fetchPolicies, createPolicy, updatePolicy, deletePolicy } from '../api';
import PolicyCard from '../components/PolicyCard';
import PolicyCreateDialog from '../components/PolicyCreateDialog';
import PolicyViewDialog from '../components/PolicyViewDialog';
import './PolicyManagement.scss';

// Dark theme matching SubmodelCreator style
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: 'rgba(0, 0, 0, 0.4)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    danger: {
      danger: undefined,
      dangerHover: undefined,
      dangerBadge: undefined
    },
    textField: {
      placeholderText: undefined,
      helperText: undefined,
      background: undefined,
      backgroundHover: undefined
    },
    chip: {
      release: '',
      active: '',
      inactive: '',
      created: '',
      inReview: '',
      enabled: '',
      default: '',
      bgRelease: '',
      bgActive: '',
      bgInactive: '',
      bgCreated: '',
      bgInReview: '',
      bgEnabled: '',
      bgDefault: '',
      warning: '',
      registered: '',
      bgRegistered: '',
      borderDraft: '',
      black: '',
      none: ''
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
  },
});

/**
 * Policy Management Page
 */
const PolicyManagement: React.FC = () => {
  // State
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groupBy, setGroupBy] = useState<PolicyGroupBy>('dataType');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filter State
  const [filters, setFilters] = useState<PolicyFilters>({
    search: '',
    version: 'all',
    type: 'all',
    dataType: 'all',
    status: 'all'
  });

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Load policies
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPolicies();
      setPolicies(data);
    } catch (err) {
      setError('Failed to load policies. Please try again.');
      console.error('Error loading policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter policies
  const filteredPolicies = useMemo(() => {
    return policies.filter(policy => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          policy.name.toLowerCase().includes(searchLower) ||
          policy.description?.toLowerCase().includes(searchLower) ||
          policy.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Version filter
      if (filters.version && filters.version !== 'all' && policy.version !== filters.version) {
        return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all' && policy.type !== filters.type) {
        return false;
      }

      // Data type filter
      if (filters.dataType && filters.dataType !== 'all' && policy.dataType !== filters.dataType) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && policy.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [policies, filters]);

  // Group policies
  const groupedPolicies = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Policies': filteredPolicies };
    }

    return filteredPolicies.reduce((groups, policy) => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'dataType':
          groupKey = DATA_TYPE_INFO[policy.dataType].label;
          break;
        case 'type':
          groupKey = policy.type === 'access' ? 'Access Policies' : 'Usage Policies';
          break;
        case 'version':
          groupKey = `${POLICY_VERSION_INFO[policy.version].label} Version`;
          break;
        case 'status':
          groupKey = `${policy.status.charAt(0).toUpperCase() + policy.status.slice(1)} Policies`;
          break;
        default:
          groupKey = 'Other';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(policy);
      return groups;
    }, {} as Record<string, Policy[]>);
  }, [filteredPolicies, groupBy]);

  // Handlers
  const handleClearFilters = () => {
    setFilters({
      search: '',
      version: 'all',
      type: 'all',
      dataType: 'all',
      status: 'all'
    });
  };

  const handleVersionToggle = (version: PolicyVersion) => {
    setFilters(prev => ({
      ...prev,
      version: prev.version === version ? 'all' : version
    }));
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey] === undefined ? false : !prev[groupKey]
    }));
  };

  const handleCreatePolicy = async (policyData: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editPolicy) {
        await updatePolicy(editPolicy.id, policyData);
        setSnackbar({ open: true, message: 'Policy updated successfully!', severity: 'success' });
      } else {
        await createPolicy(policyData);
        setSnackbar({ open: true, message: 'Policy created successfully!', severity: 'success' });
      }
      setCreateDialogOpen(false);
      setEditPolicy(null);
      loadPolicies();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save policy', severity: 'error' });
    }
  };

  const handleDeletePolicy = async () => {
    if (!selectedPolicy) return;
    try {
      await deletePolicy(selectedPolicy.id);
      setSnackbar({ open: true, message: 'Policy deleted successfully!', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedPolicy(null);
      setViewDialogOpen(false);
      loadPolicies();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete policy', severity: 'error' });
    }
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditPolicy(policy);
    setViewDialogOpen(false);
    setCreateDialogOpen(true);
  };

  const handleViewPolicy = (policy: Policy) => {
    setSelectedPolicy(policy);
    setViewDialogOpen(true);
  };

  const handleDuplicatePolicy = (policy: Policy) => {
    setEditPolicy({
      ...policy,
      id: '',
      name: `${policy.name} (Copy)`,
      status: 'draft'
    });
    setCreateDialogOpen(true);
  };

  const handleDeleteClick = (policy: Policy) => {
    setSelectedPolicy(policy);
    setDeleteDialogOpen(true);
  };

  const hasActiveFilters = filters.search || 
    (filters.version && filters.version !== 'all') || 
    (filters.type && filters.type !== 'all') || 
    (filters.dataType && filters.dataType !== 'all') ||
    (filters.status && filters.status !== 'all');

  return (
    <ThemeProvider theme={darkTheme}>
      <Box className="policy-management" sx={{ 
        minHeight: '100vh',
        p: 3
      }}>
        {/* Sticky Header */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'inherit',
          pt: 1,
          pb: 2,
          mb: 2,
          backdropFilter: 'blur(8px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PolicyIcon sx={{ fontSize: 36, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                  Policy Management
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Manage access and usage policies for your dataspace resources
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Create a new policy from JSON configuration">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { setEditPolicy(null); setCreateDialogOpen(true); }}
                sx={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Create Policy
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Filters & Controls */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search policies..."
                size="small"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ width: 250, '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}
              />
              
              {/* Version Toggle Switch - Custom styled */}
              <Tooltip title={filters.version === 'all' ? 'Click to filter by version' : `Showing ${POLICY_VERSION_INFO[filters.version as PolicyVersion].label} policies - Click to change`}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    p: 0.4,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    height: 36
                  }}
                >
                  {/* Background indicator - Saturn */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '4px',
                      width: 'calc(50% - 6px)',
                      height: 28,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                      boxShadow: '0 2px 8px rgba(180, 83, 9, 0.5)',
                      transition: filters.version === 'all' ? 'opacity 0.2s ease' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: filters.version === 'saturn' ? 1 : 0,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Background indicator - Jupiter */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 'calc(50% + 2px)',
                      width: 'calc(50% - 6px)',
                      height: 28,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
                      boxShadow: '0 2px 8px rgba(109, 40, 217, 0.5)',
                      transition: filters.version === 'all' ? 'opacity 0.2s ease' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: filters.version === 'jupiter' ? 1 : 0,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Saturn button */}
                  <Box
                    onClick={() => handleVersionToggle('saturn')}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      zIndex: 1,
                      transition: 'all 0.2s ease',
                      minWidth: 90,
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: filters.version === 'saturn' ? '#fff' : '#b45309',
                        boxShadow: filters.version === 'saturn' ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: filters.version === 'saturn' ? '#fff' : 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s ease',
                        fontSize: '0.8rem'
                      }}
                    >
                      Saturn
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        color: filters.version === 'saturn' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ({policies.filter(p => p.version === 'saturn').length})
                    </Typography>
                  </Box>

                  {/* Jupiter button */}
                  <Box
                    onClick={() => handleVersionToggle('jupiter')}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      zIndex: 1,
                      transition: 'all 0.2s ease',
                      minWidth: 90,
                      justifyContent: 'center'
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: filters.version === 'jupiter' ? '#fff' : '#6d28d9',
                        boxShadow: filters.version === 'jupiter' ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: filters.version === 'jupiter' ? '#fff' : 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s ease',
                        fontSize: '0.8rem'
                      }}
                    >
                      Jupiter
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        color: filters.version === 'jupiter' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ({policies.filter(p => p.version === 'jupiter').length})
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Filter Selects */}
              <Tooltip title="Filter by policy type (Access or Usage)">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type || 'all'}
                    label="Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as PolicyType | 'all' }))}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="access">Access</MenuItem>
                    <MenuItem value="usage">Usage</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>

              <Tooltip title="Filter by data type">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    value={filters.dataType || 'all'}
                    label="Data Type"
                    onChange={(e) => setFilters(prev => ({ ...prev, dataType: e.target.value as PolicyDataType | 'all' }))}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {Object.entries(DATA_TYPE_INFO).map(([key, info]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: info.color }} />
                          {info.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Tooltip>

              <Tooltip title="Filter by status">
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status || 'all'}
                    label="Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as PolicyStatus | 'all' }))}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>

              {/* Divider */}
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

              {/* Group By */}
              <Tooltip title="Group policies by a category">
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Group By</InputLabel>
                  <Select
                    value={groupBy}
                    label="Group By"
                    onChange={(e) => setGroupBy(e.target.value as PolicyGroupBy)}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <MenuItem value="dataType">Data Type</MenuItem>
                    <MenuItem value="type">Policy Type</MenuItem>
                    <MenuItem value="version">Version</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                    <MenuItem value="none">No Grouping</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>

              {/* View Mode */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <Tooltip title="Grid view">
                  <ToggleButton value="grid">
                    <ViewModuleIcon />
                  </ToggleButton>
                </Tooltip>
                <Tooltip title="List view">
                  <ToggleButton value="list">
                    <ViewListIcon />
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>

              <Tooltip title="Refresh policies">
                <IconButton onClick={loadPolicies} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Stats Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Tooltip title={`Showing ${filteredPolicies.length} out of ${policies.length} total policies`}>
            <Chip
              label={`${filteredPolicies.length} of ${policies.length} policies`}
              sx={{ backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}
            />
          </Tooltip>
          {hasActiveFilters && (
            <>
              <Tooltip title="Active filters are applied">
                <Chip
                  label="Filtered"
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ height: 32 }}
                />
              </Tooltip>
              <Tooltip title="Clear all filters">
                <Button 
                  size="small" 
                  onClick={handleClearFilters} 
                  startIcon={<ClearIcon />}
                  sx={{ 
                    ml: 0.5,
                    height: 28,
                    fontSize: '0.75rem'
                  }}
                >
                  Clear
                </Button>
              </Tooltip>
            </>
          )}
        </Box>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Grid2 container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid2 key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
              </Grid2>
            ))}
          </Grid2>
        ) : filteredPolicies.length === 0 ? (
          /* Empty State */
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <PolicyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {hasActiveFilters ? 'No policies match your filters' : 'No policies yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {hasActiveFilters 
                ? 'Try adjusting your filters or clear them to see all policies.'
                : 'Create your first policy to start managing access and usage rules for your dataspace resources.'}
            </Typography>
            {hasActiveFilters ? (
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
              >
                Create First Policy
              </Button>
            )}
          </Box>
        ) : (
          /* Policy Groups */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(groupedPolicies).map(([groupName, groupPolicies]) => {
              const isExpanded = expandedGroups[groupName] !== false; // Default expanded
              
              return (
                <Box key={groupName} sx={{ mb: 1 }}>
                  {/* Group Header - More visually distinct */}
                  <Box
                    onClick={() => toggleGroup(groupName)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderLeft: '3px solid',
                      borderLeftColor: 'primary.main',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.06)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {groupName}
                      </Typography>
                      <Chip
                        label={groupPolicies.length}
                        size="small"
                        sx={{ backgroundColor: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa', height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </Box>
                    <Tooltip title={isExpanded ? 'Collapse group' : 'Expand group'}>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Group Content */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ pt: 1.5, pl: 1 }}>
                      <Grid2 container spacing={2}>
                        {groupPolicies.map((policy) => (
                          <Grid2 key={policy.id} size={{ xs: 12, sm: 6, md: 4, lg: viewMode === 'list' ? 12 : 3 }}>
                            <PolicyCard
                              policy={policy}
                              viewMode={viewMode}
                              onEdit={handleEditPolicy}
                              onDelete={handleDeleteClick}
                              onView={handleViewPolicy}
                              onDuplicate={handleDuplicatePolicy}
                            />
                          </Grid2>
                        ))}
                      </Grid2>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Create/Edit Dialog */}
        <PolicyCreateDialog
          open={createDialogOpen}
          onClose={() => { setCreateDialogOpen(false); setEditPolicy(null); }}
          onSave={handleCreatePolicy}
          editPolicy={editPolicy}
        />

        {/* View Dialog */}
        <PolicyViewDialog
          open={viewDialogOpen}
          onClose={() => { setViewDialogOpen(false); setSelectedPolicy(null); }}
          policy={selectedPolicy}
          onEdit={handleEditPolicy}
          onDelete={handleDeleteClick}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: '#1e1e1e',
              backgroundImage: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }
          }}
        >
          <DialogTitle>Delete Policy</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{selectedPolicy?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeletePolicy}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default PolicyManagement;

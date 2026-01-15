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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  alpha
} from '@mui/material';
import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import {
  Policy,
  PolicyDataType,
  PolicyType,
  DATA_TYPE_INFO,
  POLICY_VERSION_INFO
} from '../types/types';
import { fetchPolicies } from '../api';

interface PolicySelectorProps {
  /** Data type to filter policies for */
  dataType?: PolicyDataType;
  /** Selected access policy ID */
  accessPolicyId?: string;
  /** Selected usage policy ID */
  usagePolicyId?: string;
  /** Callback when access policy changes */
  onAccessPolicyChange: (policyId: string | null, policy: Policy | null) => void;
  /** Callback when usage policy changes */
  onUsagePolicyChange: (policyId: string | null, policy: Policy | null) => void;
  /** Whether to show compact view */
  compact?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * PolicySelector component - used in sharing flows to select policies for resources
 * This is a reusable component that can be embedded in share dialogs
 */
const PolicySelector: React.FC<PolicySelectorProps> = ({
  dataType,
  accessPolicyId,
  usagePolicyId,
  onAccessPolicyChange,
  onUsagePolicyChange,
  compact = false,
  disabled = false
}) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPolicies();
      setPolicies(data.filter(p => p.status === 'active'));
    } catch (err) {
      setError('Failed to load policies');
      console.error('Error loading policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter policies by type and optionally by data type
  const getFilteredPolicies = (type: PolicyType) => {
    return policies.filter(p => {
      if (p.type !== type) return false;
      if (dataType && p.dataType !== dataType && p.dataType !== 'other') return false;
      return true;
    });
  };

  const accessPolicies = getFilteredPolicies('access');
  const usagePolicies = getFilteredPolicies('usage');

  const selectedAccessPolicy = policies.find(p => p.id === accessPolicyId);
  const selectedUsagePolicy = policies.find(p => p.id === usagePolicyId);

  const handleAccessChange = (policyId: string) => {
    const policy = policies.find(p => p.id === policyId) || null;
    onAccessPolicyChange(policyId || null, policy);
  };

  const handleUsageChange = (policyId: string) => {
    const policy = policies.find(p => p.id === policyId) || null;
    onUsagePolicyChange(policyId || null, policy);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const renderPolicyOption = (policy: Policy) => {
    const versionInfo = POLICY_VERSION_INFO[policy.version];
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">{policy.name}</Typography>
        </Box>
        <Chip
          label={versionInfo.label}
          size="small"
          sx={{
            backgroundColor: alpha(versionInfo.color, 0.15),
            color: versionInfo.color,
            fontSize: '0.65rem',
            height: 20
          }}
        />
      </Box>
    );
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ flex: 1 }} disabled={disabled}>
          <InputLabel>Access Policy</InputLabel>
          <Select
            value={accessPolicyId || ''}
            label="Access Policy"
            onChange={(e) => handleAccessChange(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {accessPolicies.map((policy) => (
              <MenuItem key={policy.id} value={policy.id}>
                {policy.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: 1 }} disabled={disabled}>
          <InputLabel>Usage Policy</InputLabel>
          <Select
            value={usagePolicyId || ''}
            label="Usage Policy"
            onChange={(e) => handleUsageChange(e.target.value)}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {usagePolicies.map((policy) => (
              <MenuItem key={policy.id} value={policy.id}>
                {policy.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Info Alert */}
      <Alert severity="info" sx={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}>
        <Typography variant="body2">
          Select the access and usage policies to apply when sharing this resource.
          {dataType && (
            <> Showing policies configured for <strong>{DATA_TYPE_INFO[dataType].label}</strong>.</>
          )}
        </Typography>
      </Alert>

      {/* Access Policy Selector */}
      <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockOpenIcon sx={{ color: '#60a5fa' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Access Policy
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Defines who can access and discover this resource in the dataspace.
        </Typography>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>Select Access Policy</InputLabel>
          <Select
            value={accessPolicyId || ''}
            label="Select Access Policy"
            onChange={(e) => handleAccessChange(e.target.value)}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <MenuItem value="">
              <em>No policy selected</em>
            </MenuItem>
            {accessPolicies.map((policy) => (
              <MenuItem key={policy.id} value={policy.id}>
                {renderPolicyOption(policy)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {accessPolicies.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
            No access policies available. Create one in Policy Management.
          </Alert>
        )}
      </Paper>

      {/* Usage Policy Selector */}
      <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LockIcon sx={{ color: '#fb923c' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Usage Policy
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Defines how the data can be used once accessed (constraints, time limits, etc.).
        </Typography>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>Select Usage Policy</InputLabel>
          <Select
            value={usagePolicyId || ''}
            label="Select Usage Policy"
            onChange={(e) => handleUsageChange(e.target.value)}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <MenuItem value="">
              <em>No policy selected</em>
            </MenuItem>
            {usagePolicies.map((policy) => (
              <MenuItem key={policy.id} value={policy.id}>
                {renderPolicyOption(policy)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {usagePolicies.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
            No usage policies available. Create one in Policy Management.
          </Alert>
        )}
      </Paper>

      {/* Selected Summary */}
      {(selectedAccessPolicy || selectedUsagePolicy) && (
        <Paper sx={{ p: 2, backgroundColor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <Typography variant="subtitle2" sx={{ color: 'success.main', mb: 1 }}>
            Selected Policies Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {selectedAccessPolicy && (
              <Chip
                icon={<LockOpenIcon sx={{ fontSize: 16 }} />}
                label={`Access: ${selectedAccessPolicy.name}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(96, 165, 250, 0.15)',
                  color: '#60a5fa',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
            {selectedUsagePolicy && (
              <Chip
                icon={<LockIcon sx={{ fontSize: 16 }} />}
                label={`Usage: ${selectedUsagePolicy.name}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(251, 146, 60, 0.15)',
                  color: '#fb923c',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PolicySelector;

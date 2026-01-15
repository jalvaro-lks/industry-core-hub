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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  alpha,
  SelectChangeEvent,
  FormHelperText
} from '@mui/material';
import {
  SettingsInputComponent as ConnectorIcon,
  CloudSync as DataPlaneIcon,
  AccountTree as DtrIcon,
  Storage as StorageIcon,
  CheckCircle as ConnectedIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useSystemContext } from '@/contexts/SystemContext';
import { 
  SystemType, 
  SystemConfig, 
  SYSTEM_TYPE_METADATA,
  ConnectorConfig,
  DtrConfig,
  SubmodelServerConfig
} from '../types';

interface SystemSelectorProps {
  /** The type of system to select */
  systemType: 'connector' | 'dtr' | 'submodel-server';
  /** Currently selected system ID */
  value: string;
  /** Callback when selection changes */
  onChange: (systemId: string, system: SystemConfig | null) => void;
  /** Label for the selector */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field has an error */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Size of the select */
  size?: 'small' | 'medium';
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Get icon component for system type
 */
const getSystemIcon = (type: SystemType): React.ReactElement => {
  switch (type) {
    case 'connector-control-plane':
      return <ConnectorIcon sx={{ fontSize: 18 }} />;
    case 'connector-data-plane':
      return <DataPlaneIcon sx={{ fontSize: 18 }} />;
    case 'dtr':
      return <DtrIcon sx={{ fontSize: 18 }} />;
    case 'submodel-server':
      return <StorageIcon sx={{ fontSize: 18 }} />;
    default:
      return <ConnectorIcon sx={{ fontSize: 18 }} />;
  }
};

/**
 * Reusable system selector component for selecting Connectors, DTRs, or Submodel Servers
 * to be used in registration workflows (Catalog Parts, Serialized Parts, Submodels)
 */
const SystemSelector: React.FC<SystemSelectorProps> = ({
  systemType,
  value,
  onChange,
  label,
  helperText,
  required = false,
  error = false,
  errorMessage,
  disabled = false,
  size = 'medium',
  fullWidth = true
}) => {
  const { getConnectors, getDtrs, getSubmodelServers } = useSystemContext();

  // Get appropriate systems based on type
  const getSystems = (): SystemConfig[] => {
    switch (systemType) {
      case 'connector':
        return getConnectors().filter(c => c.type === 'connector-control-plane');
      case 'dtr':
        return getDtrs();
      case 'submodel-server':
        return getSubmodelServers();
      default:
        return [];
    }
  };

  // Get default label based on type
  const getDefaultLabel = (): string => {
    switch (systemType) {
      case 'connector':
        return 'Select Connector';
      case 'dtr':
        return 'Select DTR';
      case 'submodel-server':
        return 'Select Submodel Server';
      default:
        return 'Select System';
    }
  };

  const systems = getSystems();
  const displayLabel = label || getDefaultLabel();

  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedId = event.target.value;
    const selectedSystem = systems.find(s => s.id === selectedId) || null;
    onChange(selectedId, selectedSystem);
  };

  return (
    <FormControl 
      fullWidth={fullWidth} 
      size={size}
      required={required}
      error={error}
      disabled={disabled}
    >
      <InputLabel>{displayLabel}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={displayLabel}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.23)'
          }
        }}
        renderValue={(selectedId) => {
          const system = systems.find(s => s.id === selectedId);
          if (!system) return <em>None selected</em>;
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getSystemIcon(system.type)}
              <Typography variant="body2">{system.name}</Typography>
              {system.status === 'connected' && (
                <ConnectedIcon sx={{ fontSize: 14, color: '#22c55e', ml: 'auto' }} />
              )}
            </Box>
          );
        }}
      >
        {systems.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              No {systemType}s configured. Add one in System Management.
            </Typography>
          </MenuItem>
        ) : (
          systems.map((system) => {
            const metadata = SYSTEM_TYPE_METADATA[system.type];
            const isConnected = system.status === 'connected';
            
            return (
              <MenuItem key={system.id} value={system.id}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  width: '100%',
                  py: 0.5
                }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: alpha(metadata.color, 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: metadata.color
                    }}
                  >
                    {getSystemIcon(system.type)}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {system.name}
                      </Typography>
                      {system.isActive && (
                        <Chip 
                          label="Active" 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: '0.65rem',
                            backgroundColor: alpha('#22c55e', 0.2),
                            color: '#22c55e'
                          }} 
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 250
                      }}
                    >
                      {system.endpoint}
                    </Typography>
                  </Box>
                  
                  {isConnected ? (
                    <ConnectedIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                  ) : (
                    <WarningIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                  )}
                </Box>
              </MenuItem>
            );
          })
        )}
      </Select>
      {(helperText || errorMessage) && (
        <FormHelperText error={error}>
          {error ? errorMessage : helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default SystemSelector;

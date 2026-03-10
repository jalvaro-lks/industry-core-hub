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

/**
 * Shared dark mode card styles for PCF KIT components
 * Uses green/sustainability theme colors instead of purple
 */
export const pcfCardStyles = {
  card: {
    background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: { xs: '16px', md: '20px' },
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
    }
  },
  
  cardContent: {
    p: { xs: 2.5, sm: 3, md: 4 }
  },
  
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      borderRadius: { xs: '10px', md: '12px' },
      transition: 'all 0.2s ease',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: 'rgba(34, 197, 94, 0.5)'
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        '& fieldset': {
          borderColor: '#22c55e',
          borderWidth: '2px'
        }
      }
    }
  },
  
  button: {
    primary: {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#fff',
      borderRadius: { xs: '10px', md: '12px' },
      fontWeight: 600,
      textTransform: 'none' as const,
      boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
      transition: 'all 0.2s ease',
      '&:hover': {
        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        boxShadow: '0 6px 24px rgba(34, 197, 94, 0.4)',
        transform: 'translateY(-1px)'
      },
      '&:disabled': {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.3)'
      }
    },
    
    outlined: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: '2px',
      color: '#fff',
      borderRadius: { xs: '10px', md: '12px' },
      textTransform: 'none' as const,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: '2px'
      }
    }
  },
  
  chip: {
    default: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    draft: {
      backgroundColor: 'rgba(156, 163, 175, 0.2)',
      color: '#9ca3af',
      border: '1px solid rgba(156, 163, 175, 0.3)'
    },
    active: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
      border: '1px solid rgba(34, 197, 94, 0.3)'
    },
    shared: {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      color: '#3b82f6',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
    archived: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    }
  },

  // PCF-specific metric styles
  metric: {
    carbonFootprint: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '12px',
      padding: '16px'
    },
    low: {
      color: '#22c55e',
      background: 'rgba(34, 197, 94, 0.2)'
    },
    medium: {
      color: '#f59e0b',
      background: 'rgba(245, 158, 11, 0.2)'
    },
    high: {
      color: '#ef4444',
      background: 'rgba(239, 68, 68, 0.2)'
    }
  }
};

/**
 * Get emission level based on carbon footprint value
 */
export const getEmissionLevel = (carbonFootprint: number): 'low' | 'medium' | 'high' => {
  if (carbonFootprint < 100) return 'low';
  if (carbonFootprint < 500) return 'medium';
  return 'high';
};

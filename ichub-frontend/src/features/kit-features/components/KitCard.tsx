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

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip
} from '@mui/material';
import { Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
import { KitFeature } from '../types';

interface KitCardProps {
  kit: KitFeature;
  onToggle: (kitId: string, enabled: boolean) => void;
  onViewFeatures: (kitId: string) => void;
  isExpanded: boolean;
}

const KitCard: React.FC<KitCardProps> = ({ kit, onToggle, onViewFeatures, isExpanded }) => {
  const handleCardClick = () => {
    onToggle(kit.id, !kit.enabled);
  };

  const handleViewFeaturesClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se active el toggle
    onViewFeatures(kit.id);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' } = {
      core: 'primary',
      sustainability: 'success',
      quality: 'warning',
      traceability: 'secondary',
      collaboration: 'error'
    };
    return colors[category] || 'primary';
  };

  const getCategoryHexColor = (category: string, enabled: boolean) => {
    if (!enabled) return '#9e9e9e'; // Gris cuando está deshabilitado
    
    // Colores basados en la identidad visual de Tractus-X
    const colors: { [key: string]: string } = {
      core: '#0f71cb', // Azul Tractus-X principal
      sustainability: '#00aa44', // Verde sostenibilidad
      quality: '#ff6600', // Naranja calidad
      traceability: '#8b5a3c', // Marrón trazabilidad
      collaboration: '#e63946' // Rojo colaboración
    };
    return colors[category] || '#0f71cb';
  };

  return (
    <Card 
      className="kit-card"
      onClick={handleCardClick}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'row',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        },
        opacity: kit.enabled ? 1 : 0.7,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Barra lateral con ícono */}
      <Box
        className="kit-sidebar"
        sx={{
          width: '60px',
          background: getCategoryHexColor(kit.category, kit.enabled),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.3s ease',
          position: 'relative'
        }}
      >
        <Box className="kit-icon" sx={{ color: 'white', fontSize: '1.8rem' }}>
          {kit.icon}
        </Box>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent sx={{ flexGrow: 1, pb: 1, position: 'relative' }}>
          {/* Tag de estado arriba a la derecha */}
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Chip
              label={kit.enabled ? 'Enabled' : 'Disabled'}
              variant="outlined"
              sx={{
                backgroundColor: 'transparent',
                color: kit.enabled ? '#4caf50' : '#9e9e9e',
                borderColor: kit.enabled ? '#4caf50' : '#9e9e9e',
                borderWidth: '2px',
                fontWeight: 700,
                fontSize: '0.8rem',
                height: '32px',
                '& .MuiChip-label': {
                  px: 2,
                  py: 0.5
                }
              }}
            />
          </Box>

          <Box mb={2} sx={{ pr: 10 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {kit.name}
            </Typography>
            <Chip 
              label={kit.category.toUpperCase()} 
              size="small" 
              color={getCategoryColor(kit.category)}
              variant="outlined"
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {kit.description}
          </Typography>

          {/* Features expandibles */}
          {isExpanded && (
            <Box mt={2} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Features ({kit.features.length}):
              </Typography>
              <Box>
                {kit.features.map((feature, index) => (
                  <Chip 
                    key={index}
                    label={feature}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ p: 0 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            onClick={handleViewFeaturesClick}
            sx={{ 
              borderRadius: 0,
              borderTop: 1,
              borderLeft: 0,
              borderRight: 0,
              borderBottom: 0,
              borderColor: 'divider',
              py: 1.5,
              color: kit.enabled ? 'primary.main' : '#9e9e9e',
              '&:hover': {
                borderColor: kit.enabled ? 'primary.main' : '#bdbdbd',
                backgroundColor: kit.enabled ? 'rgba(25, 118, 210, 0.04)' : 'rgba(158, 158, 158, 0.04)'
              }
            }}
          >
            {isExpanded ? 'Hide' : 'View'} Features ({kit.features.length})
          </Button>
        </CardActions>
      </Box>
    </Card>
  );
};

export default KitCard;
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
import { Card, Box, Typography, Chip, createTheme, ThemeProvider } from '@mui/material';
import { Info, Factory, Public, CalendarToday, Recycling } from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { QRCodeSVG } from 'qrcode.react';
import { HeaderCardProps } from '../../../base';

/**
 * General Information Card
 * Displays product name, passport identifier, issuance/expiration dates, version, and status
 */
export const GeneralInfoCard: React.FC<HeaderCardProps> = ({ data, passportId }) => {
  const identification = data.identification as Record<string, any> | undefined;
  const metadata = data.metadata as Record<string, any> | undefined;
  const sustainability = data.sustainability as Record<string, any> | undefined;
  
  const productName = identification?.type?.nameAtManufacturer || 'Unknown Product';
  const passportIdentifier = metadata?.passportIdentifier || 'N/A';
  const issuanceDate = metadata?.issueDate || 'N/A';
  const expirationDate = metadata?.expirationDate || 'N/A';
  const version = metadata?.version || '1.0.0';
  const status = sustainability?.status || 'N/A';

  return (
    <Card
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.2)',
        borderRadius: '12px',
        p: { xs: 2, sm: 2.5, lg: 3 },
        height: '100%',
        minHeight: { xs: 'auto', lg: '180px' },
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, lg: 2 }, mb: { xs: 2, lg: 2.5 } }}>
        <Box
          sx={{
            p: { xs: 1, lg: 1.25 },
            borderRadius: '8px',
            background: 'rgba(102, 126, 234, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Info sx={{ fontSize: { xs: 20, lg: 24 }, color: '#667eea' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: { xs: '0.7rem', lg: '0.75rem' }, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            NAME
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem', lg: '1.1rem' }, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {productName}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(102, 126, 234, 0.3)'
          }}
        >
          <QRCodeSVG 
            value={passportId} 
            size={80}
            level="M"
            includeMargin={false}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Passport Identifier
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>
            {passportIdentifier}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 100 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
              Issuance Date
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
              {issuanceDate}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 100 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
              Expiration Date
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
              {expirationDate}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            minWidth: 70,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Version
            </Typography>
            <Typography variant="h6" sx={{
              color: '#667eea',
              fontWeight: 700,
              fontSize: '1.25rem',
              fontFamily: 'monospace'
            }}>
              {version}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            minWidth: 70,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Status
            </Typography>
            <Typography variant="h6" sx={{
              color: '#667eea',
              fontWeight: 700,
              fontSize: '1.25rem'
            }}>
              {status}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Manufacturing Information Card
 * Displays manufacturer ID, manufacturing date, part ID, product name, and physical dimensions
 */
export const ManufacturingCard: React.FC<HeaderCardProps> = ({ data }) => {
  const operation = data.operation as Record<string, any> | undefined;
  const identification = data.identification as Record<string, any> | undefined;
  const characteristics = data.characteristics as Record<string, any> | undefined;
  
  const manufacturerId = operation?.manufacturer?.manufacturer || 'N/A';
  const manufacturingDate = operation?.manufacturer?.manufacturingDate || 'N/A';
  const manufacturerPartId = identification?.type?.manufacturerPartId || 'N/A';
  const nameAtManufacturer = identification?.type?.nameAtManufacturer || 'N/A';

  // Physical dimensions
  const physicalDimension = characteristics?.physicalDimension || {};
  const width = physicalDimension.width ? `${physicalDimension.width.value} ${physicalDimension.width.unit?.replace('unit:', '') || 'mm'}` : 'N/A';
  const length = physicalDimension.length ? `${physicalDimension.length.value} ${physicalDimension.length.unit?.replace('unit:', '') || 'mm'}` : 'N/A';
  const height = physicalDimension.height ? `${physicalDimension.height.value} ${physicalDimension.height.unit?.replace('unit:', '') || 'mm'}` : 'N/A';
  const volume = physicalDimension.volume ? `${physicalDimension.volume.value} ${physicalDimension.volume.unit?.replace('unit:', '') || 'm³'}` : 'N/A';
  const diameter = physicalDimension.diameter ? `${physicalDimension.diameter.value} ${physicalDimension.diameter.unit?.replace('unit:', '') || 'mm'}` : 'N/A';

  return (
    <Card
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '12px',
        p: { xs: 2, sm: 2.5, lg: 3 },
        height: '100%',
        minHeight: { xs: 'auto', lg: '180px' },
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, lg: 2 }, mb: { xs: 2, lg: 2.5 } }}>
        <Box
          sx={{
            p: { xs: 1, lg: 1.25 },
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Factory sx={{ fontSize: { xs: 20, lg: 24 }, color: '#f59e0b' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: { xs: '0.7rem', lg: '0.75rem' }, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Manufacturer ID
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem', lg: '1.1rem' }, lineHeight: 1.3, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {manufacturerId}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: '45%' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
              Date of Manufacturing
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
              {manufacturingDate}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: '45%' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
              Manufacturer Part ID
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>
              {manufacturerPartId}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Name at Manufacturer
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
            {nameAtManufacturer}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1, justifyContent: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            minWidth: 80,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Width
            </Typography>
            <Typography variant="h6" sx={{
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              {width}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            minWidth: 80,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Length
            </Typography>
            <Typography variant="h6" sx={{
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              {length}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            minWidth: 80,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Height
            </Typography>
            <Typography variant="h6" sx={{
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              {height}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            minWidth: 80,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Volume
            </Typography>
            <Typography variant="h6" sx={{
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              {volume}
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            minWidth: 80,
            flex: 1
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', textAlign: 'center', mb: 0.5 }}>
              Diameter
            </Typography>
            <Typography variant="h6" sx={{
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '1rem',
              textAlign: 'center'
            }}>
              {diameter}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Sustainability Card
 * Displays CO2 footprint, durability score, and percentage of recyclable materials
 */
export const SustainabilityCard: React.FC<HeaderCardProps> = ({ data }) => {
  const sustainability = data.sustainability as Record<string, any> | undefined;
  const materials = data.materials as Record<string, any> | undefined;
  
  // Calculate total footprints by summing all values in each array
  const calculateFootprint = (footprintArray: any[]) => {
    if (!footprintArray || footprintArray.length === 0) return null;
    
    let total = 0;
    let unit = '';
    
    footprintArray.forEach((item: any) => {
      if (item.value) {
        total += parseFloat(item.value);
        if (!unit && item.unit) {
          unit = item.unit;
        }
      }
    });
    
    return total > 0 ? { value: total, unit } : null;
  };
  
  const carbonFootprint = calculateFootprint(sustainability?.productFootprint?.carbon);
  const environmentalFootprint = calculateFootprint(sustainability?.productFootprint?.environmental);
  const materialFootprint = calculateFootprint(sustainability?.productFootprint?.material);
  
  const durabilityScore = sustainability?.durabilityScore || 'N/A';

  // Calculate percentage of recyclable materials based on weighted average
  const calculateRecyclablePercentage = () => {
    const materialComposition = materials?.materialComposition?.content || [];
    if (materialComposition.length === 0) return 0;

    let totalWeightedRecycled = 0;
    let totalConcentration = 0;

    materialComposition.forEach((item: any) => {
      const concentration = item.concentration || 0;
      const recycled = item.recycled || 0;
      totalWeightedRecycled += (concentration * recycled);
      totalConcentration += concentration;
    });

    return totalConcentration > 0 ? (totalWeightedRecycled / totalConcentration) : 0;
  };

  const recyclablePercentage = calculateRecyclablePercentage();

  return (
    <Card
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.2)',
        borderRadius: '12px',
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(34, 197, 94, 0.15)'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Public sx={{ fontSize: 20, color: '#22c55e' }} />
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          SUSTAINABILITY
        </Typography>
      </Box>

      {/* Footprint Values - Top Row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        {carbonFootprint && (
          <Box sx={{
            flex: 1,
            minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', mb: 0.5, textAlign: 'center' }}>
              Carbon
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>
              {carbonFootprint.value} {carbonFootprint.unit}
            </Typography>
          </Box>
        )}
        {environmentalFootprint && (
          <Box sx={{
            flex: 1,
            minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', mb: 0.5, textAlign: 'center' }}>
              Environmental
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>
              {environmentalFootprint.value} {environmentalFootprint.unit}
            </Typography>
          </Box>
        )}
        {materialFootprint && (
          <Box sx={{
            flex: 1,
            minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
            p: 1.5,
            borderRadius: '8px',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', mb: 0.5, textAlign: 'center' }}>
              Material
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', textAlign: 'center' }}>
              {materialFootprint.value} {materialFootprint.unit}
            </Typography>
          </Box>
        )}
        {!carbonFootprint && !environmentalFootprint && !materialFootprint && (
          <Box sx={{ width: '100%', textAlign: 'center', py: 2 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem' }}>
              No footprint data available
            </Typography>
          </Box>
        )}
      </Box>

      {/* Scores - Bottom Row */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ 
          flex: 1,
          minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
          p: 2,
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', mb: 1, textAlign: 'center' }}>
            Durability Score
          </Typography>
          <Typography variant="h4" sx={{
            color: '#22c55e',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}>
            {durabilityScore}
          </Typography>
        </Box>
        <Box sx={{ 
          flex: 1,
          minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
          p: 2,
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem', mb: 1, textAlign: 'center' }}>
            Reparability Score
          </Typography>
          <Typography variant="h4" sx={{
            color: '#22c55e',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}>
            {sustainability?.reparabilityScore || 'N/A'}
          </Typography>
        </Box>
        <Box sx={{ 
          flex: 1,
          minWidth: { xs: 'calc(50% - 6px)', sm: 'calc(33.333% - 8px)' },
          p: 2,
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Recycling sx={{ fontSize: 18, color: '#22c55e', mb: 0.5 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.6rem', textAlign: 'center', mb: 0.5 }}>
            Recyclable
          </Typography>
          <Typography variant="h4" sx={{
            color: '#22c55e',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' }
          }}>
            {recyclablePercentage.toFixed(1)}%
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Materials Card
 * Displays material composition pie chart with single unit type
 */
export const MaterialsCard: React.FC<HeaderCardProps> = ({ data }) => {
  const materials = data.materials as Record<string, any> | undefined;
  
  // Material Composition data
  const materialComposition = materials?.materialComposition?.content || [];
  
  // Group materials by unit
  const materialsByUnit: Record<string, any[]> = materialComposition.reduce((acc: Record<string, any[]>, item: any) => {
    const unit = item.unit || 'unit n/a';
    if (!acc[unit]) {
      acc[unit] = [];
    }
    acc[unit].push(item);
    return acc;
  }, {});

  // Select the unit with the most materials, or the first one in case of a tie
  const selectedUnit = Object.keys(materialsByUnit).length > 0
    ? Object.keys(materialsByUnit).reduce((maxUnit, currentUnit) => 
        materialsByUnit[currentUnit].length > materialsByUnit[maxUnit].length 
          ? currentUnit 
          : maxUnit
      )
    : null;

  // Filter materials to the selected unit
  const compositionData = selectedUnit
    ? materialsByUnit[selectedUnit].map((item: any) => ({
        name: item.id?.[0]?.name || 'Unknown',
        value: item.concentration || 0,
        unit: item.unit || 'unit n/a'
      })).filter((item: any) => item.value > 0)
    : [];

  const hasCompositionData = compositionData.length > 0;

  const compositionColors = ['#8b5cf6', '#6366f1', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff'];

  // Create a theme for white text in charts
  const chartTheme = createTheme({
    palette: {
      mode: 'dark',
      text: {
        primary: '#ffffff',
        secondary: '#ffffff',
      },
    },
    components: {
      MuiChartsLegend: {
        styleOverrides: {
          root: {
            '& text': {
              fill: '#ffffff !important',
            },
          },
        },
      },
    },
  });

  return (
    <Card
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '12px',
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.15)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CalendarToday sx={{ fontSize: 20, color: '#8b5cf6' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Materials
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Material Composition */}
        {hasCompositionData ? (
          <ThemeProvider theme={chartTheme}>
            <Box sx={{
              '& svg text': {
                fill: 'white !important',
              },
              '& .MuiChartsLegend-series text': {
                fill: 'white !important',
              }
            }}>
              <PieChart
              series={[
                {
                  data: compositionData.map((item: any, index: number) => ({
                    id: index,
                    value: item.value,
                    label: item.name,
                    color: compositionColors[index % compositionColors.length]
                  })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                }
              ]}
              width={300}
              height={200}
              colors={compositionColors}
              slotProps={{
                legend: {
                  direction: 'column',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                  padding: 0,
                  itemMarkWidth: 12,
                  itemMarkHeight: 12,
                  markGap: 8,
                  itemGap: 8,
                  labelStyle: {
                    fontSize: '11px',
                    fill: 'white',
                  },
                },
              }}
              sx={{
                '& .MuiChartsLegend-series text': {
                  fill: 'white !important',
                  fontSize: '11px !important',
                },
                '& .MuiPieArc-root': {
                  stroke: 'rgba(255, 255, 255, 0.1)',
                  strokeWidth: 1,
                },
              }}
              />
              {selectedUnit && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)', 
                    fontSize: '0.7rem', 
                    textAlign: 'center',
                    display: 'block',
                    mt: -1
                  }}
                >
                  {selectedUnit}
                </Typography>
              )}
            </Box>
          </ThemeProvider>
        ) : (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', textAlign: 'center', py: 1 }}>
            No data
          </Typography>
        )}
      </Box>
    </Card>
  );
};

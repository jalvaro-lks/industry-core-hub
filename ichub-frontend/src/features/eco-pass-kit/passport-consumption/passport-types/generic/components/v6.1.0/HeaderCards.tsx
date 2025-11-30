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
import { Card, Box, Typography, Chip } from '@mui/material';
import { Info, Factory, Public, CalendarToday } from '@mui/icons-material';
import { HeaderCardProps } from '../../../base';

/**
 * General Information Card
 * Displays product name, passport identifier, issuance/expiration dates, version, and status
 */
export const GeneralInfoCard: React.FC<HeaderCardProps> = ({ data }) => {
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
 * Displays manufacturer ID, manufacturing date, part ID, and product name
 */
export const ManufacturingCard: React.FC<HeaderCardProps> = ({ data }) => {
  const operation = data.operation as Record<string, any> | undefined;
  const identification = data.identification as Record<string, any> | undefined;
  
  const manufacturerId = operation?.manufacturer?.manufacturer || 'N/A';
  const manufacturingDate = operation?.manufacturer?.manufacturingDate || 'N/A';
  const manufacturerPartId = identification?.type?.manufacturerPartId || 'N/A';
  const nameAtManufacturer = identification?.type?.nameAtManufacturer || 'N/A';

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
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Date of Manufacturing
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
            {manufacturingDate}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Manufacturer Part ID
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>
            {manufacturerPartId}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Name at Manufacturer
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: 500 }}>
            {nameAtManufacturer}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Sustainability Card
 * Displays CO2 footprint and durability score
 */
export const SustainabilityCard: React.FC<HeaderCardProps> = ({ data }) => {
  const sustainability = data.sustainability as Record<string, any> | undefined;
  
  const co2Footprint = sustainability?.productFootprint?.carbon?.[0]?.value 
    ? `${sustainability.productFootprint.carbon[0].value} ${sustainability.productFootprint.carbon[0].unit || 'kg CO2'}`
    : 'N/A';
  const durabilityScore = sustainability?.durabilityScore || 'N/A';

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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CARBON FOOTPRINT
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.3 }}>
            {co2Footprint}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          p: 2,
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          minWidth: { xs: 80, sm: 90 },
          flex: 1
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', textAlign: 'center', mb: 1 }}>
            Durability Score
          </Typography>
          <Typography variant="h4" sx={{
            color: '#22c55e',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem' }
          }}>
            {durabilityScore}
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          p: 2,
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          minWidth: { xs: 80, sm: 90 },
          flex: 1
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', textAlign: 'center', mb: 1 }}>
            Reparability Score
          </Typography>
          <Typography variant="h4" sx={{
            color: '#22c55e',
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem' }
          }}>
            {sustainability?.reparabilityScore || 'N/A'}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

/**
 * Materials Card
 * Displays material composition and substances of concern pie charts
 */
export const MaterialsCard: React.FC<HeaderCardProps> = ({ data }) => {
  const materials = data.materials as Record<string, any> | undefined;
  
  // Material Composition data
  const materialComposition = materials?.materialComposition?.content || [];
  
  // Substances of Concern data
  const substancesOfConcern = materials?.substancesOfConcern?.content || [];
  
  // Calculate totals for material composition - using concentration values
  const compositionData = materialComposition.map((item: any) => ({
    name: item.id?.[0]?.name || 'Unknown',
    value: item.concentration ? (item.concentration / 10000) : 0 // Convert PPM to percentage
  })).filter((item: any) => item.value > 0);
  
  // Calculate totals for substances of concern - using concentration values
  const concernData = substancesOfConcern.map((item: any) => ({
    name: item.id?.[0]?.name || 'Unknown',
    value: item.concentration || 0
  })).filter((item: any) => item.value > 0);

  const hasCompositionData = compositionData.length > 0;
  const hasConcernData = concernData.length > 0;

  const renderPieChart = (data: any[], colors: string[]) => {
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
    if (total === 0) return null;

    let currentAngle = -90;
    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;

      return (
        <path
          key={index}
          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={colors[index % colors.length]}
          opacity="0.9"
        />
      );
    });
  };

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
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', mb: 1, display: 'block', textAlign: 'center' }}>
            Material Composition
          </Typography>
          {hasCompositionData ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 100 100">
                  {renderPieChart(compositionData, ['#8b5cf6', '#6366f1', '#a78bfa', '#c4b5fd', '#ddd6fe'])}
                </svg>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {compositionData.slice(0, 3).map((item: any, index: number) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ['#8b5cf6', '#6366f1', '#a78bfa'][index], flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                      {item.name} {item.value.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', textAlign: 'center', py: 1 }}>
              No data
            </Typography>
          )}
        </Box>

        {/* Substances of Concern */}
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem', mb: 1, display: 'block', textAlign: 'center' }}>
            Substances of Concern
          </Typography>
          {hasConcernData ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 100 100">
                  {renderPieChart(concernData, ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#fbbf24'])}
                </svg>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {concernData.slice(0, 3).map((item: any, index: number) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ['#ef4444', '#f97316', '#f59e0b'][index], flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.7rem' }}>
                      {item.name} {item.value.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', textAlign: 'center', py: 1 }}>
              No data
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
};

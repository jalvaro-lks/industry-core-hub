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
import { Box, Typography, Paper } from '@mui/material';

interface CompositionItem {
  name: string;
  value: number;
  unit?: string;
  color?: string;
}

interface CompositionChartProps {
  title: string;
  items: CompositionItem[];
}

const CHART_COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0'
];

export const CompositionChart: React.FC<CompositionChartProps> = ({ title, items }) => {
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.value, 0);

  // Calculate percentages and add colors
  const itemsWithPercentages = items.map((item, index) => ({
    ...item,
    percentage: (item.value / total) * 100,
    color: item.color || CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Sort by percentage descending
  const sortedItems = [...itemsWithPercentages].sort((a, b) => b.percentage - a.percentage);

  // Calculate cumulative percentages for pie chart segments
  let cumulativePercentage = 0;
  const segments = sortedItems.map((item) => {
    const startPercentage = cumulativePercentage;
    cumulativePercentage += item.percentage;
    return {
      ...item,
      startPercentage,
      endPercentage: cumulativePercentage
    };
  });

  // Convert percentage to SVG path
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x, y];
  };

  const createArc = (startPercent: number, endPercent: number) => {
    const start = getCoordinatesForPercent(startPercent / 100);
    const end = getCoordinatesForPercent(endPercent / 100);
    const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;

    return [
      `M ${start[0]} ${start[1]}`,
      `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
      'L 0 0'
    ].join(' ');
  };

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2
      }}
    >
      <Typography variant="h6" sx={{ mb: { xs: 2, sm: 3 }, color: '#fff', fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {title}
      </Typography>

      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
        {/* Pie Chart */}
        <Box sx={{ flex: { xs: '1 1 150px', sm: '0 0 200px' }, maxWidth: { xs: '150px', sm: '200px' }, width: '100%' }}>
          <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArc(segment.startPercentage, segment.endPercentage)}
                fill={segment.color}
                opacity={0.9}
                style={{
                  transition: 'opacity 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
              />
            ))}
          </svg>
        </Box>

        {/* Legend */}
        <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}>
          {sortedItems.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: { xs: 1, sm: 1.5 },
                p: { xs: 0.75, sm: 1 },
                borderRadius: 1,
                transition: 'background 0.2s',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flex: 1 }}>
                <Box
                  sx={{
                    width: { xs: 10, sm: 12 },
                    height: { xs: 10, sm: 12 },
                    borderRadius: '50%',
                    bgcolor: item.color,
                    flexShrink: 0
                  }}
                />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {item.name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', ml: { xs: 1, sm: 2 } }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {item.percentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {item.value} {item.unit || ''}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

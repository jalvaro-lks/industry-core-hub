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
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Container,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Co2 as Co2Icon,
  VerifiedUser as VerifiedUserIcon,
  Factory as FactoryIcon,
  CalendarMonth as CalendarIcon,
  Public as PublicIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { PCFData } from '../api/pcfConsumptionApi';
import { pcfCardStyles, getEmissionLevel } from '../../pcf-provision/styles/cardStyles';
import { QRCodeSVG } from 'qrcode.react';

interface PcfVisualizationProps {
  data: PCFData;
  discoveryId: string;
  onBack: () => void;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

const formatNumber = (value: number | undefined, decimals: number = 2): string => {
  if (value === undefined || value === null) return '-';
  return value.toFixed(decimals);
};

const PcfVisualization: React.FC<PcfVisualizationProps> = ({ data, discoveryId, onBack }) => {
  const [copySuccess, setCopySuccess] = React.useState(false);
  
  const emissionLevel = getEmissionLevel(data.pcfExcludingBiogenic);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discoveryId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcf-${data.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton
          onClick={onBack}
          sx={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <ArrowBackIcon sx={{ color: 'white' }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" color="white" fontWeight={700}>
            Product Carbon Footprint
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.productNameCompany}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': { borderColor: '#22c55e' }
          }}
        >
          Export JSON
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Carbon Footprint Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Co2Icon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Carbon Footprint
                </Typography>
              </Box>

              {/* Main PCF Value */}
              <Box
                sx={{
                  ...pcfCardStyles.metric.carbonFootprint,
                  ...pcfCardStyles.metric[emissionLevel],
                  mb: 3,
                  textAlign: 'center',
                  py: 4
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  PCF Excluding Biogenic
                </Typography>
                <Typography 
                  variant="h2" 
                  fontWeight={700} 
                  sx={{ color: pcfCardStyles.metric[emissionLevel].color }}
                >
                  {formatNumber(data.pcfExcludingBiogenic)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  kg CO₂ equivalent
                </Typography>
              </Box>

              {/* PCF Including Biogenic */}
              {data.pcfIncludingBiogenic !== undefined && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <Typography variant="caption" color="text.secondary">
                    PCF Including Biogenic
                  </Typography>
                  <Typography variant="h5" color="white" fontWeight={600}>
                    {formatNumber(data.pcfIncludingBiogenic)} kg CO₂e
                  </Typography>
                </Box>
              )}

              {/* Discovery ID with QR */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
                <Box
                  sx={{
                    p: 1,
                    backgroundColor: 'white',
                    borderRadius: '8px'
                  }}
                >
                  <QRCodeSVG value={discoveryId} size={56} level="M" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">
                    Discovery ID
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      color="white"
                      sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {discoveryId}
                    </Typography>
                    <Tooltip title={copySuccess ? 'Copied!' : 'Copy'}>
                      <IconButton
                        size="small"
                        onClick={handleCopy}
                        sx={{ color: copySuccess ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
                      >
                        {copySuccess ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emissions Breakdown */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <AssessmentIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Emissions Breakdown
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <EmissionRow 
                  label="Fossil GHG Emissions" 
                  value={data.fossilGhgEmissions} 
                  color="#ef4444" 
                />
                <EmissionRow 
                  label="Aircraft GHG Emissions" 
                  value={data.aircraftGhgEmissions} 
                  color="#f97316" 
                />
                <EmissionRow 
                  label="Packaging GHG Emissions" 
                  value={data.packagingGhgEmissions} 
                  color="#eab308" 
                />
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <EmissionRow 
                  label="Fossil Carbon Content" 
                  value={data.fossilCarbonContent} 
                  color="#64748b" 
                />
                <EmissionRow 
                  label="Biogenic Carbon Content" 
                  value={data.biogenicCarbonContent} 
                  color="#22c55e" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Product Information */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <InventoryIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Product Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow label="Product Name" value={data.productNameCompany} />
                <InfoRow label="Description" value={data.productDescription} />
                <InfoRow label="CPC Category" value={data.productCategoryCpc} />
                <InfoRow 
                  label="Product IDs" 
                  value={data.productIds?.join(', ') || '-'} 
                  mono 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FactoryIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Company Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow label="Company Name" value={data.companyName} />
                <InfoRow 
                  label="Company IDs (BPN)" 
                  value={data.companyIds?.join(', ') || '-'} 
                  mono 
                />
                <InfoRow label="Geography" value={data.geographyCountry || '-'} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reference Period */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CalendarIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Reference Period
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <InfoRow label="Start Date" value={formatDate(data.referencePeriodStart)} />
                <InfoRow label="End Date" value={formatDate(data.referencePeriodEnd)} />
                <InfoRow label="Characterization Factors" value={data.characterizationFactors} />
                <InfoRow 
                  label="Primary Data Share" 
                  value={data.primaryDataShare ? `${data.primaryDataShare}%` : '-'} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assurance Information */}
        {data.assurance && (
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={pcfCardStyles.card}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <VerifiedUserIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                  <Typography variant="h6" color="white" fontWeight={600}>
                    Assurance
                  </Typography>
                  <Chip
                    label="Verified"
                    size="small"
                    sx={{
                      ml: 'auto',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                      fontWeight: 600
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <InfoRow label="Provider" value={data.assurance.providerName || '-'} />
                  <InfoRow label="Coverage" value={data.assurance.coverage || '-'} />
                  <InfoRow label="Level" value={data.assurance.level || '-'} />
                  <InfoRow label="Boundary" value={data.assurance.boundary || '-'} />
                  <InfoRow label="Standard" value={data.assurance.standardName || '-'} />
                  <InfoRow 
                    label="Completed" 
                    value={data.assurance.completedAt ? formatDate(data.assurance.completedAt) : '-'} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Data Quality Indicators */}
        {data.dqi && (
          <Grid item xs={12}>
            <Card sx={pcfCardStyles.card}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <ScienceIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                  <Typography variant="h6" color="white" fontWeight={600}>
                    Data Quality Indicators (DQI)
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <DQICard label="Coverage" value={data.dqi.coveragePercent} unit="%" />
                  <DQICard label="Technological DQR" value={data.dqi.technologicalDQR} />
                  <DQICard label="Temporal DQR" value={data.dqi.temporalDQR} />
                  <DQICard label="Geographical DQR" value={data.dqi.geographicalDQR} />
                  <DQICard label="Completeness DQR" value={data.dqi.completenessDQR} />
                  <DQICard label="Reliability DQR" value={data.dqi.reliabilityDQR} />
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Metadata */}
        <Grid item xs={12}>
          <Card sx={pcfCardStyles.card}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PublicIcon sx={{ color: '#22c55e', fontSize: 28 }} />
                <Typography variant="h6" color="white" fontWeight={600}>
                  Metadata
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoRow label="Spec Version" value={data.specVersion} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoRow label="Data Version" value={String(data.version)} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoRow label="Status" value={data.status} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <InfoRow label="Created" value={formatDate(data.created)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// Helper Components
const EmissionRow: React.FC<{ label: string; value?: number; color: string }> = ({ label, value, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" color="white" fontWeight={500}>
      {value !== undefined ? `${formatNumber(value)} kg CO₂e` : '-'}
    </Typography>
  </Box>
);

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography 
      variant="body2" 
      color="white" 
      sx={mono ? { fontFamily: 'monospace', fontSize: '0.8rem' } : undefined}
    >
      {value}
    </Typography>
  </Box>
);

const DQICard: React.FC<{ label: string; value?: number; unit?: string }> = ({ label, value, unit = '' }) => (
  <Grid item xs={6} sm={4} md={2}>
    <Paper
      sx={{
        p: 2,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        textAlign: 'center'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="h5" color="#22c55e" fontWeight={600}>
        {value !== undefined ? `${formatNumber(value, 1)}${unit}` : '-'}
      </Typography>
    </Paper>
  </Grid>
);

export default PcfVisualization;

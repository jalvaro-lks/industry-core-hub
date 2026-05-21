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
  Divider,
  FormControlLabel,
  Grid2,
  InputAdornment,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Factory, LocalShipping, Inventory } from '@mui/icons-material';
import {
  ProductLifeCycleStagesAndEmissionsEntity,
  ProductionStageEntity,
  DistributionStageEntity,
  PackagingStageEntity,
  createEmptyProductLifeCycleStagesAndEmissions,
  createEmptyProductionStage,
  createEmptyDistributionStage,
  createEmptyPackagingStage,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';

const PCF_PRIMARY = '#10b981';

interface EmissionsEditSectionProps {
  items: ProductLifeCycleStagesAndEmissionsEntity[];
  onChange: (items: ProductLifeCycleStagesAndEmissionsEntity[]) => void;
}

/** Helper to parse numeric input, defaulting to undefined for empty strings. */
const pn = (raw: string): number | undefined => {
  const v = parseFloat(raw);
  return isNaN(v) ? undefined : v;
};

/** Shared numeric emission field. */
const EmField: React.FC<{
  label: string;
  value: number | undefined | null;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  required?: boolean;
  helperText?: string;
}> = ({ label, value, onChange, min, max, required, helperText }) => (
  <TextField
    fullWidth
    size="small"
    type="number"
    label={label}
    required={required}
    value={value ?? ''}
    onChange={(e) => onChange(pn(e.target.value))}
    className="pcf-edit-page__input"
    inputProps={{ min, max, step: 'any' }}
    InputProps={{
      endAdornment: <InputAdornment position="end">kg CO₂e</InputAdornment>,
    }}
    helperText={helperText}
    FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' } }}
  />
);

// ---------------------------------------------------------------------------
// Sub-renderers for each stage
// ---------------------------------------------------------------------------

const renderProductionStage = (
  item: ProductionStageEntity,
  _index: number,
  onItemChange: (updated: ProductionStageEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <EmField label="PCF Incl. Biogenic Uptake" value={item.pcfIncludingBiogenicUptake} required
        onChange={(v) => onItemChange({ ...item, pcfIncludingBiogenicUptake: v ?? 0 })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <EmField label="PCF Excl. Biogenic Uptake" value={item.pcfExcludingBiogenicUptake} required min={0}
        onChange={(v) => onItemChange({ ...item, pcfExcludingBiogenicUptake: v ?? 0 })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Fossil GHG Emissions" value={item.fossilGhgEmissions} min={0}
        onChange={(v) => onItemChange({ ...item, fossilGhgEmissions: v })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Biogenic Non-CO₂ Emissions" value={item.biogenicNonCO2Emissions} min={0}
        onChange={(v) => onItemChange({ ...item, biogenicNonCO2Emissions: v })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Biogenic CO₂ Uptake" value={item.biogenicCO2Uptake} max={0}
        onChange={(v) => onItemChange({ ...item, biogenicCO2Uptake: v })}
        helperText="Must be ≤ 0 (CO₂ absorbed)" />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Land Use Change GHG" value={item.landUseChangeGhgEmissions} min={0}
        onChange={(v) => onItemChange({ ...item, landUseChangeGhgEmissions: v })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Land Mgmt Biogenic CO₂" value={item.landManagementBiogenicCO2Emissions} min={0}
        onChange={(v) => onItemChange({ ...item, landManagementBiogenicCO2Emissions: v })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <EmField label="Pkg Land Mgmt Biogenic CO₂" value={item.packagingLandManagementBiogenicCO2Emissions} min={0}
        onChange={(v) => onItemChange({ ...item, packagingLandManagementBiogenicCO2Emissions: v })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <EmField label="Land Mgmt CO₂ Removals" value={item.landManagementBiogenicCO2Removals} max={0}
        onChange={(v) => onItemChange({ ...item, landManagementBiogenicCO2Removals: v })}
        helperText="Must be ≤ 0 (removals)" />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <EmField label="Aircraft GHG Emissions" value={item.aircraftGhgEmissions} min={0}
        onChange={(v) => onItemChange({ ...item, aircraftGhgEmissions: v })} />
    </Grid2>
  </Grid2>
);

const renderDistributionStage = (
  item: DistributionStageEntity,
  _index: number,
  onItemChange: (updated: DistributionStageEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12 }}>
      <FormControlLabel
        control={
          <Switch
            checked={item.distributionStageIncluded}
            onChange={(e) => onItemChange({ ...item, distributionStageIncluded: e.target.checked })}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: PCF_PRIMARY },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PCF_PRIMARY },
            }}
          />
        }
        label={<Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Distribution Stage Included</Typography>}
      />
    </Grid2>
    {item.distributionStageIncluded && (
      <>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Dist. PCF Incl. Biogenic" value={item.distributionStagePcfIncludingBiogenicUptake}
            onChange={(v) => onItemChange({ ...item, distributionStagePcfIncludingBiogenicUptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Dist. PCF Excl. Biogenic" value={item.distributionStagePcfExcludingBiogenicUptake} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStagePcfExcludingBiogenicUptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Fossil GHG" value={item.distributionStageFossilGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStageFossilGhgEmissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Biogenic Non-CO₂" value={item.distributionStageBiogenicNonCO2Emissions} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStageBiogenicNonCO2Emissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Biogenic CO₂ Uptake" value={item.distributionStageBiogenicCO2Uptake} max={0}
            onChange={(v) => onItemChange({ ...item, distributionStageBiogenicCO2Uptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Land Use Change GHG" value={item.distributionStageLandUseChangeGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStageLandUseChangeGhgEmissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Land Mgmt Biogenic CO₂" value={item.distributionStageLandManagementBiogenicCO2Emissions} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStageLandManagementBiogenicCO2Emissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Dist. Land Mgmt CO₂ Removals" value={item.distributionStageLandManagementBiogenicCO2Removals} max={0}
            onChange={(v) => onItemChange({ ...item, distributionStageLandManagementBiogenicCO2Removals: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Dist. Aircraft GHG" value={item.distributionStageAircraftGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, distributionStageAircraftGhgEmissions: v })} />
        </Grid2>
      </>
    )}
  </Grid2>
);

const renderPackagingStage = (
  item: PackagingStageEntity,
  _index: number,
  onItemChange: (updated: PackagingStageEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12 }}>
      <FormControlLabel
        control={
          <Switch
            checked={item.packagingEmissionsIncluded}
            onChange={(e) => onItemChange({ ...item, packagingEmissionsIncluded: e.target.checked })}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: PCF_PRIMARY },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PCF_PRIMARY },
            }}
          />
        }
        label={<Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Packaging Emissions Included</Typography>}
      />
    </Grid2>
    {item.packagingEmissionsIncluded && (
      <>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Pkg PCF Incl. Biogenic" value={item.packagingPcfIncludingBiogenicUptake} min={0}
            onChange={(v) => onItemChange({ ...item, packagingPcfIncludingBiogenicUptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Pkg PCF Excl. Biogenic" value={item.packagingPcfExcludingBiogenicUptake} min={0}
            onChange={(v) => onItemChange({ ...item, packagingPcfExcludingBiogenicUptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Fossil GHG" value={item.packagingFossilGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, packagingFossilGhgEmissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Biogenic Non-CO₂" value={item.packagingBiogenicNonCO2Emissions} min={0}
            onChange={(v) => onItemChange({ ...item, packagingBiogenicNonCO2Emissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Biogenic CO₂ Uptake" value={item.packagingBiogenicCO2Uptake} max={0}
            onChange={(v) => onItemChange({ ...item, packagingBiogenicCO2Uptake: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Land Use Change GHG" value={item.packagingLandUseChangeGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, packagingLandUseChangeGhgEmissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Land Mgmt Biogenic CO₂" value={item.packagingLandManagementBiogenicCO2Emissions} min={0}
            onChange={(v) => onItemChange({ ...item, packagingLandManagementBiogenicCO2Emissions: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <EmField label="Pkg Land Mgmt CO₂ Removals" value={item.packagingLandManagementBiogenicCO2Removals} max={0}
            onChange={(v) => onItemChange({ ...item, packagingLandManagementBiogenicCO2Removals: v })} />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <EmField label="Pkg Aircraft GHG" value={item.packagingAircraftGhgEmissions} min={0}
            onChange={(v) => onItemChange({ ...item, packagingAircraftGhgEmissions: v })} />
        </Grid2>
      </>
    )}
  </Grid2>
);

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

/**
 * Edit section for productLifeCycleStagesAndEmissions.
 * Each top-level entry contains three nested stage arrays:
 * Production, Distribution, and Packaging.
 */
const EmissionsEditSection: React.FC<EmissionsEditSectionProps> = ({ items, onChange }) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyProductLifeCycleStagesAndEmissions}
    title="Product Life Cycle Stages & Emissions"
    itemLabel={(_item, idx) => `Life Cycle Entry ${idx + 1}`}
    renderItem={(item, _index, onItemChange) => (
      <Box>
        {/* ── Production Stage ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Factory sx={{ fontSize: 16, color: PCF_PRIMARY }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Production Stage
          </Typography>
        </Box>
        <ArraySectionEditor
          items={item.productionStage ?? []}
          onChange={(ps) => onItemChange({ ...item, productionStage: ps })}
          createItem={createEmptyProductionStage}
          itemLabel={(p) => `PCF excl: ${p.pcfExcludingBiogenicUptake}`}
          renderItem={renderProductionStage}
        />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

        {/* ── Distribution Stage ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocalShipping sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Distribution Stage
          </Typography>
        </Box>
        <ArraySectionEditor
          items={item.distributionStage ?? []}
          onChange={(ds) => onItemChange({ ...item, distributionStage: ds })}
          createItem={createEmptyDistributionStage}
          itemLabel={(d) => d.distributionStageIncluded ? 'Included' : 'Not Included'}
          renderItem={renderDistributionStage}
        />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

        {/* ── Packaging Stage ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Inventory sx={{ fontSize: 16, color: '#667eea' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Packaging Stage
          </Typography>
        </Box>
        <ArraySectionEditor
          items={item.packagingStage ?? []}
          onChange={(ps) => onItemChange({ ...item, packagingStage: ps })}
          createItem={createEmptyPackagingStage}
          itemLabel={(p) => p.packagingEmissionsIncluded ? 'Included' : 'Not Included'}
          renderItem={renderPackagingStage}
        />
      </Box>
    )}
  />
);

export default EmissionsEditSection;

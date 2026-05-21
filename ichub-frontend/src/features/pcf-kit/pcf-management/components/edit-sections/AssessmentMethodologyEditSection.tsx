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

import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  FormControlLabel,
  Grid2,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandMore,
  BarChart,
  Science,
  Fingerprint,
  CropFree,
  Public,
  CalendarMonth,
  VerifiedUser,
  Balance,
  Gavel,
  Thermostat,
  AccountTree,
} from '@mui/icons-material';
import {
  PcfAssessmentAndMethodologyEntity,
  DataSourcesAndQualityEntity,
  TechnologyEntity,
  IdAndVersionEntity,
  BoundarySpecificationsEntity,
  GeographyEntity,
  TimeEntity,
  VerificationEntity,
  MassBalancingInformationEntity,
  StandardsEntity,
  GwpCharacterizationFactorDetailsEntity,
  AllocationInForegroundEntity,
  PcfAssessmentInformationEntity,
  PcfMethodologyEntity,
  createEmptyPcfAssessmentAndMethodology,
  createEmptyDataSourcesAndQuality,
  createEmptyTechnology,
  createEmptyIdAndVersion,
  createEmptyBoundarySpecifications,
  createEmptyGeography,
  createEmptyTime,
  createEmptyPcfAssessmentInformation,
  createEmptyVerification,
  createEmptyMassBalancingInformation,
  createEmptyStandards,
  createEmptyGwpCharacterizationFactorDetails,
  createEmptyAllocationInForeground,
  createEmptyPcfMethodology,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';
import TagInput from './TagInput';
import './AssessmentMethodologyEditSection.scss';

const PCF_PRIMARY = '#10b981';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GEOGRAPHY_REGIONS = [
  'Africa', 'Americas', 'Asia', 'Europe', 'Oceania',
  'Australia and New Zealand', 'Central Asia', 'Eastern Asia', 'Eastern Europe',
  'Latin America and the Caribbean', 'Melanesia', 'Micronesia', 'Northern Africa',
  'Northern America', 'Northern Europe', 'Polynesia', 'South-eastern Asia',
  'Southern Asia', 'Southern Europe', 'Sub-Saharan Africa', 'Western Asia',
  'Western Europe', 'Global', 'Several',
] as const;

const COUNTRY_CODES = [
  'DE', 'US', 'CN', 'JP', 'KR', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT',
  'CH', 'PL', 'CZ', 'SK', 'HU', 'RO', 'SE', 'NO', 'DK', 'FI', 'PT', 'GR',
  'TR', 'MX', 'BR', 'IN', 'CA', 'AU', 'ZA', 'AR', 'CL', 'TH', 'ID', 'MY',
  'VN', 'PH', 'SG', 'TW', 'HK', 'SA', 'AE', 'IL', 'EG', 'NG', 'KE',
] as const;

const PCF_STATUS_OPTIONS = ['Active', 'Deprecated'] as const;

const RETRO_PROSPECTIVE_OPTIONS = [
  'Retrospective PCF',
  'Prospective PCF without forerunner',
  'Prospective PCF of further developed product with forerunner',
  'Prospective PCF for current product for future production date',
  'Progressive PCF',
] as const;

const IPCC_OPTIONS = ['AR4', 'AR5', 'AR6', 'unspecified'] as const;

const WASTE_INCINERATION_OPTIONS = [
  'cut-off', 'reverse cut-off', 'system expansion', 'polluter pays principle',
] as const;

const RECYCLED_CARBON_OPTIONS = ['upstream system expansion', 'cut-off'] as const;

const FREE_ATTRIBUTION_OPTIONS = ['true', 'false', 'not applicable'] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssessmentMethodologyEditSectionProps {
  items: PcfAssessmentAndMethodologyEntity[];
  onChange: (items: PcfAssessmentAndMethodologyEntity[]) => void;
}

// ---------------------------------------------------------------------------
// Accordion sub-section helper
// ---------------------------------------------------------------------------

interface SubSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SubSection: React.FC<SubSectionProps> = ({ title, icon, expanded, onToggle, children }) => (
  <Accordion
    expanded={expanded}
    onChange={onToggle}
    className="assessment-edit__sub-accordion"
    disableGutters
  >
    <AccordionSummary
      expandIcon={<ExpandMore sx={{ color: 'rgba(255,255,255,0.4)' }} />}
      className="assessment-edit__sub-summary"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        <Typography className="assessment-edit__sub-title">{title}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails className="assessment-edit__sub-details">
      {children}
    </AccordionDetails>
  </Accordion>
);

// ---------------------------------------------------------------------------
// Small render helpers for nested arrays within assessment info
// ---------------------------------------------------------------------------

const pn = (raw: string): number | undefined => {
  const v = parseFloat(raw);
  return isNaN(v) ? undefined : v;
};

const renderDataSources = (
  item: DataSourcesAndQualityEntity,
  _i: number,
  onChange: (u: DataSourcesAndQualityEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="Primary Data Share (%)"
        value={item.primaryDataShare ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 100, step: 'any' }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, primaryDataShare: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="Technological DQR (1–5)"
        value={item.technologicalDQR ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 1, max: 5, step: 0.1 }}
        onChange={(e) => onChange({ ...item, technologicalDQR: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="Temporal DQR (1–5)"
        value={item.temporalDQR ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 1, max: 5, step: 0.1 }}
        onChange={(e) => onChange({ ...item, temporalDQR: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="Geographical DQR (1–5)"
        value={item.geographicalDQR ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 1, max: 5, step: 0.1 }}
        onChange={(e) => onChange({ ...item, geographicalDQR: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12 }}>
      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Secondary Emission Factor Sources
      </Typography>
      <TagInput
        values={item.secondaryEmissionFactorSources ?? []}
        onChange={(v) => onChange({ ...item, secondaryEmissionFactorSources: v })}
        placeholder="e.g. ecoinvent 3.9.1"
      />
    </Grid2>
  </Grid2>
);

const renderTechnology = (
  item: TechnologyEntity,
  _i: number,
  onChange: (u: TechnologyEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <FormControlLabel
        control={
          <Switch checked={item.ccsTechnologicalCO2CaptureIncluded}
            onChange={(e) => onChange({ ...item, ccsTechnologicalCO2CaptureIncluded: e.target.checked })}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PCF_PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PCF_PRIMARY } }} />
        }
        label={<Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>CCS/BECCS Technology Included</Typography>}
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField fullWidth size="small" label="Boundary Processes Description"
        value={item.boundaryProcessesDescription ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, boundaryProcessesDescription: e.target.value || undefined })} />
    </Grid2>
  </Grid2>
);

const renderIdAndVersion = (
  item: IdAndVersionEntity,
  _i: number,
  onChange: (u: IdAndVersionEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField fullWidth size="small" label="PCF ID (UUID)" required
        value={item.id} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, id: e.target.value })}
        placeholder="urn:uuid:..." />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 2 }}>
      <TextField fullWidth size="small" type="number" label="Version" required
        value={item.version} className="pcf-edit-page__input"
        inputProps={{ min: 0 }}
        onChange={(e) => onChange({ ...item, version: parseInt(e.target.value) || 0 })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Status" required
        value={item.status} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, status: e.target.value as IdAndVersionEntity['status'] })}>
        {PCF_STATUS_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField select fullWidth size="small" label="PCF Type" required
        value={item.retroOrProspectivePcfType ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, retroOrProspectivePcfType: e.target.value })}>
        {RETRO_PROSPECTIVE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
  </Grid2>
);

const renderBoundary = (
  item: BoundarySpecificationsEntity,
  _i: number,
  onChange: (u: BoundarySpecificationsEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" type="number" label="Exempted Emissions (%)" required
        value={item.exemptedEmissionsPercent} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 10, step: 0.1 }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, exemptedEmissionsPercent: parseFloat(e.target.value) || 0 })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 8 }}>
      <TextField fullWidth size="small" label="Exempted Emissions Description"
        value={item.exemptedEmissionsDescription ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, exemptedEmissionsDescription: e.target.value || undefined })} />
    </Grid2>
  </Grid2>
);

const renderGeography = (
  item: GeographyEntity,
  _i: number,
  onChange: (u: GeographyEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Region or Subregion" required
        value={item.geographyRegionOrSubregion} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, geographyRegionOrSubregion: e.target.value })}>
        {GEOGRAPHY_REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Country"
        value={item.geographyCountry ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, geographyCountry: e.target.value || undefined })}>
        <MenuItem value=""><em>— None —</em></MenuItem>
        {COUNTRY_CODES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" label="Country Subdivision (ISO 3166-2)"
        value={item.geographyCountrySubdivision ?? ''} className="pcf-edit-page__input"
        placeholder="e.g. DE-BY"
        onChange={(e) => onChange({ ...item, geographyCountrySubdivision: e.target.value || undefined })} />
    </Grid2>
  </Grid2>
);

const renderTime = (
  item: TimeEntity,
  _i: number,
  onChange: (u: TimeEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" type="datetime-local" label="Reference Period Start" required
        value={item.referencePeriodStart ? item.referencePeriodStart.slice(0, 16) : ''} className="pcf-edit-page__input"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ ...item, referencePeriodStart: e.target.value ? `${e.target.value}:00Z` : '' })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" type="datetime-local" label="Reference Period End" required
        value={item.referencePeriodEnd ? item.referencePeriodEnd.slice(0, 16) : ''} className="pcf-edit-page__input"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ ...item, referencePeriodEnd: e.target.value ? `${e.target.value}:00Z` : '' })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" type="datetime-local" label="Created" required
        value={item.created ? item.created.slice(0, 16) : ''} className="pcf-edit-page__input"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ ...item, created: e.target.value ? `${e.target.value}:00Z` : '' })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField fullWidth size="small" type="datetime-local" label="Validity Period Start"
        value={item.validityPeriodStart ? item.validityPeriodStart.slice(0, 16) : ''} className="pcf-edit-page__input"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ ...item, validityPeriodStart: e.target.value ? `${e.target.value}:00Z` : undefined })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField fullWidth size="small" type="datetime-local" label="Validity Period End" required
        value={item.validityPeriodEnd ? item.validityPeriodEnd.slice(0, 16) : ''} className="pcf-edit-page__input"
        InputLabelProps={{ shrink: true }}
        onChange={(e) => onChange({ ...item, validityPeriodEnd: e.target.value ? `${e.target.value}:00Z` : '' })} />
    </Grid2>
  </Grid2>
);

const renderVerification = (
  item: VerificationEntity,
  _i: number,
  onChange: (u: VerificationEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="Program Certification Share (%)"
        value={item.programCertificationShare ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 100, step: 'any' }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, programCertificationShare: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="3rd Party Verification Share (%)"
        value={item.productVerificationShare3rdParty ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 100, step: 'any' }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, productVerificationShare3rdParty: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="2nd Party Verification Share (%)"
        value={item.productVerificationShare2ndParty ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 100, step: 'any' }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, productVerificationShare2ndParty: pn(e.target.value) })} />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 3 }}>
      <TextField fullWidth size="small" type="number" label="1st Party Verification Share (%)"
        value={item.productVerificationShare1stParty ?? ''} className="pcf-edit-page__input"
        inputProps={{ min: 0, max: 100, step: 'any' }}
        InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        onChange={(e) => onChange({ ...item, productVerificationShare1stParty: pn(e.target.value) })} />
    </Grid2>
  </Grid2>
);

const renderMassBalancing = (
  item: MassBalancingInformationEntity,
  _i: number,
  onChange: (u: MassBalancingInformationEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <FormControlLabel
        control={
          <Switch checked={item.massBalancingUsed}
            onChange={(e) => onChange({ ...item, massBalancingUsed: e.target.checked })}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PCF_PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PCF_PRIMARY } }} />
        }
        label={<Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Mass Balancing Used</Typography>}
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Free Attribution"
        value={item.freeAttributionInMassBalancing ?? 'not applicable'} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, freeAttributionInMassBalancing: e.target.value })}>
        {FREE_ATTRIBUTION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" label="Certificate Scheme"
        value={item.massBalancingCertificateScheme ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, massBalancingCertificateScheme: e.target.value })} />
    </Grid2>
  </Grid2>
);

const renderStandards = (
  item: StandardsEntity,
  _i: number,
  onChange: (u: StandardsEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Cross-Sectoral Standards *
      </Typography>
      <TagInput
        values={item.crossSectoralStandards ?? []}
        onChange={(v) => onChange({ ...item, crossSectoralStandards: v })}
        placeholder="e.g. GHG Protocol"
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        Product or Sector Specific Rules *
      </Typography>
      <TagInput
        values={item.productOrSectorSpecificRules ?? []}
        onChange={(v) => onChange({ ...item, productOrSectorSpecificRules: v })}
        placeholder="e.g. urn:tfs-initiative.com:..."
      />
    </Grid2>
  </Grid2>
);

const renderGwp = (
  item: GwpCharacterizationFactorDetailsEntity,
  _i: number,
  onChange: (u: GwpCharacterizationFactorDetailsEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField select fullWidth size="small" label="IPCC Characterization Factors" required
        value={item.ipccCharacterizationFactors ?? 'AR6'} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, ipccCharacterizationFactors: e.target.value as GwpCharacterizationFactorDetailsEntity['ipccCharacterizationFactors'] })}>
        {IPCC_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
  </Grid2>
);

const renderAllocation = (
  item: AllocationInForegroundEntity,
  _i: number,
  onChange: (u: AllocationInForegroundEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Waste Incineration Allocation" required
        value={item.allocationWasteIncineration ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, allocationWasteIncineration: e.target.value as AllocationInForegroundEntity['allocationWasteIncineration'] })}>
        {WASTE_INCINERATION_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField select fullWidth size="small" label="Recycled Carbon Allocation"
        value={item.allocationRecycledCarbon ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, allocationRecycledCarbon: e.target.value || undefined })}>
        <MenuItem value=""><em>— None —</em></MenuItem>
        {RECYCLED_CARBON_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField fullWidth size="small" label="Allocation Rules Description"
        value={item.allocationRulesDescription ?? ''} className="pcf-edit-page__input"
        onChange={(e) => onChange({ ...item, allocationRulesDescription: e.target.value || undefined })} />
    </Grid2>
  </Grid2>
);

// ---------------------------------------------------------------------------
// Assessment Information sub-renderer (contains Technology, ID, Boundary, etc.)
// ---------------------------------------------------------------------------

const AssessmentInfoContent: React.FC<{
  item: PcfAssessmentInformationEntity;
  onChange: (u: PcfAssessmentInformationEntity) => void;
}> = ({ item, onChange }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    technology: true, idVersion: true, boundary: true, geography: true, time: true,
  });
  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Box>
      <SubSection id="technology" title="Technology" icon={<Science sx={{ fontSize: 16, color: '#667eea' }} />}
        expanded={!!expanded.technology} onToggle={() => toggle('technology')}>
        <ArraySectionEditor items={item.technology ?? []} onChange={(v) => onChange({ ...item, technology: v })}
          createItem={createEmptyTechnology} renderItem={renderTechnology}
          itemLabel={(t) => t.ccsTechnologicalCO2CaptureIncluded ? 'CCS Included' : 'No CCS'} />
      </SubSection>

      <SubSection id="idVersion" title="ID & Version" icon={<Fingerprint sx={{ fontSize: 16, color: '#f59e0b' }} />}
        expanded={!!expanded.idVersion} onToggle={() => toggle('idVersion')}>
        <ArraySectionEditor items={item.idAndVersion ?? []} onChange={(v) => onChange({ ...item, idAndVersion: v })}
          createItem={createEmptyIdAndVersion} renderItem={renderIdAndVersion}
          itemLabel={(iv) => `${iv.status} — v${iv.version}`} />
      </SubSection>

      <SubSection id="boundary" title="Boundary Specifications" icon={<CropFree sx={{ fontSize: 16, color: '#ef4444' }} />}
        expanded={!!expanded.boundary} onToggle={() => toggle('boundary')}>
        <ArraySectionEditor items={item.boundarySpecifications ?? []} onChange={(v) => onChange({ ...item, boundarySpecifications: v })}
          createItem={createEmptyBoundarySpecifications} renderItem={renderBoundary}
          itemLabel={(b) => `Exempted: ${b.exemptedEmissionsPercent}%`} />
      </SubSection>

      <SubSection id="geography" title="Geography" icon={<Public sx={{ fontSize: 16, color: '#10b981' }} />}
        expanded={!!expanded.geography} onToggle={() => toggle('geography')}>
        <ArraySectionEditor items={item.geography ?? []} onChange={(v) => onChange({ ...item, geography: v })}
          createItem={createEmptyGeography} renderItem={renderGeography}
          itemLabel={(g) => g.geographyCountry || g.geographyRegionOrSubregion} />
      </SubSection>

      <SubSection id="time" title="Reference Period & Validity" icon={<CalendarMonth sx={{ fontSize: 16, color: '#8b5cf6' }} />}
        expanded={!!expanded.time} onToggle={() => toggle('time')}>
        <ArraySectionEditor items={item.time ?? []} onChange={(v) => onChange({ ...item, time: v })}
          createItem={createEmptyTime} renderItem={renderTime}
          itemLabel={(t) => t.referencePeriodStart ? `From ${t.referencePeriodStart.slice(0, 10)}` : 'New Period'} />
      </SubSection>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Methodology sub-renderer (Mass Balancing, Standards, GWP, Allocation)
// ---------------------------------------------------------------------------

const MethodologyContent: React.FC<{
  item: PcfMethodologyEntity;
  onChange: (u: PcfMethodologyEntity) => void;
}> = ({ item, onChange }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    massBalancing: true, standards: true, gwp: true, allocation: true,
  });
  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Box>
      <SubSection id="massBalancing" title="Mass Balancing" icon={<Balance sx={{ fontSize: 16, color: '#f59e0b' }} />}
        expanded={!!expanded.massBalancing} onToggle={() => toggle('massBalancing')}>
        <ArraySectionEditor items={item.massBalancingInformation ?? []} onChange={(v) => onChange({ ...item, massBalancingInformation: v })}
          createItem={createEmptyMassBalancingInformation} renderItem={renderMassBalancing}
          itemLabel={(m) => m.massBalancingUsed ? 'Used' : 'Not Used'} />
      </SubSection>

      <SubSection id="standards" title="Standards" icon={<Gavel sx={{ fontSize: 16, color: '#667eea' }} />}
        expanded={!!expanded.standards} onToggle={() => toggle('standards')}>
        <ArraySectionEditor items={item.standards ?? []} onChange={(v) => onChange({ ...item, standards: v })}
          createItem={createEmptyStandards} renderItem={renderStandards}
          itemLabel={(_s, i) => `Standards Set ${i + 1}`} />
      </SubSection>

      <SubSection id="gwp" title="GWP Characterization Factors" icon={<Thermostat sx={{ fontSize: 16, color: '#ef4444' }} />}
        expanded={!!expanded.gwp} onToggle={() => toggle('gwp')}>
        <ArraySectionEditor items={item.gwpCharacterizationFactorDetails ?? []} onChange={(v) => onChange({ ...item, gwpCharacterizationFactorDetails: v })}
          createItem={createEmptyGwpCharacterizationFactorDetails} renderItem={renderGwp}
          itemLabel={(g) => g.ipccCharacterizationFactors ?? 'unspecified'} />
      </SubSection>

      <SubSection id="allocation" title="Allocation in Foreground" icon={<AccountTree sx={{ fontSize: 16, color: '#10b981' }} />}
        expanded={!!expanded.allocation} onToggle={() => toggle('allocation')}>
        <ArraySectionEditor items={item.allocationInForeground ?? []} onChange={(v) => onChange({ ...item, allocationInForeground: v })}
          createItem={createEmptyAllocationInForeground} renderItem={renderAllocation}
          itemLabel={(a) => a.allocationWasteIncineration ?? 'New Allocation'} />
      </SubSection>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

/**
 * Edit section for pcfAssessmentAndMethodology.
 * Uses accordion sub-sections for the ~30 fields organised by domain area:
 *   - Data Sources & Quality
 *   - Assessment Information (Technology, ID, Boundary, Geography, Time)
 *   - Verification & Certification Shares
 *   - Methodology (Mass Balancing, Standards, GWP, Allocation)
 */
const AssessmentMethodologyEditSection: React.FC<AssessmentMethodologyEditSectionProps> = ({
  items,
  onChange,
}) => {
  const [topExpanded, setTopExpanded] = useState<Record<string, boolean>>({
    dataSources: true, assessmentInfo: true, verification: false, methodology: false,
  });
  const toggleTop = (key: string) => setTopExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <ArraySectionEditor
      items={items}
      onChange={onChange}
      createItem={createEmptyPcfAssessmentAndMethodology}
      title="Assessment & Methodology"
      itemLabel={(_item, idx) => `Assessment Entry ${idx + 1}`}
      renderItem={(item, _index, onItemChange) => (
        <Box>
          {/* ── Data Sources & Quality ── */}
          <SubSection id="dataSources" title="Data Sources & Quality"
            icon={<BarChart sx={{ fontSize: 16, color: PCF_PRIMARY }} />}
            expanded={!!topExpanded.dataSources} onToggle={() => toggleTop('dataSources')}>
            <ArraySectionEditor
              items={item.dataSourcesAndQuality ?? []}
              onChange={(v) => onItemChange({ ...item, dataSourcesAndQuality: v })}
              createItem={createEmptyDataSourcesAndQuality}
              renderItem={renderDataSources}
              itemLabel={(d) => d.primaryDataShare != null ? `Primary: ${d.primaryDataShare}%` : 'New Entry'}
            />
          </SubSection>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', my: 1 }} />

          {/* ── Assessment Information ── */}
          <SubSection id="assessmentInfo" title="Assessment Information"
            icon={<Fingerprint sx={{ fontSize: 16, color: '#f59e0b' }} />}
            expanded={!!topExpanded.assessmentInfo} onToggle={() => toggleTop('assessmentInfo')}>
            <ArraySectionEditor
              items={item.pcfAssessmentInformation ?? []}
              onChange={(v) => onItemChange({ ...item, pcfAssessmentInformation: v })}
              createItem={createEmptyPcfAssessmentInformation}
              itemLabel={(_ai, i) => `Assessment Info ${i + 1}`}
              renderItem={(ai, _i, onAiChange) => (
                <AssessmentInfoContent item={ai} onChange={onAiChange} />
              )}
            />
          </SubSection>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', my: 1 }} />

          {/* ── Verification & Certification Shares ── */}
          <SubSection id="verification" title="Verification & Certification Shares"
            icon={<VerifiedUser sx={{ fontSize: 16, color: '#667eea' }} />}
            expanded={!!topExpanded.verification} onToggle={() => toggleTop('verification')}>
            <ArraySectionEditor
              items={item.verificationAndCertificationShares ?? []}
              onChange={(v) => onItemChange({ ...item, verificationAndCertificationShares: v })}
              createItem={createEmptyVerification}
              renderItem={renderVerification}
              itemLabel={(_v, i) => `Verification ${i + 1}`}
            />
          </SubSection>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', my: 1 }} />

          {/* ── Methodology ── */}
          <SubSection id="methodology" title="Methodology"
            icon={<Science sx={{ fontSize: 16, color: '#8b5cf6' }} />}
            expanded={!!topExpanded.methodology} onToggle={() => toggleTop('methodology')}>
            <ArraySectionEditor
              items={item.pcfMethodology ?? []}
              onChange={(v) => onItemChange({ ...item, pcfMethodology: v })}
              createItem={createEmptyPcfMethodology}
              itemLabel={(_m, i) => `Methodology Set ${i + 1}`}
              renderItem={(m, _i, onMChange) => (
                <MethodologyContent item={m} onChange={onMChange} />
              )}
            />
          </SubSection>
        </Box>
      )}
    />
  );
};

export default AssessmentMethodologyEditSection;

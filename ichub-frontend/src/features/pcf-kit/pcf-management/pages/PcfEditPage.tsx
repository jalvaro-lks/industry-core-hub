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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid2,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  FormControlLabel,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Co2,
  Assessment,
  Factory,
  LocalShipping,
  Description,
  Science,
  KeyboardArrowDown,
  Inventory,
  CalendarMonth,
  Public,
  BarChart,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getPcfByManufacturerPartId, updatePcfAndGetParticipants, notifyParticipants, DEFAULT_PCF_POLICIES } from '../../services/pcfApi';
import { PcfNestedData, PcfEditFormValues, extractFormValues, mergePcfFormValues } from '../types/pcfNestedData';
import { ParticipantSelectionDialog } from '../components';
import { getPcfExchangePoliciesConfig } from '@/services/EnvironmentService';
import { generatePoliciesFromDefinition } from '@/features/industry-core-kit/part-discovery/utils/governancePolicyUtils';
import './PcfEditPage.scss';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PCF_PRIMARY = '#10b981';

const DECLARED_UNIT_OPTIONS = [
  'liter', 'kilogram', 'cubic meter', 'kilowatt hour', 'megajoule',
  'ton kilometer', 'square meter', 'piece', 'hour', 'megabit', 'second',
] as const;

const PARTIAL_FULL_PCF_OPTIONS = ['Cradle-to-gate', 'Cradle-to-grave'] as const;

const GEOGRAPHY_REGIONS = [
  'Africa', 'Americas', 'Asia', 'Europe', 'Oceania',
  'Australia and New Zealand', 'Central Asia', 'Eastern Asia', 'Eastern Europe',
  'Latin America and the Caribbean', 'Melanesia', 'Micronesia', 'Northern Africa',
  'Northern America', 'Northern Europe', 'Polynesia', 'South-eastern Asia',
  'Southern Asia', 'Southern Europe', 'Sub-Saharan Africa', 'Western Asia',
  'Western Europe', 'Global', 'Several',
] as const;

// ISO 3166-1 alpha-2 common codes (non-exhaustive but covers the most relevant)
const COUNTRY_CODES = [
  'DE', 'US', 'CN', 'JP', 'KR', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT',
  'CH', 'PL', 'CZ', 'SK', 'HU', 'RO', 'SE', 'NO', 'DK', 'FI', 'PT', 'GR',
  'TR', 'MX', 'BR', 'IN', 'CA', 'AU', 'ZA', 'AR', 'CL', 'TH', 'ID', 'MY',
  'VN', 'PH', 'SG', 'TW', 'HK', 'SA', 'AE', 'IL', 'EG', 'NG', 'KE',
] as const;

// Tab definition
interface EditTab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const EDIT_TABS: EditTab[] = [
  { id: 'scope', label: 'Scope & Product', icon: Inventory },
  { id: 'assessment', label: 'Assessment', icon: Assessment },
  { id: 'emissions', label: 'Emissions', icon: Factory },
  { id: 'carbon', label: 'Carbon Content', icon: Science },
  { id: 'general', label: 'General', icon: Description },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  unit?: string;
  children: React.ReactNode;
  required?: boolean;
}

/** Wraps a single field with a label and optional unit label. */
const FieldWrapper: React.FC<FieldProps> = ({ label, unit, children, required }) => (
  <Box className="pcf-edit-page__field">
    <Typography className="pcf-edit-page__field-label">
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      {unit && (
        <Typography component="span" className="pcf-edit-page__field-unit">
          &nbsp;({unit})
        </Typography>
      )}
    </Typography>
    {children}
  </Box>
);

interface SectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

/** Visual section group inside a tab. */
const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
  <Box className="pcf-edit-page__section">
    <Box className="pcf-edit-page__section-header">
      {Icon && <Icon sx={{ fontSize: 18, color: PCF_PRIMARY }} />}
      <Typography className="pcf-edit-page__section-title">{title}</Typography>
    </Box>
    <Divider className="pcf-edit-page__section-divider" />
    <Grid2 container spacing={2} sx={{ mt: 1 }}>
      {children}
    </Grid2>
  </Box>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Full-screen Update form for a PCF (Product Carbon Footprint).
 *
 * Loads the existing PCF via GET, populates the form, and on save:
 *   1. Merges edited values back into the full nested structure.
 *   2. Calls PUT updatePcfAndGetParticipants → receives a list of BPN participants.
 *   3. Opens ParticipantSelectionDialog for the user to choose who to notify.
 *   4. On confirm → POST notifyParticipants → navigates back to /pcf/management.
 *
 * Accessible at: /pcf/management/edit/:manufacturerPartId
 */
const PcfEditPage: React.FC = () => {
  const { manufacturerPartId } = useParams<{ manufacturerPartId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('pcf');

  // --------------- Data loading ---------------
  const [originalData, setOriginalData] = useState<PcfNestedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --------------- Form state ---------------
  const [formValues, setFormValues] = useState<PcfEditFormValues | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [tabMenuAnchor, setTabMenuAnchor] = useState<null | HTMLElement>(null);

  // --------------- Save / Notify state ---------------
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [participantBpns, setParticipantBpns] = useState<string[]>([]);
  const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Load existing PCF on mount
  useEffect(() => {
    if (!manufacturerPartId) return;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const raw = await getPcfByManufacturerPartId(manufacturerPartId);
        if (!raw) {
          setLoadError(t('error.pcfNotFound', 'PCF data not found for this part.'));
          return;
        }
        const nested = raw as unknown as PcfNestedData;
        setOriginalData(nested);
        setFormValues(extractFormValues(nested));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load PCF data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [manufacturerPartId, t]);

  // Generic field change handler — keeps formValues immutable between renders
  const handleChange = useCallback(
    <K extends keyof PcfEditFormValues>(field: K, value: PcfEditFormValues[K]) => {
      setFormValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  // Handle numeric TextField changes (parses float, defaults to 0)
  const handleNumberChange = useCallback(
    (field: keyof PcfEditFormValues, raw: string) => {
      const parsed = parseFloat(raw);
      handleChange(field, (isNaN(parsed) ? 0 : parsed) as PcfEditFormValues[typeof field]);
    },
    [handleChange]
  );

  // Governance policies helper — reuses the same logic as PcfManagementPage
  const getGovernancePolicies = useMemo(() => {
    const configured = getPcfExchangePoliciesConfig();
    if (configured.length > 0) {
      return configured.flatMap(def => generatePoliciesFromDefinition(def));
    }
    return DEFAULT_PCF_POLICIES;
  }, []);

  // --------------- Save handler ---------------
  const handleSave = async () => {
    if (!formValues || !originalData || !manufacturerPartId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const merged = mergePcfFormValues(originalData, formValues);
      const result = await updatePcfAndGetParticipants(
        manufacturerPartId,
        merged as unknown as Record<string, unknown>
      );
      // Normalize: backend may return an object or null instead of a plain string[]
      const bpns = Array.isArray(result) ? result : [];
      setParticipantBpns(bpns);
      setIsParticipantDialogOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save PCF';
      setSaveError(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --------------- Notify handler ---------------
  const handleNotify = useCallback(
    async (selectedBpns: string[]) => {
      if (!manufacturerPartId) return;
      await notifyParticipants(
        manufacturerPartId,
        selectedBpns,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getGovernancePolicies as any
      );
      setSnackbar({
        open: true,
        message: `PCF update sent to ${selectedBpns.length} participant(s) successfully.`,
        severity: 'success',
      });
      setIsParticipantDialogOpen(false);
      navigate('/pcf/management');
    },
    [manufacturerPartId, getGovernancePolicies, navigate]
  );

  const handleParticipantDialogClose = () => {
    setIsParticipantDialogOpen(false);
    navigate('/pcf/management');
  };

  // --------------- Loading / Error states ---------------
  if (isLoading) {
    return (
      <Box className="pcf-edit-page__loading">
        <CircularProgress sx={{ color: PCF_PRIMARY }} size={48} />
      </Box>
    );
  }

  if (loadError || !formValues) {
    return (
      <Box className="pcf-edit-page__error">
        <Alert severity="error" sx={{ maxWidth: 520 }}>{loadError}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}
        >
          {t('common.back', 'Back')}
        </Button>
      </Box>
    );
  }

  const productName =
    originalData?.companyAndProductInformation?.[0]?.productInformation?.[0]?.productNameCompany ??
    manufacturerPartId;

  // --------------- Render ---------------
  return (
    <Box className="pcf-edit-page">
      {/* ─── Sticky Header ─── */}
      <Box className="pcf-edit-page__header">
        <Paper elevation={0} className="pcf-edit-page__header-paper">
          <Grid2 container spacing={2} alignItems="center" justifyContent="space-between">
            {/* Left: back + title */}
            <Grid2 size={{ xs: 12, md: 8 }}>
              <Box className="pcf-edit-page__header-left">
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => navigate(-1)}
                  variant="outlined"
                  className="pcf-edit-page__back-btn"
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Back
                  </Box>
                </Button>
                <Box className="pcf-edit-page__title-block">
                  <Box className="pcf-edit-page__icon-wrapper">
                    <Co2 sx={{ fontSize: 22, color: PCF_PRIMARY }} />
                  </Box>
                  <Box>
                    <Box className="pcf-edit-page__title-row">
                      <Typography className="pcf-edit-page__title">
                        {productName}
                      </Typography>
                      <Chip
                        label="Edit Mode"
                        size="small"
                        className="pcf-edit-page__edit-chip"
                      />
                    </Box>
                    <Typography className="pcf-edit-page__subtitle" component="span">
                      {manufacturerPartId}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid2>

            {/* Right: Save button */}
            <Grid2 size={{ xs: 12, md: 4 }}>
              <Box className="pcf-edit-page__header-right">
                {saveError && (
                  <Typography className="pcf-edit-page__save-error">{saveError}</Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <Save />}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="pcf-edit-page__save-btn"
                >
                  {isSaving ? 'Saving…' : t('management.update', 'Save Changes')}
                </Button>
              </Box>
            </Grid2>
          </Grid2>
        </Paper>

        {/* ─── Sticky Tabs ─── */}
        <Box className="pcf-edit-page__tabs-container">
          {/* Desktop tabs */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              className="pcf-edit-page__tabs"
            >
              {EDIT_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Tab
                    key={tab.id}
                    icon={<Icon sx={{ fontSize: 18, mb: 0.5 }} />}
                    iconPosition="start"
                    label={tab.label}
                  />
                );
              })}
            </Tabs>
          </Box>

          {/* Mobile dropdown */}
          <Box sx={{ px: 2, py: 1.5, display: { xs: 'block', md: 'none' } }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={(e) => setTabMenuAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDown />}
              startIcon={React.createElement(EDIT_TABS[activeTab].icon, { sx: { fontSize: 20 } })}
              className="pcf-edit-page__mobile-tab-btn"
            >
              {EDIT_TABS[activeTab].label}
            </Button>
            <Menu
              anchorEl={tabMenuAnchor}
              open={Boolean(tabMenuAnchor)}
              onClose={() => setTabMenuAnchor(null)}
              PaperProps={{ className: 'pcf-edit-page__mobile-menu' }}
            >
              {EDIT_TABS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <MenuItem
                    key={tab.id}
                    selected={activeTab === idx}
                    onClick={() => { setActiveTab(idx); setTabMenuAnchor(null); }}
                  >
                    <ListItemIcon sx={{ color: activeTab === idx ? PCF_PRIMARY : 'rgba(255,255,255,0.5)' }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={tab.label} />
                  </MenuItem>
                );
              })}
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* ─── Tab Content ─── */}
      <Box className="pcf-edit-page__content">

        {/* TAB 0 — Scope & Product */}
        {activeTab === 0 && (
          <Box>
            <Section title="PCF Scope" icon={Inventory}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="PCF Type" required>
                  <TextField
                    select
                    fullWidth
                    value={formValues.partialFullPcf}
                    onChange={(e) => handleChange('partialFullPcf', e.target.value as PcfEditFormValues['partialFullPcf'])}
                    className="pcf-edit-page__input"
                    size="small"
                  >
                    {PARTIAL_FULL_PCF_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Spec Version" required>
                  <TextField
                    fullWidth
                    value={formValues.specVersion}
                    onChange={(e) => handleChange('specVersion', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    placeholder="e.g. PACT Methodology v2.0.0"
                  />
                </FieldWrapper>
              </Grid2>
            </Section>

            <Section title="Product Information" icon={Inventory}>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Declared Unit Amount" required>
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.declaredUnitAmount}
                    onChange={(e) => handleNumberChange('declaredUnitAmount', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0.0001, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Declared Unit of Measurement" required>
                  <TextField
                    select
                    fullWidth
                    value={formValues.declaredUnitOfMeasurement}
                    onChange={(e) => handleChange('declaredUnitOfMeasurement', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                  >
                    {DECLARED_UNIT_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Product Mass per Declared Unit" unit="kg" required>
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.productMassPerDeclaredUnit}
                    onChange={(e) => handleNumberChange('productMassPerDeclaredUnit', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </FieldWrapper>
              </Grid2>
            </Section>
          </Box>
        )}

        {/* TAB 1 — Assessment */}
        {activeTab === 1 && (
          <Box>
            <Section title="Data Quality" icon={BarChart}>
              <Grid2 size={{ xs: 12, sm: 3 }}>
                <FieldWrapper label="Primary Data Share" unit="%" >
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.primaryDataShare}
                    onChange={(e) => handleNumberChange('primaryDataShare', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 'any' }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 3 }}>
                <FieldWrapper label="Technological DQR" unit="1–5">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.technologicalDQR}
                    onChange={(e) => handleNumberChange('technologicalDQR', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 3 }}>
                <FieldWrapper label="Temporal DQR" unit="1–5">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.temporalDQR}
                    onChange={(e) => handleNumberChange('temporalDQR', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 3 }}>
                <FieldWrapper label="Geographical DQR" unit="1–5">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.geographicalDQR}
                    onChange={(e) => handleNumberChange('geographicalDQR', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 1, max: 5, step: 0.1 }}
                  />
                </FieldWrapper>
              </Grid2>
            </Section>

            <Section title="Reference Period & Validity" icon={CalendarMonth}>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Reference Period Start" required>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    value={formValues.referencePeriodStart ? formValues.referencePeriodStart.slice(0, 16) : ''}
                    onChange={(e) => handleChange('referencePeriodStart', e.target.value ? `${e.target.value}:00Z` : '')}
                    className="pcf-edit-page__input"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarMonth sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Reference Period End" required>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    value={formValues.referencePeriodEnd ? formValues.referencePeriodEnd.slice(0, 16) : ''}
                    onChange={(e) => handleChange('referencePeriodEnd', e.target.value ? `${e.target.value}:00Z` : '')}
                    className="pcf-edit-page__input"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarMonth sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Validity Period End" required>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    value={formValues.validityPeriodEnd ? formValues.validityPeriodEnd.slice(0, 16) : ''}
                    onChange={(e) => handleChange('validityPeriodEnd', e.target.value ? `${e.target.value}:00Z` : '')}
                    className="pcf-edit-page__input"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarMonth sx={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </FieldWrapper>
              </Grid2>
            </Section>

            <Section title="Geography" icon={Public}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Country" required>
                  <TextField
                    select
                    fullWidth
                    value={formValues.geographyCountry}
                    onChange={(e) => handleChange('geographyCountry', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                  >
                    <MenuItem value=""><em>— None —</em></MenuItem>
                    {COUNTRY_CODES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Region or Subregion" required>
                  <TextField
                    select
                    fullWidth
                    value={formValues.geographyRegionOrSubregion}
                    onChange={(e) => handleChange('geographyRegionOrSubregion', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                  >
                    {GEOGRAPHY_REGIONS.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </TextField>
                </FieldWrapper>
              </Grid2>
            </Section>
          </Box>
        )}

        {/* TAB 2 — Emissions */}
        {activeTab === 2 && (
          <Box>
            <Section title="Production Stage" icon={Factory}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="PCF Including Biogenic Uptake" unit="kg CO₂e/unit" required>
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.pcfIncludingBiogenicUptake}
                    onChange={(e) => handleNumberChange('pcfIncludingBiogenicUptake', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="PCF Excluding Biogenic Uptake" unit="kg CO₂e/unit" required>
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.pcfExcludingBiogenicUptake}
                    onChange={(e) => handleNumberChange('pcfExcludingBiogenicUptake', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Fossil GHG Emissions" unit="kg CO₂e/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.fossilGhgEmissions}
                    onChange={(e) => handleNumberChange('fossilGhgEmissions', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Biogenic CO₂ Uptake" unit="kg CO₂e/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.biogenicCO2Uptake}
                    onChange={(e) => handleNumberChange('biogenicCO2Uptake', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ step: 'any' }}
                    helperText="Can be negative (CO₂ absorbed)"
                    FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' } }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Land Use Change GHG Emissions" unit="kg CO₂e/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.landUseChangeGhgEmissions}
                    onChange={(e) => handleNumberChange('landUseChangeGhgEmissions', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 4 }}>
                <FieldWrapper label="Aircraft GHG Emissions" unit="kg CO₂e/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.aircraftGhgEmissions}
                    onChange={(e) => handleNumberChange('aircraftGhgEmissions', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
            </Section>

            <Section title="Distribution Stage" icon={LocalShipping}>
              <Grid2 size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formValues.distributionStageIncluded}
                      onChange={(e) => handleChange('distributionStageIncluded', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: PCF_PRIMARY },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: PCF_PRIMARY },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                      Distribution Stage Included
                    </Typography>
                  }
                  sx={{ mb: 1 }}
                />
              </Grid2>

              {formValues.distributionStageIncluded && (
                <>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <FieldWrapper label="Distribution PCF Including Biogenic Uptake" unit="kg CO₂e/unit">
                      <TextField
                        fullWidth
                        type="number"
                        value={formValues.distributionStagePcfIncludingBiogenicUptake}
                        onChange={(e) => handleNumberChange('distributionStagePcfIncludingBiogenicUptake', e.target.value)}
                        className="pcf-edit-page__input"
                        size="small"
                        inputProps={{ step: 'any' }}
                      />
                    </FieldWrapper>
                  </Grid2>
                  <Grid2 size={{ xs: 12, sm: 6 }}>
                    <FieldWrapper label="Distribution PCF Excluding Biogenic Uptake" unit="kg CO₂e/unit">
                      <TextField
                        fullWidth
                        type="number"
                        value={formValues.distributionStagePcfExcludingBiogenicUptake}
                        onChange={(e) => handleNumberChange('distributionStagePcfExcludingBiogenicUptake', e.target.value)}
                        className="pcf-edit-page__input"
                        size="small"
                        inputProps={{ min: 0, step: 'any' }}
                      />
                    </FieldWrapper>
                  </Grid2>
                </>
              )}
            </Section>
          </Box>
        )}

        {/* TAB 3 — Carbon Content */}
        {activeTab === 3 && (
          <Box>
            <Section title="Carbon Content Breakdown" icon={Co2}>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Total Carbon Content" unit="kg C/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.carbonContentTotal}
                    onChange={(e) => handleNumberChange('carbonContentTotal', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Fossil Carbon Content" unit="kg C/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.fossilCarbonContent}
                    onChange={(e) => handleNumberChange('fossilCarbonContent', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Biogenic Carbon Content" unit="kg C/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.biogenicCarbonContent}
                    onChange={(e) => handleNumberChange('biogenicCarbonContent', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 6 }}>
                <FieldWrapper label="Recycled Carbon Content" unit="kg C/unit">
                  <TextField
                    fullWidth
                    type="number"
                    value={formValues.recycledCarbonContent}
                    onChange={(e) => handleNumberChange('recycledCarbonContent', e.target.value)}
                    className="pcf-edit-page__input"
                    size="small"
                    inputProps={{ min: 0, step: 'any' }}
                  />
                </FieldWrapper>
              </Grid2>
            </Section>
          </Box>
        )}

        {/* TAB 4 — General */}
        {activeTab === 4 && (
          <Box>
            <Section title="General Information" icon={Description}>
              <Grid2 size={{ xs: 12 }}>
                <FieldWrapper label="Comment">
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={formValues.comment}
                    onChange={(e) => handleChange('comment', e.target.value)}
                    className="pcf-edit-page__input"
                    placeholder="Additional notes or instructions for the recipient…"
                  />
                </FieldWrapper>
              </Grid2>
            </Section>
          </Box>
        )}
      </Box>

      {/* ─── Participant Selection Dialog (notify after save) ─── */}
      <ParticipantSelectionDialog
        open={isParticipantDialogOpen}
        onClose={handleParticipantDialogClose}
        onConfirm={handleNotify}
        participants={participantBpns}
        manufacturerPartId={manufacturerPartId ?? ''}
      />

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PcfEditPage;

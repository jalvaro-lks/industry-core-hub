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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Co2,
  Assessment,
  Factory,
  Description,
  Science,
  KeyboardArrowDown,
  Inventory,
  Business,
  VerifiedUser,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getPcfByManufacturerPartId, updatePcfAndGetParticipants, notifyParticipants, DEFAULT_PCF_POLICIES } from '../../services/pcfApi';
import { PcfNestedData } from '../types/pcfNestedData';
import { ParticipantSelectionDialog } from '../components';
import {
  ScopeEditSection,
  CompanyProductEditSection,
  AssessmentMethodologyEditSection,
  EmissionsEditSection,
  CarbonContentEditSection,
  GeneralEditSection,
  AttestationEditSection,
} from '../components/edit-sections';
import { getPcfExchangePoliciesConfig } from '@/services/EnvironmentService';
import { generatePoliciesFromDefinition } from '@/features/industry-core-kit/part-discovery/utils/governancePolicyUtils';
import './PcfEditPage.scss';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PCF_PRIMARY = '#10b981';

interface EditTab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const EDIT_TABS: EditTab[] = [
  { id: 'scope', label: 'Scope', icon: Inventory },
  { id: 'company', label: 'Company & Product', icon: Business },
  { id: 'assessment', label: 'Assessment & Methodology', icon: Assessment },
  { id: 'emissions', label: 'Emissions', icon: Factory },
  { id: 'carbon', label: 'Carbon Content', icon: Science },
  { id: 'general', label: 'General', icon: Description },
  { id: 'attestation', label: 'Attestation', icon: VerifiedUser },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Full-screen Update form for a PCF (Product Carbon Footprint).
 *
 * Loads the existing PCF via GET, populates the form, and on save:
 *   1. Sends the full nested structure directly.
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --------------- Form state (full nested structure) ---------------
  const [formData, setFormData] = useState<PcfNestedData | null>(null);
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
        // Deep clone so edits don't mutate cached data
        setFormData(structuredClone(raw as unknown as PcfNestedData));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load PCF data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [manufacturerPartId, t]);

  // Generic section updater — replaces a top-level key in the nested structure
  const updateSection = useCallback(
    <K extends keyof PcfNestedData>(key: K, value: PcfNestedData[K]) => {
      setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
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
    if (!formData || !manufacturerPartId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await updatePcfAndGetParticipants(
        manufacturerPartId,
        formData as unknown as Record<string, unknown>
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

  if (loadError || !formData) {
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
    formData?.companyAndProductInformation?.[0]?.productInformation?.[0]?.productNameCompany ??
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
        {activeTab === 0 && (
          <ScopeEditSection
            items={formData.scopeOfPcfForm ?? []}
            onChange={(v) => updateSection('scopeOfPcfForm', v)}
          />
        )}
        {activeTab === 1 && (
          <CompanyProductEditSection
            items={formData.companyAndProductInformation ?? []}
            onChange={(v) => updateSection('companyAndProductInformation', v)}
          />
        )}
        {activeTab === 2 && (
          <AssessmentMethodologyEditSection
            items={formData.pcfAssessmentAndMethodology ?? []}
            onChange={(v) => updateSection('pcfAssessmentAndMethodology', v)}
          />
        )}
        {activeTab === 3 && (
          <EmissionsEditSection
            items={formData.productLifeCycleStagesAndEmissions ?? []}
            onChange={(v) => updateSection('productLifeCycleStagesAndEmissions', v)}
          />
        )}
        {activeTab === 4 && (
          <CarbonContentEditSection
            items={formData.carbonContent ?? []}
            onChange={(v) => updateSection('carbonContent', v)}
          />
        )}
        {activeTab === 5 && (
          <GeneralEditSection
            items={formData.general ?? []}
            onChange={(v) => updateSection('general', v)}
          />
        )}
        {activeTab === 6 && (
          <AttestationEditSection
            items={formData.attestationOfConformance ?? []}
            onChange={(v) => updateSection('attestationOfConformance', v)}
          />
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

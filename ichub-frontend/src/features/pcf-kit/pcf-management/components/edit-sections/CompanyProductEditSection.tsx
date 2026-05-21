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
import { Alert, Box, Divider, Grid2, MenuItem, TextField, Typography } from '@mui/material';
import { Business, Inventory } from '@mui/icons-material';
import {
  CompanyAndProductInformationEntity,
  CompanyInformationEntity,
  ProductInformationEntity,
  createEmptyCompanyAndProductInformation,
  createEmptyCompanyInformation,
  createEmptyProductInformation,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';
import TagInput from './TagInput';

const DECLARED_UNIT_OPTIONS = [
  'liter', 'kilogram', 'cubic meter', 'kilowatt hour', 'megajoule',
  'ton kilometer', 'square meter', 'piece', 'hour', 'megabit', 'second',
] as const;

interface CompanyProductEditSectionProps {
  items: CompanyAndProductInformationEntity[];
  onChange: (items: CompanyAndProductInformationEntity[]) => void;
}

// ---------------------------------------------------------------------------
// Sub-renderers for nested arrays
// ---------------------------------------------------------------------------

/** Renders the fields for a single CompanyInformationEntity. */
const renderCompanyItem = (
  item: CompanyInformationEntity,
  _index: number,
  onItemChange: (updated: CompanyInformationEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12 }}>
      <Alert severity="info" variant="outlined" sx={{ mb: 1, fontSize: '0.75rem' }}>
        Company name and IDs originate from your Catena-X registration.
        You may update them here if the PCF data differs.
      </Alert>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField
        fullWidth
        size="small"
        label="Company Name"
        required
        value={item.companyName}
        onChange={(e) => onItemChange({ ...item, companyName: e.target.value })}
        className="pcf-edit-page__input"
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Company IDs *
        </Typography>
        <TagInput
          values={item.companyIds ?? []}
          onChange={(ids) => onItemChange({ ...item, companyIds: ids })}
          placeholder="e.g. urn:BPNL000000000DWF"
        />
      </Box>
    </Grid2>
  </Grid2>
);

/** Renders the fields for a single ProductInformationEntity. */
const renderProductItem = (
  item: ProductInformationEntity,
  _index: number,
  onItemChange: (updated: ProductInformationEntity) => void
) => (
  <Grid2 container spacing={2}>
    <Grid2 size={{ xs: 12 }}>
      <Alert severity="info" variant="outlined" sx={{ mb: 1, fontSize: '0.75rem' }}>
        Product name and IDs may originate from catalog data.
        You may update them here if the PCF data differs.
      </Alert>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField
        fullWidth
        size="small"
        label="Product Name"
        required
        value={item.productNameCompany}
        onChange={(e) => onItemChange({ ...item, productNameCompany: e.target.value })}
        className="pcf-edit-page__input"
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Product IDs *
        </Typography>
        <TagInput
          values={item.productIds ?? []}
          onChange={(ids) => onItemChange({ ...item, productIds: ids })}
          placeholder="e.g. ML-III, GTIN:123456"
        />
      </Box>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField
        select
        fullWidth
        size="small"
        label="Declared Unit"
        required
        value={item.declaredUnitOfMeasurement}
        onChange={(e) =>
          onItemChange({
            ...item,
            declaredUnitOfMeasurement: e.target.value as ProductInformationEntity['declaredUnitOfMeasurement'],
          })
        }
        className="pcf-edit-page__input"
      >
        {DECLARED_UNIT_OPTIONS.map((opt) => (
          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
        ))}
      </TextField>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Declared Unit Amount"
        required
        value={item.declaredUnitAmount}
        onChange={(e) =>
          onItemChange({ ...item, declaredUnitAmount: parseFloat(e.target.value) || 0 })
        }
        className="pcf-edit-page__input"
        inputProps={{ min: 0.0001, step: 'any' }}
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 4 }}>
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Mass per Declared Unit (kg)"
        required
        value={item.productMassPerDeclaredUnit}
        onChange={(e) =>
          onItemChange({ ...item, productMassPerDeclaredUnit: parseFloat(e.target.value) || 0 })
        }
        className="pcf-edit-page__input"
        inputProps={{ min: 0, step: 'any' }}
      />
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <Box>
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Product Classifications
        </Typography>
        <TagInput
          values={item.productClassifications ?? []}
          onChange={(cls) => onItemChange({ ...item, productClassifications: cls })}
          placeholder="e.g. urn:gtin:4712345060507"
        />
      </Box>
    </Grid2>
    <Grid2 size={{ xs: 12, sm: 6 }}>
      <TextField
        fullWidth
        size="small"
        label="Product Description"
        multiline
        rows={2}
        value={item.productDescription ?? ''}
        onChange={(e) => onItemChange({ ...item, productDescription: e.target.value })}
        className="pcf-edit-page__input"
      />
    </Grid2>
  </Grid2>
);

// ---------------------------------------------------------------------------
// Main section component
// ---------------------------------------------------------------------------

/**
 * Edit section for companyAndProductInformation.
 * Each top-level entry contains nested arrays for company and product info.
 */
const CompanyProductEditSection: React.FC<CompanyProductEditSectionProps> = ({
  items,
  onChange,
}) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyCompanyAndProductInformation}
    title="Company & Product Information"
    itemLabel={(item) => {
      const company = item.companyInformation?.[0]?.companyName;
      const product = item.productInformation?.[0]?.productNameCompany;
      return [company, product].filter(Boolean).join(' — ') || 'New Entry';
    }}
    renderItem={(item, _index, onItemChange) => (
      <Box>
        {/* ── Company Information sub-array ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Business sx={{ fontSize: 16, color: '#667eea' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Company Information
          </Typography>
        </Box>
        <ArraySectionEditor
          items={item.companyInformation ?? []}
          onChange={(companyItems) => onItemChange({ ...item, companyInformation: companyItems })}
          createItem={createEmptyCompanyInformation}
          itemLabel={(ci) => ci.companyName || 'New Company'}
          renderItem={renderCompanyItem}
        />

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

        {/* ── Product Information sub-array ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Inventory sx={{ fontSize: 16, color: '#10b981' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Product Information
          </Typography>
        </Box>
        <ArraySectionEditor
          items={item.productInformation ?? []}
          onChange={(productItems) => onItemChange({ ...item, productInformation: productItems })}
          createItem={createEmptyProductInformation}
          itemLabel={(pi) => pi.productNameCompany || 'New Product'}
          renderItem={renderProductItem}
        />
      </Box>
    )}
  />
);

export default CompanyProductEditSection;

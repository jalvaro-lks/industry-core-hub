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
import { Grid2, InputAdornment, TextField } from '@mui/material';
import {
  CarbonContentEntity,
  createEmptyCarbonContent,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';

interface CarbonContentEditSectionProps {
  items: CarbonContentEntity[];
  onChange: (items: CarbonContentEntity[]) => void;
}

/** Helper to parse numeric input, defaulting to undefined for empty values. */
const parseNum = (raw: string): number | undefined => {
  const v = parseFloat(raw);
  return isNaN(v) ? undefined : v;
};

/**
 * Edit section for the carbonContent array.
 * All 5 carbon content fields (all >= 0).
 */
const CarbonContentEditSection: React.FC<CarbonContentEditSectionProps> = ({ items, onChange }) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyCarbonContent}
    title="Carbon Content"
    itemLabel={(item, idx) => {
      if (item.carbonContentTotal != null) return `Total: ${item.carbonContentTotal} kg C`;
      return `Entry ${idx + 1}`;
    }}
    renderItem={(item, _index, onItemChange) => (
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Total Carbon Content"
            value={item.carbonContentTotal ?? ''}
            onChange={(e) => onItemChange({ ...item, carbonContentTotal: parseNum(e.target.value) })}
            className="pcf-edit-page__input"
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ endAdornment: <InputAdornment position="end">kg C</InputAdornment> }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Fossil Carbon Content"
            value={item.fossilCarbonContent ?? ''}
            onChange={(e) => onItemChange({ ...item, fossilCarbonContent: parseNum(e.target.value) })}
            className="pcf-edit-page__input"
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ endAdornment: <InputAdornment position="end">kg C</InputAdornment> }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Biogenic Carbon Content"
            value={item.biogenicCarbonContent ?? ''}
            onChange={(e) => onItemChange({ ...item, biogenicCarbonContent: parseNum(e.target.value) })}
            className="pcf-edit-page__input"
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ endAdornment: <InputAdornment position="end">kg C</InputAdornment> }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Packaging Biogenic Carbon"
            value={item.packagingBiogenicCarbonContent ?? ''}
            onChange={(e) => onItemChange({ ...item, packagingBiogenicCarbonContent: parseNum(e.target.value) })}
            className="pcf-edit-page__input"
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ endAdornment: <InputAdornment position="end">kg C</InputAdornment> }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Recycled Carbon Content"
            value={item.recycledCarbonContent ?? ''}
            onChange={(e) => onItemChange({ ...item, recycledCarbonContent: parseNum(e.target.value) })}
            className="pcf-edit-page__input"
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{ endAdornment: <InputAdornment position="end">kg C</InputAdornment> }}
          />
        </Grid2>
      </Grid2>
    )}
  />
);

export default CarbonContentEditSection;

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
import { Grid2, MenuItem, TextField } from '@mui/material';
import {
  ScopeOfPcfFormEntity,
  createEmptyScopeOfPcfForm,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';

const PARTIAL_FULL_OPTIONS = ['Cradle-to-gate', 'Cradle-to-grave'] as const;

interface ScopeEditSectionProps {
  items: ScopeOfPcfFormEntity[];
  onChange: (items: ScopeOfPcfFormEntity[]) => void;
}

/**
 * Edit section for the scopeOfPcfForm array.
 * Fields: specVersion (text), partialFullPcf (enum dropdown).
 */
const ScopeEditSection: React.FC<ScopeEditSectionProps> = ({ items, onChange }) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyScopeOfPcfForm}
    title="Scope of PCF Form"
    itemLabel={(item) => item.specVersion || 'New Scope Entry'}
    renderItem={(item, _index, onItemChange) => (
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Spec Version"
            required
            value={item.specVersion}
            onChange={(e) => onItemChange({ ...item, specVersion: e.target.value })}
            className="pcf-edit-page__input"
            placeholder="e.g. PACT Methodology v2.0.0"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="PCF Type"
            required
            value={item.partialFullPcf}
            onChange={(e) =>
              onItemChange({
                ...item,
                partialFullPcf: e.target.value as ScopeOfPcfFormEntity['partialFullPcf'],
              })
            }
            className="pcf-edit-page__input"
          >
            {PARTIAL_FULL_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>
      </Grid2>
    )}
  />
);

export default ScopeEditSection;

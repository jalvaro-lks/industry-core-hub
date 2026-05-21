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
import { Grid2, TextField } from '@mui/material';
import {
  GeneralEntity,
  createEmptyGeneral,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';

interface GeneralEditSectionProps {
  items: GeneralEntity[];
  onChange: (items: GeneralEntity[]) => void;
}

/**
 * Edit section for the general array.
 * Fields: comment (multiline text), pcfLegalStatement (multiline text).
 */
const GeneralEditSection: React.FC<GeneralEditSectionProps> = ({ items, onChange }) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyGeneral}
    title="General Information"
    itemLabel={(item) => {
      const preview = item.comment || item.pcfLegalStatement || '';
      return preview.length > 40 ? `${preview.slice(0, 40)}…` : preview || 'New Entry';
    }}
    renderItem={(item, _index, onItemChange) => (
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={item.comment ?? ''}
            onChange={(e) => onItemChange({ ...item, comment: e.target.value })}
            className="pcf-edit-page__input"
            placeholder="Additional notes or instructions for the recipient…"
          />
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="PCF Legal Statement"
            value={item.pcfLegalStatement ?? ''}
            onChange={(e) => onItemChange({ ...item, pcfLegalStatement: e.target.value })}
            className="pcf-edit-page__input"
            placeholder="Legal disclaimer or conditions for this PCF declaration…"
          />
        </Grid2>
      </Grid2>
    )}
  />
);

export default GeneralEditSection;

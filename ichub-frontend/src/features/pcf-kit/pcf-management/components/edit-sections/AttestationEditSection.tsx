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
  AttestationOfConformanceEntity,
  createEmptyAttestationOfConformance,
} from '../../types/pcfNestedData';
import ArraySectionEditor from './ArraySectionEditor';

interface AttestationEditSectionProps {
  items: AttestationOfConformanceEntity[];
  onChange: (items: AttestationOfConformanceEntity[]) => void;
}

/**
 * Edit section for the attestationOfConformance array.
 * Each item has 5 required text fields + 3 optional fields.
 */
const AttestationEditSection: React.FC<AttestationEditSectionProps> = ({ items, onChange }) => (
  <ArraySectionEditor
    items={items}
    onChange={onChange}
    createItem={createEmptyAttestationOfConformance}
    title="Attestation of Conformance"
    itemLabel={(item) => item.providerName || item.attestationType || 'New Attestation'}
    renderItem={(item, _index, onItemChange) => (
      <Grid2 container spacing={2}>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Attestation Type"
            required
            value={item.attestationType}
            onChange={(e) => onItemChange({ ...item, attestationType: e.target.value })}
            className="pcf-edit-page__input"
            placeholder="e.g. PCF 3rd party verification"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Standard Name"
            required
            value={item.standardName}
            onChange={(e) => onItemChange({ ...item, standardName: e.target.value })}
            className="pcf-edit-page__input"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Attestation Standard"
            required
            value={item.attestationStandard}
            onChange={(e) => onItemChange({ ...item, attestationStandard: e.target.value })}
            className="pcf-edit-page__input"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Conformance ID"
            required
            value={item.attestationOfConformanceId}
            onChange={(e) => onItemChange({ ...item, attestationOfConformanceId: e.target.value })}
            className="pcf-edit-page__input"
            placeholder="UUID or certificate number"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Provider Name"
            required
            value={item.providerName}
            onChange={(e) => onItemChange({ ...item, providerName: e.target.value })}
            className="pcf-edit-page__input"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Provider ID"
            value={item.providerId ?? ''}
            onChange={(e) => onItemChange({ ...item, providerId: e.target.value || undefined })}
            className="pcf-edit-page__input"
            placeholder="BPN or registration number"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Completed At"
            type="datetime-local"
            value={item.completedAt ? item.completedAt.slice(0, 16) : ''}
            onChange={(e) =>
              onItemChange({
                ...item,
                completedAt: e.target.value ? `${e.target.value}:00Z` : undefined,
              })
            }
            className="pcf-edit-page__input"
            InputLabelProps={{ shrink: true }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
          <TextField
            fullWidth
            size="small"
            label="Conformance Link"
            value={item.attestationOfConformanceLink ?? ''}
            onChange={(e) =>
              onItemChange({ ...item, attestationOfConformanceLink: e.target.value || undefined })
            }
            className="pcf-edit-page__input"
            placeholder="https://example.com/certificate"
          />
        </Grid2>
      </Grid2>
    )}
  />
);

export default AttestationEditSection;

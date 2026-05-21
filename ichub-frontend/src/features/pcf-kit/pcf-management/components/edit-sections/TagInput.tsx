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

import React, { useCallback, useState } from 'react';
import { Box, Chip, TextField, InputAdornment } from '@mui/material';
import { Add } from '@mui/icons-material';
import './TagInput.scss';

interface TagInputProps {
  /** Current list of tag values */
  values: string[];
  /** Called with updated array when tags change */
  onChange: (values: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** If true, tags cannot be added or removed */
  readOnly?: boolean;
  /** CSS class applied to the outer container */
  className?: string;
}

/**
 * Chip/tag input component for managing arrays of strings (e.g. companyIds,
 * productIds, crossSectoralStandards). Type a value and press Enter to add.
 * Click the delete icon on a chip to remove.
 */
const TagInput: React.FC<TagInputProps> = ({
  values,
  onChange,
  placeholder = 'Type and press Enter…',
  readOnly = false,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || values.includes(trimmed)) {
      setInputValue('');
      return;
    }
    onChange([...values, trimmed]);
    setInputValue('');
  }, [inputValue, values, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  const handleDelete = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index));
    },
    [values, onChange]
  );

  return (
    <Box className={`tag-input ${className ?? ''}`}>
      {/* Render existing tags as chips */}
      {values.length > 0 && (
        <Box className="tag-input__chips">
          {values.map((val, idx) => (
            <Chip
              key={`${val}-${idx}`}
              label={val}
              size="small"
              onDelete={readOnly ? undefined : () => handleDelete(idx)}
              className="tag-input__chip"
            />
          ))}
        </Box>
      )}

      {/* Text input for adding new tags */}
      {!readOnly && (
        <TextField
          fullWidth
          size="small"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pcf-edit-page__input"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Add
                  onClick={handleAdd}
                  sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}
    </Box>
  );
};

export default TagInput;

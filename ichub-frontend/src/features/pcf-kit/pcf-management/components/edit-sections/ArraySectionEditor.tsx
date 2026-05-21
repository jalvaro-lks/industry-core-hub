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
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
} from '@mui/icons-material';
import './ArraySectionEditor.scss';

/**
 * Props for the reusable ArraySectionEditor component.
 * Handles rendering a list of items with add/remove/expand-collapse
 * and delegates per-item rendering to a callback.
 */
interface ArraySectionEditorProps<T> {
  /** The array of items to render */
  items: T[];
  /** Called with the updated array whenever items change */
  onChange: (items: T[]) => void;
  /** Factory function to create a new default item */
  createItem: () => T;
  /** Renders the fields for a single item */
  renderItem: (item: T, index: number, onItemChange: (updated: T) => void) => React.ReactNode;
  /** Optional function to derive a label for each item (e.g., "Company: Acme") */
  itemLabel?: (item: T, index: number) => string;
  /** Section title shown at the top */
  title?: string;
  /** Maximum number of items allowed (no add button when reached) */
  maxItems?: number;
  /** If true, hides add/remove buttons (read-only array, still collapsible) */
  readOnly?: boolean;
}

/**
 * Reusable editor for arrays of objects within the PCF structure.
 * Renders each item as an expandable accordion card with add/remove controls.
 * Follows the ComplexFieldPanel pattern from submodel-creation.
 */
function ArraySectionEditor<T>({
  items,
  onChange,
  createItem,
  renderItem,
  itemLabel,
  title,
  maxItems,
  readOnly = false,
}: ArraySectionEditorProps<T>): React.ReactElement {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    () => new Set(items.length <= 2 ? items.map((_, i) => i) : [0])
  );

  const toggleExpanded = useCallback((index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    const newItem = createItem();
    const newItems = [...items, newItem];
    onChange(newItems);
    // Auto-expand the new item
    setExpandedIndices((prev) => new Set([...prev, newItems.length - 1]));
  }, [items, onChange, createItem]);

  const handleRemove = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index);
      onChange(updated);
      // Adjust expanded indices after removal
      setExpandedIndices((prev) => {
        const next = new Set<number>();
        prev.forEach((i) => {
          if (i < index) next.add(i);
          else if (i > index) next.add(i - 1);
        });
        return next;
      });
    },
    [items, onChange]
  );

  const handleItemChange = useCallback(
    (index: number, updated: T) => {
      const newItems = items.map((item, i) => (i === index ? updated : item));
      onChange(newItems);
    },
    [items, onChange]
  );

  const canAdd = !readOnly && (!maxItems || items.length < maxItems);
  const canRemove = !readOnly && items.length > 1;

  return (
    <Box className="array-section-editor">
      {/* Header row with title, count badge, and add button */}
      {(title || canAdd) && (
        <Box className="array-section-editor__header">
          {title && (
            <Box className="array-section-editor__title-row">
              <Typography className="array-section-editor__title">{title}</Typography>
              <Chip
                label={items.length}
                size="small"
                className="array-section-editor__count-chip"
              />
            </Box>
          )}
          {canAdd && (
            <Button
              size="small"
              startIcon={<Add />}
              onClick={handleAdd}
              className="array-section-editor__add-btn"
            >
              Add
            </Button>
          )}
        </Box>
      )}

      {/* Item accordions */}
      {items.map((item, index) => {
        const label = itemLabel ? itemLabel(item, index) : `Item ${index + 1}`;
        return (
          <Accordion
            key={index}
            expanded={expandedIndices.has(index)}
            onChange={() => toggleExpanded(index)}
            className="array-section-editor__accordion"
            disableGutters
          >
            <AccordionSummary
              expandIcon={<ExpandMore sx={{ color: 'rgba(255,255,255,0.5)' }} />}
              className="array-section-editor__accordion-summary"
            >
              <Box className="array-section-editor__accordion-label">
                <Chip
                  label={index + 1}
                  size="small"
                  className="array-section-editor__index-chip"
                />
                <Typography className="array-section-editor__item-label">
                  {label}
                </Typography>
              </Box>
              {canRemove && (
                <Tooltip title="Remove item">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="array-section-editor__remove-btn"
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </AccordionSummary>
            <AccordionDetails className="array-section-editor__accordion-details">
              {renderItem(item, index, (updated) => handleItemChange(index, updated))}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Empty state */}
      {items.length === 0 && (
        <Box className="array-section-editor__empty">
          <Typography className="array-section-editor__empty-text">
            No items yet. Click &quot;Add&quot; to create one.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ArraySectionEditor;

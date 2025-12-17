/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2025 LKS Next
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
    Box,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    TextField,
    Chip,
    Collapse,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { FormField } from '../../schemas/json-schema-interpreter';
import CustomTooltip from './CustomTooltip';

interface ComplexFieldPanelProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    depth: number;
    errors: string[];
    fieldErrors?: Set<string>;
    onFieldFocus?: (key: string) => void;
    onFieldBlur?: () => void;
    onInfoIconClick?: (key: string) => void;
    parentPath?: string; // Parent path for nested fields in arrays (e.g., 'materialList[0]')
    // Callback for rendering simple fields within complex structures
    renderSimpleField?: (field: FormField, value: any, onChange: (value: any) => void, parentPath?: string) => React.ReactNode;
}

/**
 * ComplexFieldPanel - Reusable component for rendering complex field types (arrays and nested objects)
 * Handles recursive rendering of nested structures with proper visual hierarchy
 */
const ComplexFieldPanel: React.FC<ComplexFieldPanelProps> = ({
    field,
    value,
    onChange,
    depth,
    errors,
    fieldErrors = new Set(),
    onFieldFocus,
    onFieldBlur,
    onInfoIconClick,
    parentPath,
    renderSimpleField
}) => {
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

    // Helper: Get field label with required indicator
    const getFieldLabel = (label: string, isRequired: boolean = false) => {
        const cleanLabel = label.replace(/(\s*\*\s*)+$/, '').trim();
        return isRequired ? `${cleanLabel} *` : cleanLabel;
    };

    // Helper: Get depth-based styling - using same color for all depths
    const getDepthStyles = (_currentDepth: number) => {
        return {
            borderColor: 'rgba(96, 165, 250, 0.4)',
            backgroundColor: 'rgba(96, 165, 250, 0.02)'
        };
    };

    // Helper: Get info icon with tooltip
    const getInfoIcon = (description?: string, fieldKey?: string, urn?: string) => {
        if (!description && !urn) return null;
        return (
            <CustomTooltip title="Description" description={description} urn={urn}>
                <InfoIcon
                    sx={{
                        fontSize: 16,
                        color: 'text.secondary',
                        cursor: 'pointer',
                        opacity: 1,
                        ml: 1
                    }}
                    onClick={fieldKey && onInfoIconClick ? (e) => { e.stopPropagation(); onInfoIconClick(fieldKey); } : undefined}
                />
            </CustomTooltip>
        );
    };

    // Check if this field has a DIRECT error (not child field errors)
    // For arrays/objects, only mark as error if the container itself has an error
    // (e.g., "materialList is required"), not if child fields have errors
    // (e.g., "materialList[0].currency is required" should not mark materialList red)
    const hasDirectError = () => {
        if (!fieldErrors.has(field.key)) return false;
        
        // Check if any error message mentions this exact field (not a child)
        // by looking for the field key at the start of error messages
        const fieldKeyLower = field.key.toLowerCase();
        return errors.some(error => {
            const errorLower = error.toLowerCase();
            // Check if error starts with this field key (direct error)
            // e.g., "materialList is required" or "materialList must be"
            if (errorLower.startsWith(fieldKeyLower)) {
                // Make sure it's not a child field error (no dot or bracket after)
                const afterKey = errorLower.substring(fieldKeyLower.length);
                // Direct error if followed by space, not by . or [
                return /^\s/.test(afterKey);
            }
            // Also check quoted patterns: "'materialList' is required"
            const quotedPattern = new RegExp(`^['"]${fieldKeyLower}['"]\\s+`, 'i');
            if (quotedPattern.test(errorLower)) return true;
            
            return false;
        });
    };
    
    const hasError = hasDirectError();

    // ARRAY RENDERING
    if (field.type === 'array') {
        const arrayValue = Array.isArray(value) ? value : [];
        
        const addArrayItem = () => {
            const newItem = field.itemType === 'object' ? {} : '';
            onChange([...arrayValue, newItem]);
        };
        
        const removeArrayItem = (index: number) => {
            const newArray = arrayValue.filter((_: any, i: number) => i !== index);
            onChange(newArray);
        };
        
        const updateArrayItem = (index: number, itemValue: any) => {
            const newArray = [...arrayValue];
            newArray[index] = itemValue;
            onChange(newArray);
        };

        // Count simple vs complex fields in items
        const simpleCount = field.itemFields?.filter(f => f.fieldCategory === 'simple').length || 0;
        const complexCount = field.itemFields?.filter(f => f.fieldCategory === 'complex').length || 0;

        const depthStyles = getDepthStyles(depth);

        return (
            <Box sx={{ width: '100%', mb: 2 }}>
                {/* Array Header */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 2,
                    pb: 1.5,
                    borderBottom: `2px solid ${depthStyles.borderColor}`
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: hasError ? 'error.main' : 'text.primary',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}>
                            {getFieldLabel(field.label, field.required)}
                        </Typography>
                        {getInfoIcon(field.description, field.key, field.urn)}
                        <Chip 
                            label={`${arrayValue.length} item${arrayValue.length !== 1 ? 's' : ''}`}
                            size="small" 
                            sx={{ 
                                height: 20,
                                fontSize: '0.75rem',
                                backgroundColor: depthStyles.backgroundColor,
                                color: 'text.primary',
                                border: `1px solid ${depthStyles.borderColor}`
                            }} 
                        />
                        {(simpleCount > 0 || complexCount > 0) && (
                            <Tooltip title={`${simpleCount} simple field${simpleCount !== 1 ? 's' : ''}, ${complexCount} complex field${complexCount !== 1 ? 's' : ''}`}>
                                <Chip 
                                    label={`${simpleCount}S / ${complexCount}C`}
                                    size="small" 
                                    sx={{ 
                                        height: 20,
                                        fontSize: '0.7rem',
                                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                        color: 'text.secondary'
                                    }} 
                                />
                            </Tooltip>
                        )}
                    </Box>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addArrayItem}
                        sx={{
                            textTransform: 'none',
                            fontSize: '0.8rem',
                            color: 'primary.main',
                            border: `1px solid ${depthStyles.borderColor}`,
                            '&:hover': {
                                backgroundColor: depthStyles.backgroundColor,
                                borderColor: 'primary.main'
                            }
                        }}
                    >
                        Add Item
                    </Button>
                </Box>

                {/* Array Items */}
                {arrayValue.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box 
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                borderRadius: 2,
                                border: '1px dashed rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                No items added yet.
                            </Typography>
                        </Box>
                        
                        <Button
                            fullWidth
                            size="medium"
                            startIcon={<AddIcon />}
                            onClick={addArrayItem}
                            sx={{
                                textTransform: 'none',
                                fontSize: '0.85rem',
                                color: 'primary.main',
                                border: '1px dashed rgba(96, 165, 250, 0.4)',
                                borderRadius: 2,
                                py: 1.5,
                                backgroundColor: 'rgba(96, 165, 250, 0.02)',
                                '&:hover': {
                                    backgroundColor: 'rgba(96, 165, 250, 0.08)',
                                    borderColor: 'primary.main',
                                    borderStyle: 'solid'
                                }
                            }}
                        >
                            Add Item
                        </Button>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {arrayValue.map((item: any, index: number) => {
                            const isExpanded = expandedItems[index] ?? true;
                            return (
                                <Card key={index} sx={{
                                    backgroundColor: depthStyles.backgroundColor,
                                    border: `1px solid ${depthStyles.borderColor}`,
                                    borderRadius: 2
                                }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            {/* Drag handle */}
                                            <DragIndicatorIcon sx={{ 
                                                color: 'text.secondary', 
                                                fontSize: 20,
                                                mt: 1,
                                                cursor: 'grab'
                                            }} />
                                            
                                            {/* Item content */}
                                            <Box sx={{ flex: 1 }}>
                                                {/* Item header (clickable to collapse/expand) */}
                                                <Box 
                                                    sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 1, 
                                                        mb: 1,
                                                        cursor: 'pointer',
                                                        userSelect: 'none'
                                                    }}
                                                    onClick={() => setExpandedItems(prev => ({ ...prev, [index]: !isExpanded }))}
                                                >
                                                    <ExpandMoreIcon 
                                                        sx={{ 
                                                            fontSize: 18,
                                                            color: 'primary.main',
                                                            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                            transition: 'transform 0.2s ease'
                                                        }} 
                                                    />
                                                    <Typography variant="caption" sx={{ 
                                                        color: 'text.secondary',
                                                        fontWeight: 600,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 1
                                                    }}>
                                                        Item {index + 1}
                                                    </Typography>
                                                </Box>
                                                
                                                {/* Item fields (collapsible) */}
                                                <Collapse in={isExpanded} timeout={200}>
                                                    {field.itemType === 'object' && field.itemFields ? (
                                                        // Render object fields
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                                            {field.itemFields.map((subField: FormField) => {
                                                                const simpleKey = subField.key.includes('.') 
                                                                    ? subField.key.split('.').pop() 
                                                                    : subField.key;
                                                                const subFieldValue = item[simpleKey!] || '';
                                                                
                                                                // Recursively render complex fields
                                                                if (subField.fieldCategory === 'complex') {
                                                                    // Construct parent path with array index for nested complex fields
                                                                    const nestedParentPath = `${field.key}[${index}]`;
                                                                    return (
                                                                        <ComplexFieldPanel
                                                                            key={subField.key}
                                                                            field={subField}
                                                                            value={subFieldValue}
                                                                            onChange={(newValue) => {
                                                                                const newItem = { ...item, [simpleKey!]: newValue };
                                                                                updateArrayItem(index, newItem);
                                                                            }}
                                                                            depth={depth + 1}
                                                                            errors={errors}
                                                                            fieldErrors={fieldErrors}
                                                                            onFieldFocus={onFieldFocus}
                                                                            onFieldBlur={onFieldBlur}
                                                                            onInfoIconClick={onInfoIconClick}
                                                                            parentPath={nestedParentPath}
                                                                            renderSimpleField={renderSimpleField}
                                                                        />
                                                                    );
                                                                }
                                                                
                                                                // Render simple field using callback if provided
                                                                if (renderSimpleField) {
                                                                    // Construct parent path with array index
                                                                    const arrayParentPath = `${field.key}[${index}]`;
                                                                    return (
                                                                        <Box key={subField.key}>
                                                                            {renderSimpleField(
                                                                                subField,
                                                                                subFieldValue,
                                                                                (newValue) => {
                                                                                    const newItem = { ...item, [simpleKey!]: newValue };
                                                                                    updateArrayItem(index, newItem);
                                                                                },
                                                                                arrayParentPath
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                }
                                                                
                                                                // Fallback: basic text field
                                                                return (
                                                                    <TextField
                                                                        key={subField.key}
                                                                        fullWidth
                                                                        size="small"
                                                                        label={getFieldLabel(subField.label, subField.required)}
                                                                        value={subFieldValue}
                                                                        onChange={(e) => {
                                                                            const newItem = { ...item, [simpleKey!]: e.target.value };
                                                                            updateArrayItem(index, newItem);
                                                                        }}
                                                                        placeholder={subField.placeholder}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    ) : (
                                                        // Render simple field (primitive array)
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item}
                                                            onChange={(e) => updateArrayItem(index, e.target.value)}
                                                            placeholder={`${field.label} item`}
                                                        />
                                                    )}
                                                </Collapse>
                                            </Box>
                                            
                                            {/* Delete button */}
                                            <IconButton
                                                size="small"
                                                onClick={() => removeArrayItem(index)}
                                                sx={{
                                                    color: 'error.main',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                                    }
                                                }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}

                {/* Array validation summary */}
                {field.validation && (
                    <Box sx={{ 
                        mt: 2, 
                        p: 1, 
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {arrayValue.length} item{arrayValue.length !== 1 ? 's' : ''}
                        </Typography>
                        {field.validation.minItems && arrayValue.length < field.validation.minItems && (
                            <Typography variant="caption" sx={{ color: 'error.main' }}>
                                Minimum {field.validation.minItems} items required
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    }

    // OBJECT RENDERING
    if (field.type === 'object' && field.objectFields) {
        const depthStyles = getDepthStyles(depth);
        const simpleCount = field.objectFields.filter(f => f.fieldCategory === 'simple').length;
        const complexCount = field.objectFields.filter(f => f.fieldCategory === 'complex').length;

        return (
            <Box sx={{ 
                width: '100%', 
                mb: 2,
                border: `1px solid ${depthStyles.borderColor}`,
                borderRadius: 2,
                backgroundColor: depthStyles.backgroundColor,
                overflow: 'hidden'
            }}>
                {/* Object Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1.5,
                    px: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: `1px solid ${depthStyles.borderColor}`
                }}>
                    <Typography 
                        variant="subtitle2" 
                        sx={{ 
                            fontWeight: 600,
                            color: hasError ? 'error.main' : 'text.primary',
                            fontSize: '0.9rem'
                        }}
                    >
                        {getFieldLabel(field.label, field.required)}
                    </Typography>
                    {getInfoIcon(field.description, field.key, field.urn)}
                    <Chip 
                        label={`${field.objectFields.length} field${field.objectFields.length !== 1 ? 's' : ''}`}
                        size="small" 
                        sx={{ 
                            ml: 'auto',
                            height: 20,
                            fontSize: '0.75rem',
                            backgroundColor: depthStyles.backgroundColor,
                            color: 'text.primary'
                        }} 
                    />
                    {(simpleCount > 0 || complexCount > 0) && (
                        <Tooltip title={`${simpleCount} simple, ${complexCount} complex`}>
                            <Chip 
                                label={`${simpleCount}S / ${complexCount}C`}
                                size="small" 
                                sx={{ 
                                    height: 20,
                                    fontSize: '0.7rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    color: 'text.secondary'
                                }} 
                            />
                        </Tooltip>
                    )}
                </Box>
                
                {/* Object Content */}
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {field.objectFields.map((objField: FormField) => {
                            const fieldKeyParts = objField.key.split('.');
                            const simpleKey = fieldKeyParts[fieldKeyParts.length - 1];
                            const objValue = value?.[simpleKey] || '';
                            
                            // Recursively render complex fields
                            if (objField.fieldCategory === 'complex') {
                                return (
                                    <ComplexFieldPanel
                                        key={objField.key}
                                        field={objField}
                                        value={objValue}
                                        onChange={(newValue) => {
                                            onChange({ ...value, [simpleKey]: newValue });
                                        }}
                                        depth={depth + 1}
                                        errors={errors}
                                        fieldErrors={fieldErrors}
                                        onFieldFocus={onFieldFocus}
                                        onFieldBlur={onFieldBlur}
                                        onInfoIconClick={onInfoIconClick}
                                        parentPath={parentPath}  // Propagate parentPath for nested structures
                                        renderSimpleField={renderSimpleField}
                                    />
                                );
                            }
                            
                            // Render simple field using callback
                            if (renderSimpleField) {
                                return (
                                    <Box key={objField.key}>
                                        {renderSimpleField(
                                            objField,
                                            objValue,
                                            (newValue) => {
                                                onChange({ ...value, [simpleKey]: newValue });
                                            },
                                            parentPath  // Pass parentPath if this object is nested in an array
                                        )}
                                    </Box>
                                );
                            }
                            
                            // Fallback
                            return null;
                        })}
                    </Box>
                </Box>
            </Box>
        );
    }

    return null;
};

export default ComplexFieldPanel;

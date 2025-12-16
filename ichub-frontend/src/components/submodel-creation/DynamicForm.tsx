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

import React, { useRef, useImperativeHandle, forwardRef, useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Switch,
    FormControlLabel,
    Button,
    IconButton,
    Card,
    CardContent,
    Collapse
} from '@mui/material';
import CustomTooltip from './CustomTooltip';
import {
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
    CalendarToday as CalendarTodayIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon,
    Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { SchemaDefinition } from '../../schemas';
import { FormField as BaseFormField } from '../../schemas/json-schema-interpreter';

// Extend FormField to allow urn property for UI logic
type FormField = BaseFormField & { urn?: string };
import { getValueByPath, setValueByPath } from './objectPathUtils';
import { scrollToElement } from '../../utils/fieldNavigation';
import '../../styles/fieldNavigation.css';
import ComplexFieldPanel from './ComplexFieldPanel';

// For backwards compatibility, use FormField as DPPFormField
type DPPFormField = FormField;

export interface DynamicFormProps {
    onlyRequired?: boolean;
    schema: SchemaDefinition;
    data: any;
    onChange: (data: any, changedFieldKey?: string) => void;
    errors: string[];
    fieldErrors?: Set<string>; // Fields that have validation errors
    focusedField?: string | null; // Currently focused field
    onFieldFocus?: (fieldKey: string) => void; // Callback when field is focused
    onFieldBlur?: () => void; // Callback when field loses focus
    onInfoIconClick?: (fieldKey: string) => void; // Callback when info icon is clicked
}

interface DynamicFormRef {
    scrollToField: (fieldKey: string) => void;
}

const DynamicForm = forwardRef<DynamicFormRef, DynamicFormProps>(({
    schema,
    data,
    onChange,
    errors,
    fieldErrors = new Set(),
    focusedField = null,
    onFieldFocus,
    onFieldBlur,
    onInfoIconClick,
    onlyRequired
}, ref) => {
    // Recursively filter required fields if onlyRequired is true
    function filterRequiredFields(fields: FormField[]): FormField[] {
        return fields
            .filter(field => field.required)
            .map(field => {
                // For objects with nested fields
                if (field.type === 'object' && Array.isArray(field.objectFields)) {
                    return {
                        ...field,
                        objectFields: filterRequiredFields(field.objectFields)
                    };
                }
                // For arrays with item fields
                if (field.type === 'array' && Array.isArray(field.itemFields)) {
                    return {
                        ...field,
                        itemFields: filterRequiredFields(field.itemFields)
                    };
                }
                return field;
            })
            .filter(field => {
                // Remove empty objects/arrays
                if (field.type === 'object' && Array.isArray(field.objectFields) && field.objectFields.length === 0) return false;
                if (field.type === 'array' && Array.isArray(field.itemFields) && field.itemFields.length === 0) return false;
                return true;
            });
    }

    let formFields = schema.formFields as FormField[];
    if (typeof onlyRequired === 'boolean' && onlyRequired) {
        formFields = filterRequiredFields(formFields);
    }
    const fieldRefs = useRef<Record<string, any>>({});
    const accordionRefs = useRef<Record<string, any>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    
    // State to control which main section is expanded (only one at a time, all collapsed by default)
    const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

    // Group fields by section using comprehensive interpreter data
    const groupedFields = formFields.reduce((acc, field) => {
        if (!acc[field.section]) {
            acc[field.section] = [];
        }
        acc[field.section].push(field);
        return acc;
    }, {} as Record<string, FormField[]>);

    // Create hierarchical structure for nested fields
    interface FieldNode {
        field?: FormField;
        children: Record<string, FieldNode>;
        path: string;
        isLeaf: boolean;
    }

    const createFieldHierarchy = (fields: FormField[]): Record<string, FieldNode> => {
        const root: Record<string, FieldNode> = {};

        fields.forEach(field => {
            const pathParts = field.key.split('.');
            let current = root;
            let currentPath = '';

            pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}.${part}` : part;
                
                if (!current[part]) {
                    current[part] = {
                        children: {},
                        path: currentPath,
                        isLeaf: index === pathParts.length - 1
                    };
                }

                if (index === pathParts.length - 1) {
                    // This is the leaf node, attach the field
                    current[part].field = field;
                    current[part].isLeaf = true;
                } else {
                    // This is an intermediate node
                    current[part].isLeaf = false;
                }

                current = current[part].children;
            });
        });

        return root;
    };

    // Find which section contains a field
    const findFieldSection = (fieldKey: string): string | null => {
        for (const [sectionName, sectionFields] of Object.entries(groupedFields)) {
            if (sectionFields.some(field => field.key === fieldKey)) {
                return sectionName;
            }
        }
        return null;
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        scrollToField: (fieldKey: string) => {
            // First, find and expand the section containing this field
            const sectionName = findFieldSection(fieldKey);
            const performScroll = () => {
                const element = fieldRefs.current[fieldKey] as HTMLElement | null;
                if (!element) return;
                // Use centralized helper: scroll, focus (if input), and highlight (3s)
                scrollToElement({ element, container: containerRef.current, focus: true, highlightClass: 'field-nav-highlight', durationMs: 3000, block: 'center' });
            };

            if (sectionName && expandedPanel !== sectionName) {
                setExpandedPanel(sectionName);
                // Wait for expansion animation to complete before scrolling. Use a short delay to allow render.
                setTimeout(() => performScroll(), 320);
            } else {
                performScroll();
            }
        }
    }));

    const handleFieldChange = (field: FormField, value: any) => {
        const newData = setValueByPath(data, field.key, value);
        onChange(newData, field.key); // Pass the field key that changed
    };

    // Precompute error states for all fields
    type ErrorState = { hasError: boolean; errorMessages: string[] };
    const errorStateMap: Record<string, ErrorState> = {};
    for (const sectionFields of Object.values(groupedFields)) {
        for (const field of sectionFields) {
            const hasPersistedError = fieldErrors.has(field.key);
            if (!hasPersistedError || errors.length === 0) {
                errorStateMap[field.key] = { hasError: false, errorMessages: [] };
                continue;
            }
            const fieldKey = field.key;
            const fieldLabel = field.label;
            const keyParts = fieldKey.split('.')
            const lastKeyPart = keyParts[keyParts.length - 1];
            // Collect all errors for this field
            const matchedErrors = errors.filter(error => {
                const errorLower = error.toLowerCase();
                const fieldKeyLower = fieldKey.toLowerCase();
                if (error.includes(`'${fieldKey}'`) || error.includes(`"${fieldKey}"`)) return true;
                if (errorLower.includes(fieldKeyLower)) {
                    const regex = new RegExp(`\\b${fieldKeyLower.replace(/\\./g, '\\.')}\\b`);
                    if (regex.test(errorLower)) return true;
                }
                if (error.includes(`'${fieldLabel}'`) || error.includes(`"${fieldLabel}"`)) return true;
                if (keyParts.length > 1 && errorLower.includes(lastKeyPart.toLowerCase())) {
                    const hasContextMatch = keyParts.slice(0, -1).some(part => errorLower.includes(part.toLowerCase()));
                    if (hasContextMatch) return true;
                }
                return false;
            });
            // Format all error messages for display
            const formattedMessages = matchedErrors.map(msg => {
                let formatted = msg
                    .replace(new RegExp(`'${fieldKey}'`, 'gi'), '')
                    .replace(new RegExp(`"${fieldKey}"`, 'gi'), '')
                    .replace(new RegExp(`'${fieldLabel}'`, 'gi'), '')
                    .replace(new RegExp(`"${fieldLabel}"`, 'gi'), '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
                if (formatted && formatted.length > 0) {
                    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                }
                return formatted;
            });
            errorStateMap[field.key] = {
                hasError: formattedMessages.length > 0,
                errorMessages: formattedMessages
            };
        }
    }

    // Common description tooltip with info icon click
    // Show info icon with combined tooltip (description + URN if present)
    const getDescriptionTooltip = (description?: string, fieldKey?: string, urn?: string): React.ReactElement | null => {
        if (!description && !urn) return null;
        return (
            <CustomTooltip title="Description" description={description} urn={urn}>
                <InfoIcon
                    sx={{
                        fontSize: 16,
                        color: 'text.secondary',
                        cursor: 'pointer',
                        opacity: 1
                    }}
                    onClick={fieldKey && onInfoIconClick ? (e) => { e.stopPropagation(); onInfoIconClick(fieldKey); } : undefined}
                />
            </CustomTooltip>
        );
    };

    // Icon container: right outside the field, show icons only if present
    // Only show info icon with combined tooltip (description + URN)
    const getIconContainer = (description?: string, fieldKey?: string, urn?: string) => {
        if (!description && !urn) return null;
        const tooltip = getDescriptionTooltip(description, fieldKey, urn);
        if (!tooltip) return null;
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 1.5,
                gap: 0.5
            }}>
                {tooltip && tooltip}
            </Box>
        );
    };

    // Helper: Get field label with required indicator
    const getFieldLabel = (label: string, isRequired: boolean = false) => {
        const cleanLabel = label.replace(/(\s*\*\s*)+$/, '').trim();
        return isRequired ? `${cleanLabel} *` : cleanLabel;
    };

    // Helper: Get field styles based on state
    const getFieldStyles = (required: boolean, isEmpty: boolean = false, hasError: boolean = false) => ({
        '& .MuiOutlinedInput-root, & .MuiInputBase-root, & .MuiSelect-root': {
            backgroundColor: 'rgba(19, 19, 19, 0.02)',
            '&:hover fieldset, &:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(96, 165, 250, 0.5)',
            },
            '&.Mui-focused fieldset, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: hasError ? 'error.main' : 'primary.main',
            },
            ...(hasError && {
                '& fieldset, & .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'error.main',
                    borderWidth: '2px',
                }
            })
        },
        '& .MuiInputLabel-root': {
            color: hasError ? 'error.main' : 'text.secondary',
            '&.Mui-focused': {
                color: hasError ? 'error.main' : 'primary.main',
            }
        }
    });

    // Helper: Get FormControl label styles
    const getFormControlLabelStyles = (isRequired: boolean, hasError: boolean = false) => ({
        color: hasError ? 'error.main' : 'text.secondary',
        '&.Mui-focused': {
            color: hasError ? 'error.main' : 'primary.main',
        }
    });

    /**
     * Renders simple (primitive) fields - separated for reusability in ComplexFieldPanel
     * @param field - The field definition
     * @param value - Current value
     * @param onChange - Change handler
     * @param parentPath - Optional parent path for nested fields
     */
    const renderSimpleField = (field: FormField, value: any, onChange: (value: any) => void, parentPath?: string) => {
        const fieldKey = parentPath ? `${parentPath}.${field.key}` : field.key;
        const hasPersistedError = fieldErrors.has(fieldKey);
        const isFieldFocused = focusedField === fieldKey;
        const { hasError, errorMessages } = errorStateMap[fieldKey] || { hasError: false, errorMessages: [] };
        
        const isRequiredAndEmpty = field.required && 
            (!value || value === '' || (Array.isArray(value) && value.length === 0));

        const commonProps = {
            onFocus: () => onFieldFocus?.(fieldKey),
            onBlur: () => onFieldBlur?.(),
            error: hasError,
            helperText: hasError && isFieldFocused && errorMessages.length > 0 ? (
                <span>{errorMessages.map((msg, i) => <div key={i}>{msg}</div>)}</span>
            ) : undefined,
        };

        switch (field.type) {
            case 'text':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'textarea':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            multiline
                            maxRows={4}
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'number':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'integer':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="number"
                            value={value || ''}
                            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            inputProps={{
                                min: field.validation?.min || 0,
                                max: field.validation?.max,
                                step: 1
                            }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'date':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="date"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            InputProps={{
                                startAdornment: (
                                    <CalendarTodayIcon sx={{ fontSize: 20, color: '#ffffff', mr: 1 }} />
                                ),
                            }}
                            sx={{
                                ...getFieldStyles(field.required, isRequiredAndEmpty, hasError),
                                flex: 1, minWidth: 0, maxWidth: '100%',
                                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                    filter: 'invert(1)',
                                    cursor: 'pointer'
                                }
                            }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'datetime':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="datetime-local"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'time':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="time"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'email':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="email"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'url':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth={false}
                            type="url"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder || getFieldLabel(field.label, field.required)}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{ shrink: false }}
                            sx={{ ...getFieldStyles(field.required, isRequiredAndEmpty, hasError), flex: 1, minWidth: 0, maxWidth: '100%' }}
                            {...commonProps}
                        />
                    </Box>
                );

            case 'select':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControl size="small" error={hasError} sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
                            <InputLabel sx={getFormControlLabelStyles(field.required, hasError)}>
                                {getFieldLabel(field.label, field.required)}
                            </InputLabel>
                            <Select
                                value={value || ''}
                                label={getFieldLabel(field.label, field.required)}
                                onChange={(e) => onChange(e.target.value)}
                                sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                                {...commonProps}
                            >
                                <MenuItem value="">
                                    <em>Empty</em>
                                </MenuItem>
                                {field.options?.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {hasError && isFieldFocused && errorMessages.length > 0 && (
                                <FormHelperText>
                                    {errorMessages.map((msg, i) => <div key={i}>{msg}</div>)}
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Box>
                );

            case 'checkbox':
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                                onClick={() => onChange(!value)}
                                tabIndex={0}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    py: 1,
                                    px: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${hasError ? 'rgba(211, 47, 47, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                                    borderRadius: 1,
                                    minHeight: '40px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderColor: 'rgba(96, 165, 250, 0.5)',
                                    }
                                }}
                                {...commonProps}
                            >
                                <Typography variant="body2" sx={{ color: hasError ? 'error.main' : 'text.primary' }}>
                                    {getFieldLabel(field.label, field.required)}
                                </Typography>
                                <Switch
                                    checked={!!value}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onChange(e.target.checked);
                                    }}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                            color: 'primary.main',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                            backgroundColor: 'primary.main',
                                        },
                                    }}
                                />
                            </Box>
                            {getIconContainer(field.description, fieldKey, field.urn)}
                        </Box>
                        {hasError && isFieldFocused && errorMessages.length > 0 && (
                            <Typography variant="caption" sx={{ color: 'error.main', ml: 1.75, fontSize: '0.75rem' }}>
                                {errorMessages.map((msg, i) => <div key={i}>{msg}</div>)}
                            </Typography>
                        )}
                    </Box>
                );

            default:
                return null;
        }
    };

    const renderField = (field: FormField) => {
        const currentValue = getValueByPath(data, field.key) || '';

        // Delegate to renderSimpleField for simple types or ComplexFieldPanel for complex types
        if (field.fieldCategory === 'simple') {
            return (
                <Box key={field.key} sx={{ mb: 2 }}>
                    {renderSimpleField(field, currentValue, (newValue) => handleFieldChange(field, newValue))}
                </Box>
            );
        }

        // Handle complex fields (arrays and objects) - already covered above in switch statement
        switch (field.type) {

            case 'array':
            case 'object':
                // Delegate complex field rendering to ComplexFieldPanel
                return (
                    <Box key={field.key} sx={{ width: '100%' }}>
                        <ComplexFieldPanel
                            field={field}
                            value={currentValue}
                            onChange={(newValue) => handleFieldChange(field, newValue)}
                            depth={1}
                            errors={errors}
                            fieldErrors={fieldErrors}
                            onFieldFocus={onFieldFocus}
                            onFieldBlur={onFieldBlur}
                            onInfoIconClick={onInfoIconClick}
                            renderSimpleField={(simpleField, simpleValue, simpleOnChange) => 
                                renderSimpleField(simpleField, simpleValue, simpleOnChange, field.key)
                            }
                        />
                    </Box>
                );

            default:
                return null;
        }
    };

    // State for nested group expansion
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Render hierarchical field structure with proper visual nesting
    const renderFieldHierarchy = (nodes: Record<string, FieldNode>, depth = 0): React.ReactElement[] => {
        return Object.entries(nodes)
            .map(([key, node]) => {
                if (node.isLeaf && node.field) {
                    // Render the actual field
                    return (
                        <Box 
                            key={node.field.key}
                            sx={{ 
                                mb: 2
                            }}
                            ref={(el) => {
                                if (el) fieldRefs.current[node.field!.key] = el;
                            }}
                        >
                            {renderField(node.field)}
                        </Box>
                    );
                } else {
                    // Render a nested group
                    const hasChildFields = Object.values(node.children).some(child => 
                        child.isLeaf || Object.keys(child.children).length > 0
                    );

                    if (!hasChildFields) return null;

                    // Create a friendly label for the group
                    const groupLabel = key.charAt(0).toUpperCase() + key.slice(1)
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^s/, '');

                    const groupId = `${node.path}-${depth}`;
                    const isGroupExpanded = expandedGroups[groupId] ?? true; // Default expanded

                    // Add data-object attribute for parent object containers (not for root)
                    const groupBoxProps: any = {
                        key: node.path,
                        sx: { mb: 2 }
                    };
                    if (depth > 0) {
                        groupBoxProps['data-object'] = node.path;
                    }

                    return (
                        <Box {...groupBoxProps}>
                            {/* Parent Group Container */}
                            <Box
                                sx={{
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    // Only apply hover effects to nested groups (depth > 0)
                                    ...(depth > 0 && {
                                        '&:hover': {
                                            borderColor: 'rgba(96, 165, 250, 0.3)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.03)'
                                        }
                                    })
                                }}
                            >
                                {/* Group Header - always visible for nested groups */}
                                {depth > 0 && (
                                    <Box
                                        onClick={() => setExpandedGroups(prev => ({ 
                                            ...prev, 
                                            [groupId]: !isGroupExpanded 
                                        }))}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: 'pointer',
                                            py: 1.5,
                                            px: 2,
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            borderBottom: isGroupExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(96, 165, 250, 0.1)'
                                            }
                                        }}
                                    >
                                        <ExpandMoreIcon 
                                            sx={{ 
                                                fontSize: 18,
                                                color: 'primary.main',
                                                transform: isGroupExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                transition: 'transform 0.2s ease'
                                            }} 
                                        />
                                        <Typography 
                                            variant="subtitle2" 
                                            sx={{ 
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            {groupLabel}
                                        </Typography>
                                        {/* Info icon for object group if metadata present (now to the right of the label) */}
                                        {(() => {
                                            const metaField = node.field;
                                            if (metaField && (metaField.description || metaField.urn)) {
                                                return getIconContainer(metaField.description, metaField.key, metaField.urn);
                                            }
                                            return null;
                                        })()}
                                        <Chip 
                                            label={Object.keys(node.children).length} 
                                            size="small" 
                                            sx={{ 
                                                ml: 'auto',
                                                height: 20,
                                                fontSize: '0.75rem',
                                                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                                color: 'primary.main'
                                            }} 
                                        />
                                    </Box>
                                )}
                                
                                {/* Group Content - nested fields appear INSIDE this container */}
                                <Collapse in={isGroupExpanded} timeout={200}>
                                    <Box 
                                        sx={{ 
                                            p: 2,
                                            pt: depth === 0 ? 2 : 1.5, // Less padding at top if there's a header
                                            backgroundColor: depth > 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                                            // Create visual depth with subtle background changes
                                            ...(depth > 1 && {
                                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                                borderLeft: '3px solid rgba(96, 165, 250, 0.2)'
                                            })
                                        }}
                                    >
                                        {renderFieldHierarchy(node.children, depth + 1)}
                                    </Box>
                                </Collapse>
                            </Box>
                        </Box>
                    );
                }
            })
            .filter(Boolean) as React.ReactElement[];
    };

    return (
        <Box 
            ref={containerRef}
            sx={{
                // Custom scrollbar styling
                '& ::-webkit-scrollbar': {
                    width: '8px',
                },
                '& ::-webkit-scrollbar-track': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                },
                '& ::-webkit-scrollbar-thumb': {
                    background: 'rgba(96, 165, 250, 0.6)',
                    borderRadius: '4px',
                    '&:hover': {
                        background: 'rgba(96, 165, 250, 0.8)',
                    }
                },
                '& ::-webkit-scrollbar-thumb:active': {
                    background: 'rgba(96, 165, 250, 1)',
                }
            }}
        >
            {Object.entries(groupedFields).map(([sectionName, sectionFields]: [string, DPPFormField[]]) => {
                const requiredFieldsCount = sectionFields.filter((f: DPPFormField) => f.required).length;
                const displayName = sectionName; // Use section name directly (no hardcoded mapping)
                
                // Determine section type from first field with sectionType (should all be same)
                const sectionField = sectionFields.find(f => f.sectionType);
                const sectionType = sectionField?.sectionType;
                
                // PRIMITIVE SECTION: Render inline without accordion
                if (sectionType === 'primitive') {
                    const field = sectionFields[0]; // Primitive sections have only one field
                    let fieldValue = getValueByPath(data, field.key);
                    // Ensure primitive value - if it's an object, treat as empty
                    if (typeof fieldValue === 'object' && fieldValue !== null) {
                        fieldValue = '';
                    }
                    const hasError = fieldErrors.has(field.key);
                    const fieldError = errors.find(err => err.includes(field.key));
                    
                    return (
                        <Box
                            key={sectionName}
                            ref={(el) => {
                                if (el) {
                                    accordionRefs.current[sectionName] = el;
                                    fieldRefs.current[field.key] = el;
                                }
                            }}
                            data-section={sectionName}
                            data-field={field.key}
                            sx={{
                                mb: 2,
                                p: 1.5,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                border: hasError ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                '&:before': {
                                    display: 'none',
                                }
                            }}
                        >
                            {/* Section label */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '200px' }}>
                                {getIconContainer(field.description, undefined, field.urn)}
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    {displayName}
                                    {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                                </Typography>
                            </Box>
                            
                            {/* Input field - full width */}
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                {renderSimpleField(field, fieldValue, (newValue) => handleFieldChange(field, newValue))}
                            </Box>
                            
                            {/* Error icon with tooltip */}
                            {hasError && fieldError && (
                                <CustomTooltip title="Validation Error" description={fieldError}>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            color: 'error.main',
                                            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                                        }}
                                        onClick={() => {
                                            // Optional: navigate to errors panel or show detailed error
                                            if (onFieldFocus) onFieldFocus(field.key);
                                        }}
                                    >
                                        <InfoIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </CustomTooltip>
                            )}
                        </Box>
                    );
                }
                
                // ARRAY & OBJECT SECTIONS: Render as accordion (existing behavior)
                return (
                    <Accordion
                        key={sectionName}
                        expanded={expandedPanel === sectionName}
                        onChange={(event, isExpanded) => {
                            setExpandedPanel(isExpanded ? sectionName : null);
                            if (isExpanded) {
                                const el = accordionRefs.current[sectionName] as HTMLElement | null;
                                const container = containerRef.current;
                                // Use centralized helper to scroll the container to the expanded section.
                                // Small delay gives the accordion time to animate/measure.
                                setTimeout(() => {
                                    if (el) {
                                        scrollToElement({ element: el, container, focus: false, highlightClass: '', durationMs: 0, block: 'start' });
                                    }
                                }, 120);
                            }
                        }}
                        ref={(el) => {
                            if (el) accordionRefs.current[sectionName] = el;
                        }}
                        // Make the accordion discoverable by the field navigation helper
                        data-section={sectionName}
                        sx={{
                            mb: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            '&:before': {
                                display: 'none',
                            },
                            '& .MuiAccordionSummary-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                            }
                        }}
                    >
                        <AccordionSummary 
                            expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                {/* Info/fingerprint icons only if present for section (only own URN/description) */}
                                {(() => {
                                    // Priorizar el pseudo-campo de sección (key === sectionName y type === 'object')
                                    let infoField = sectionFields.find(f => f.key === sectionName && f.type === 'object');
                                    // Si no existe, usar el primer campo con descripción o URN
                                    if (!infoField) infoField = sectionFields.find(f => f.description || f.urn);
                                    if (!infoField) return null;
                                    return getIconContainer(infoField.description, undefined, infoField.urn);
                                })()}
                                <Typography variant="h6" sx={{ 
                                    fontWeight: 600,
                                    color: 'text.primary'
                                }}>
                                    {displayName}
                                </Typography>
                                <Chip
                                    label={`${sectionFields.length} field${sectionFields.length !== 1 ? 's' : ''}`}
                                    size="small"
                                    sx={{
                                        fontSize: '0.7rem',
                                        height: 20,
                                        backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                        color: 'primary.main'
                                    }}
                                />
                                {requiredFieldsCount > 0 && (
                                    <Chip
                                        label={`${requiredFieldsCount} required`}
                                        size="small"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: 20,
                                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                            color: 'error.main'
                                        }}
                                    />
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {renderFieldHierarchy(createFieldHierarchy(sectionFields))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
});

DynamicForm.displayName = 'DynamicForm';

export default DynamicForm;
export type { DynamicFormRef };
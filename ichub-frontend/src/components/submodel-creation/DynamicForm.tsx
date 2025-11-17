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
    Tooltip,
    Switch,
    FormControlLabel,
    Button,
    IconButton,
    Card,
    CardContent,
    Collapse
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
    CalendarToday as CalendarTodayIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { SchemaDefinition } from '../../schemas';
import { FormField } from '../../schemas/json-schema-interpreter';

// For backwards compatibility, use FormField as DPPFormField
type DPPFormField = FormField;

interface DynamicFormProps {
    schema: SchemaDefinition;
    data: any;
    onChange: (data: any, changedFieldKey?: string) => void;
    errors: string[];
    fieldErrors?: Set<string>; // Fields that have validation errors
    focusedField?: string | null; // Currently focused field
    onFieldFocus?: (fieldKey: string) => void; // Callback when field is focused
    onFieldBlur?: () => void; // Callback when field loses focus
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
    onFieldBlur
}, ref) => {
    const formFields = schema.formFields as FormField[];
    const fieldRefs = useRef<Record<string, any>>({});
    const accordionRefs = useRef<Record<string, any>>({});
    
    // State to control expanded panels - expand main sections by default
    const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
        'Metadata': false,
        'Identification': false,
        'Operation': false,
        'Product Characteristics': false,
        'Commercial Information': false,
        'Materials': false,
        'Sustainability': false
    });

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

    // Get user-friendly section name
    const getSectionDisplayName = (sectionName: string): string => {
        const sectionNames: Record<string, string> = {
            'Product Identifier': 'Product Identifier',
            'Product Description': 'Product Description',
            'Manufacturing Information': 'Manufacturing Information',
            'Sustainability': 'Sustainability',
            'Compliance': 'Compliance',
            'Additional Information': 'Additional Information'
        };
        return sectionNames[sectionName] || sectionName.replace(/([A-Z])/g, ' $1').trim();
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
            if (sectionName && !expandedPanels[sectionName]) {
                setExpandedPanels(prev => ({ ...prev, [sectionName]: true }));
                
                // Wait for expansion animation to complete before scrolling
                setTimeout(() => {
                    const element = fieldRefs.current[fieldKey];
                    if (element) {
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        // Add a visual highlight effect
                        element.style.transition = 'box-shadow 0.3s ease';
                        element.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.5)';
                        setTimeout(() => {
                            element.style.boxShadow = '';
                        }, 2000);
                    }
                }, 300);
            } else {
                // Section is already expanded, scroll immediately
                const element = fieldRefs.current[fieldKey];
                if (element) {
                    element.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    // Add a visual highlight effect
                    element.style.transition = 'box-shadow 0.3s ease';
                    element.style.boxShadow = '0 0 0 3px rgba(96, 165, 250, 0.5)';
                    setTimeout(() => {
                        element.style.boxShadow = '';
                    }, 2000);
                }
            }
        }
    }));

    // Get value from nested object path (e.g., "productIdentifier.manufacturerPartId")
    const getValueByPath = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    };

    // Set value in nested object path
    const setValueByPath = (obj: any, path: string, value: any): any => {
        const keys = path.split('.');
        const result = { ...obj };
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            } else {
                current[key] = { ...current[key] };
            }
            current = current[key];
        }

        const lastKey = keys[keys.length - 1];
        if (value === '' || value === null || value === undefined) {
            delete current[lastKey];
        } else {
            current[lastKey] = value;
        }

        return result;
    };

    const handleFieldChange = (field: FormField, value: any) => {
        const newData = setValueByPath(data, field.key, value);
        onChange(newData, field.key); // Pass the field key that changed
    };

    const renderField = (field: FormField) => {
        const currentValue = getValueByPath(data, field.key) || '';
        
        // Check if this field has a persistent error (from validation)
        const hasPersistedError = fieldErrors.has(field.key);
        
        // Check if this field is currently focused/being edited
        const isFieldFocused = focusedField === field.key;
        
        // IMPROVED: Error detection with persistence
        // Shows red border if field has error, shows error message only when focused
        const { hasError, errorMessage } = useMemo(() => {
            // If this field doesn't have a persisted error, no error to show
            if (!hasPersistedError || errors.length === 0) {
                return { hasError: false, errorMessage: undefined };
            }
            
            const fieldKey = field.key;
            const fieldLabel = field.label;
            
            // Split nested field key to check for partial matches
            const keyParts = fieldKey.split('.');
            const lastKeyPart = keyParts[keyParts.length - 1];
            
            let matchedError: string | undefined;
            
            const hasFieldError = errors.some(error => {
                const errorLower = error.toLowerCase();
                const fieldKeyLower = fieldKey.toLowerCase();
                
                // Method 1: Exact field key match with quotes (highest priority)
                if (error.includes(`'${fieldKey}'`) || error.includes(`"${fieldKey}"`)) {
                    matchedError = error;
                    return true;
                }
                
                // Method 2: Exact field key match without quotes
                if (errorLower.includes(fieldKeyLower)) {
                    const regex = new RegExp(`\\b${fieldKeyLower.replace(/\./g, '\\.')}\\b`);
                    if (regex.test(errorLower)) {
                        matchedError = error;
                        return true;
                    }
                }
                
                // Method 3: Match by label (for user-friendly error messages)
                if (error.includes(`'${fieldLabel}'`) || error.includes(`"${fieldLabel}"`)) {
                    matchedError = error;
                    return true;
                }
                
                // Method 4: For nested fields, also check the last part of the key
                if (keyParts.length > 1 && errorLower.includes(lastKeyPart.toLowerCase())) {
                    const hasContextMatch = keyParts.slice(0, -1).some(part => 
                        errorLower.includes(part.toLowerCase())
                    );
                    if (hasContextMatch) {
                        matchedError = error;
                        return true;
                    }
                }
                
                return false;
            });
            
            // Format error message for display (only shown when focused)
            let formattedMessage: string | undefined;
            if (hasFieldError && matchedError) {
                formattedMessage = matchedError
                    .replace(new RegExp(`'${fieldKey}'`, 'gi'), '')
                    .replace(new RegExp(`"${fieldKey}"`, 'gi'), '')
                    .replace(new RegExp(`'${fieldLabel}'`, 'gi'), '')
                    .replace(new RegExp(`"${fieldLabel}"`, 'gi'), '')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
                
                if (formattedMessage && formattedMessage.length > 0) {
                    formattedMessage = formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1);
                }
            }
            
            return { 
                hasError: hasFieldError, 
                errorMessage: formattedMessage 
            };
        }, [hasPersistedError, errors, field.key, field.label]);



        // Check if field is required and empty for additional visual feedback
        const isRequiredAndEmpty = field.required && 
            (!currentValue || currentValue === '' || 
             (Array.isArray(currentValue) && currentValue.length === 0));

        // Nueva función: Maneja etiquetas con asteriscos para campos requeridos
        const getFieldLabel = (label: string, isRequired: boolean = false) => {
            // Limpiar asteriscos existentes primero
            const cleanLabel = label.replace(/(\s*\*\s*)+$/, '').trim();
            // Agregar asterisco solo si es requerido
            return isRequired ? `${cleanLabel} *` : cleanLabel;
        };

        // Función actualizada: Separar styling de errores reales vs campos requeridos
        const getFieldStyles = (required: boolean, isEmpty: boolean = false, hasError: boolean = false) => ({
            '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(19, 19, 19, 0.02)',
                '&:hover fieldset': {
                    borderColor: 'rgba(96, 165, 250, 0.5)',
                },
                '&.Mui-focused fieldset': {
                    borderColor: hasError ? 'error.main' : 'primary.main',
                },
                // Borde rojo solo para errores reales, no solo por ser requerido
                ...(hasError && {
                    '& fieldset': {
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

        // Función para FormControl labels
        const getFormControlLabelStyles = (isRequired: boolean, hasError: boolean = false) => ({
            color: hasError ? 'error.main' : 'text.secondary',
            '&.Mui-focused': {
                color: hasError ? 'error.main' : 'primary.main',
            }
        });

        // Common description tooltip
        const getDescriptionTooltip = (description?: string) => 
            description ? (
                <Tooltip title={description} placement="top" arrow>
                    <InfoIcon sx={{ 
                        fontSize: 16, 
                        color: 'text.secondary',
                        cursor: 'help',
                        opacity: 1
                    }} />
                </Tooltip>
            ) : undefined;

        // Common icon container positioned on the border
        const getIconContainer = (description?: string) => 
            description ? (
                <Box sx={{ 
                    position: 'absolute', 
                    right: 32, 
                    top: -10,
                    zIndex: 1,
                    backgroundColor: 'background.paper',
                    borderRadius: '12px',
                    padding: '3px',
                    border: '1px solid rgba(158, 63, 63, 0)',
                    boxShadow: '0 1px 2px rgba(65, 65, 65, 0)',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {getDescriptionTooltip(description)}
                </Box>
            ) : null;

        switch (field.type) {
            case 'text':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            placeholder={field.placeholder}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'textarea':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={4}
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            placeholder={field.placeholder}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'number':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="number"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            placeholder={field.placeholder}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            inputProps={{
                                min: field.validation?.min || 0,
                                max: field.validation?.max || undefined,
                                step: "any"
                            }}
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'date':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="date"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <CalendarTodayIcon 
                                        sx={{ 
                                            fontSize: 20, 
                                            color: '#ffffff',
                                            mr: 1 
                                        }} 
                                    />
                                ),
                            }}
                            sx={{
                                ...getFieldStyles(field.required, isRequiredAndEmpty, hasError),
                                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                    filter: 'invert(1)',
                                    cursor: 'pointer'
                                }
                            }}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'select':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <FormControl fullWidth size="small" error={hasError}>
                            <InputLabel sx={getFormControlLabelStyles(field.required, hasError)}>
                                {getFieldLabel(field.label, field.required)}
                            </InputLabel>
                            <Select
                                value={currentValue || ''}
                                label={getFieldLabel(field.label, field.required)}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                onFocus={() => onFieldFocus?.(field.key)}
                                onBlur={() => onFieldBlur?.()}
                                sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                            >
                                {!field.required && (
                                    <MenuItem value="">
                                        <em>Select {getFieldLabel(field.label, false)}</em>
                                    </MenuItem>
                                )}
                                {field.options?.map((option: { value: string; label: string }) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {hasError && isFieldFocused && errorMessage && (
                                <FormHelperText>{errorMessage}</FormHelperText>
                            )}
                        </FormControl>
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'checkbox':
                return (
                    <Box key={field.key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                                onClick={() => handleFieldChange(field, !currentValue)}
                                onFocus={() => onFieldFocus?.(field.key)}
                                onBlur={() => onFieldBlur?.()}
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
                            >
                                <Typography variant="body2" sx={{ 
                                    color: hasError ? 'error.main' : 'text.primary' 
                                }}>
                                    {getFieldLabel(field.label, field.required)}
                                </Typography>
                                <Switch
                                    checked={!!currentValue}
                                    onChange={(e) => {
                                        e.stopPropagation(); // Prevent double triggering
                                        handleFieldChange(field, e.target.checked);
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
                            {getIconContainer(field.description)}
                        </Box>
                        {hasError && isFieldFocused && errorMessage && (
                            <Typography variant="caption" sx={{ 
                                color: 'error.main',
                                ml: 1.75,
                                fontSize: '0.75rem'
                            }}>
                                {errorMessage}
                            </Typography>
                        )}
                    </Box>
                );

            case 'integer':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="number"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, parseInt(e.target.value) || 0)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            placeholder={field.placeholder}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            inputProps={{
                                min: field.validation?.min || 0,
                                max: field.validation?.max,
                                step: 1
                            }}
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'email':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="email"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            placeholder={field.placeholder || 'Enter email address'}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'url':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="url"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            placeholder={field.placeholder || 'https://example.com'}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'datetime':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            onFocus={() => onFieldFocus?.(field.key)}
                            onBlur={() => onFieldBlur?.()}
                            error={hasError}
                            helperText={hasError && isFieldFocused ? errorMessage : undefined}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'time':
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            type="time"
                            label={getFieldLabel(field.label, field.required)}
                            value={currentValue}
                            onChange={(e) => handleFieldChange(field, e.target.value)}
                            error={hasError}
                            variant="outlined"
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                        />
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'radio':
                // Convert radio options to dropdown for better UX
                return (
                    <Box key={field.key} sx={{ position: 'relative' }}>
                        <FormControl fullWidth size="small" error={hasError}>
                            <InputLabel sx={getFormControlLabelStyles(field.required, hasError)}>
                                {getFieldLabel(field.label, field.required)}
                            </InputLabel>
                            <Select
                                value={currentValue || ''}
                                label={getFieldLabel(field.label, field.required)}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                sx={getFieldStyles(field.required, isRequiredAndEmpty, hasError)}
                            >
                                {!field.required && (
                                    <MenuItem value="">
                                        <em>Select {getFieldLabel(field.label, false)}</em>
                                    </MenuItem>
                                )}
                                {field.options?.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {getIconContainer(field.description)}
                    </Box>
                );

            case 'object':
                // For object fields, we render a nested structure
                return (
                    <Card sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        p: 2
                    }}>
                        <Typography variant="subtitle2" sx={{ 
                            color: hasError ? 'error.main' : 'text.primary',
                            fontWeight: 600,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            {getFieldLabel(field.label, field.required)}
                            {getDescriptionTooltip(field.description)}
                        </Typography>
                        
                        {/* Render nested object fields if available */}
                        {field.objectFields && field.objectFields.length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {field.objectFields.map((subField) => (
                                    <Box key={subField.key}>
                                        {renderField(subField)}
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Card>
                );

            case 'array':
                const arrayValue = getValueByPath(data, field.key) || [];
                const ensureArray = Array.isArray(arrayValue) ? arrayValue : [];
                
                const addArrayItem = () => {
                    const newItem = field.itemType === 'object' ? {} : '';
                    const newArray = [...ensureArray, newItem];
                    handleFieldChange(field, newArray);
                };
                
                const removeArrayItem = (index: number) => {
                    const newArray = ensureArray.filter((_, i) => i !== index);
                    handleFieldChange(field, newArray);
                };
                
                const updateArrayItem = (index: number, value: any) => {
                    const newArray = [...ensureArray];
                    newArray[index] = value;
                    handleFieldChange(field, newArray);
                };

                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Array Header */}
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            mb: 2,
                            pb: 1,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ 
                                    color: hasError ? 'error.main' : 'text.primary',
                                    fontWeight: 600
                                }}>
                                    {getFieldLabel(field.label, field.required)}
                                </Typography>
                                {getDescriptionTooltip(field.description)}
                            </Box>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addArrayItem}
                                sx={{
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    color: 'primary.main',
                                    border: '1px solid rgba(96, 165, 250, 0.3)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                        borderColor: 'primary.main'
                                    }
                                }}
                            >
                                Add Item
                            </Button>
                        </Box>

                        {/* Array Items */}
                        {ensureArray.length === 0 ? (
                            <Box sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: 2,
                                border: '1px dashed rgba(255, 255, 255, 0.2)'
                            }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    No items added yet. Click "Add Item" to get started.
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {ensureArray.map((item, index) => (
                                    <Card key={index} sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
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
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Typography variant="caption" sx={{ 
                                                            color: 'text.secondary',
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: 1
                                                        }}>
                                                            Item {index + 1}
                                                        </Typography>
                                                    </Box>
                                                    
                                                    {field.itemType === 'object' && field.itemFields ? (
                                                        // Render object fields
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                            {field.itemFields.map((subField: any) => {
                                                                const subFieldValue = item[subField.key] || '';
                                                                return (
                                                                    <TextField
                                                                        key={subField.key}
                                                                        fullWidth
                                                                        size="small"
                                                                        label={getFieldLabel(subField.label, subField.required)}
                                                                        value={subFieldValue}
                                                                        onChange={(e) => {
                                                                            const newItem = { ...item, [subField.key]: e.target.value };
                                                                            updateArrayItem(index, newItem);
                                                                        }}
                                                                        placeholder={subField.placeholder}
                                                                        type={subField.type === 'number' ? 'number' : 'text'}
                                                                        multiline={subField.type === 'textarea'}
                                                                        maxRows={subField.type === 'textarea' ? 3 : 1}
                                                                        sx={{
                                                                            '& .MuiOutlinedInput-root': {
                                                                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                                                '&:hover fieldset': {
                                                                                    borderColor: 'rgba(96, 165, 250, 0.5)',
                                                                                },
                                                                                '&.Mui-focused fieldset': {
                                                                                    borderColor: 'primary.main',
                                                                                },
                                                                            }
                                                                        }}
                                                                    />
                                                                );
                                                            })}
                                                        </Box>
                                                    ) : (
                                                        // Render simple field
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={item}
                                                            onChange={(e) => updateArrayItem(index, e.target.value)}
                                                            placeholder={`${field.label} item`}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                                    '&:hover fieldset': {
                                                                        borderColor: 'rgba(96, 165, 250, 0.5)',
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: 'primary.main',
                                                                    },
                                                                }
                                                            }}
                                                        />
                                                    )}
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
                                ))}
                            </Box>
                        )}

                        {/* Array summary */}
                        <Box sx={{ 
                            mt: 2, 
                            p: 1, 
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {ensureArray.length} item{ensureArray.length !== 1 ? 's' : ''}
                            </Typography>
                            {field.validation?.minItems && ensureArray.length < field.validation.minItems && (
                                <Typography variant="caption" sx={{ color: 'error.main' }}>
                                    Minimum {field.validation.minItems} items required
                                </Typography>
                            )}
                        </Box>
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
                        .replace(/^\s/, '');

                    const groupId = `${node.path}-${depth}`;
                    const isGroupExpanded = expandedGroups[groupId] ?? true; // Default expanded

                    return (
                        <Box key={node.path} sx={{ mb: 2 }}>
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
                const displayName = getSectionDisplayName(sectionName);
                
                return (
                    <Accordion
                        key={sectionName}
                        expanded={expandedPanels[sectionName] || false}
                        onChange={(event, isExpanded) => {
                            setExpandedPanels(prev => ({ ...prev, [sectionName]: isExpanded }));
                        }}
                        ref={(el) => {
                            if (el) accordionRefs.current[sectionName] = el;
                        }}
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
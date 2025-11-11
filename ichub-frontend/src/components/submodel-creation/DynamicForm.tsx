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

import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Tooltip,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
    CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { SchemaDefinition, DPPFormField } from '../../schemas';

interface DynamicFormProps {
    schema: SchemaDefinition;
    data: any;
    onChange: (data: any) => void;
    errors: string[];
}

interface DynamicFormRef {
    scrollToField: (fieldKey: string) => void;
}

const DynamicForm = forwardRef<DynamicFormRef, DynamicFormProps>(({
    schema,
    data,
    onChange,
    errors
}, ref) => {
    const formFields = schema.formFields as DPPFormField[];
    const fieldRefs = useRef<Record<string, any>>({});
    const accordionRefs = useRef<Record<string, any>>({});
    
    // State to control expanded panels
    const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
        'Product Identifier': true
    });

    // Group fields by section
    const groupedFields = formFields.reduce((acc, field) => {
        if (!acc[field.section]) {
            acc[field.section] = [];
        }
        acc[field.section].push(field);
        return acc;
    }, {} as Record<string, DPPFormField[]>);

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

    const handleFieldChange = (field: DPPFormField, value: any) => {
        const newData = setValueByPath(data, field.key, value);
        onChange(newData);
    };

    const renderField = (field: DPPFormField) => {
        const currentValue = getValueByPath(data, field.key) || '';
        const hasError = errors.some(error => error.toLowerCase().includes(field.label.toLowerCase()));

        switch (field.type) {
            case 'text':
                return (
                    <TextField
                        fullWidth
                        label={field.label}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={hasError}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                '&:hover fieldset': {
                                    borderColor: 'rgba(96, 165, 250, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                            }
                        }}
                        InputProps={{
                            endAdornment: field.description ? (
                                <Tooltip title={field.description} placement="top">
                                    <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                </Tooltip>
                            ) : undefined
                        }}
                    />
                );

            case 'textarea':
                return (
                    <TextField
                        fullWidth
                        multiline
                        maxRows={1}
                        label={field.label}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={hasError}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                '&:hover fieldset': {
                                    borderColor: 'rgba(96, 165, 250, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                            }
                        }}
                    />
                );

            case 'number':
                return (
                    <TextField
                        fullWidth
                        type="number"
                        label={field.label}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
                        placeholder={field.placeholder}
                        required={field.required}
                        error={hasError}
                        variant="outlined"
                        size="small"
                        inputProps={{
                            min: field.validation?.min || 0,
                            max: field.validation?.max || undefined,
                            step: "any"
                        }}
                        InputProps={{
                            endAdornment: field.description ? (
                                <Tooltip title={field.description} placement="top">
                                    <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                </Tooltip>
                            ) : undefined
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                '&:hover fieldset': {
                                    borderColor: 'rgba(96, 165, 250, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                            }
                        }}
                    />
                );

            case 'date':
                return (
                    <TextField
                        fullWidth
                        type="date"
                        label={field.label}
                        value={currentValue}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        required={field.required}
                        error={hasError}
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
                            endAdornment: field.description ? (
                                <Tooltip title={field.description} placement="top">
                                    <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                </Tooltip>
                            ) : undefined
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                '&:hover fieldset': {
                                    borderColor: 'rgba(96, 165, 250, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'primary.main',
                                },
                                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                                    filter: 'invert(1)',
                                    cursor: 'pointer'
                                }
                            },
                            '& .MuiInputLabel-root': {
                                color: 'text.secondary',
                            }
                        }}
                    />
                );

            case 'select':
                return (
                    <Box sx={{ position: 'relative' }}>
                        <FormControl fullWidth size="small" error={hasError}>
                            <InputLabel sx={{ color: 'text.secondary' }}>
                                {field.label}
                            </InputLabel>
                            <Select
                                value={currentValue}
                                label={field.label}
                                onChange={(e) => handleFieldChange(field, e.target.value)}
                                sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(96, 165, 250, 0.5)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <MenuItem value="">
                                    <em>Select {field.label}</em>
                                </MenuItem>
                                {field.options?.map((option: { value: string; label: string }) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        {/* Info icon positioned absolutely if description exists */}
                        {field.description && (
                            <Box sx={{ 
                                position: 'absolute', 
                                right: 38, 
                                top: '50%',
                                transform: 'translateY(-50%)', 
                                pointerEvents: 'none',
                                zIndex: 1
                            }}>
                                <Tooltip title={field.description} placement="top">
                                    <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', pointerEvents: 'auto' }} />
                                </Tooltip>
                            </Box>
                        )}
                    </Box>
                );

            case 'checkbox':
                return (
                    <Box 
                        onClick={() => handleFieldChange(field, !currentValue)}
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            width: '100%',
                            py: 1,
                            px: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {field.label}
                            </Typography>
                            {field.description && (
                                <Tooltip title={field.description} placement="top">
                                    <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                </Tooltip>
                            )}
                        </Box>
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
                );

            default:
                return null;
        }
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {sectionFields.map((field: DPPFormField) => (
                                    <Box 
                                        key={field.key} 
                                        ref={(el) => {
                                            if (el) fieldRefs.current[field.key] = el;
                                        }}
                                    >
                                        {renderField(field)}
                                    </Box>
                                ))}
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
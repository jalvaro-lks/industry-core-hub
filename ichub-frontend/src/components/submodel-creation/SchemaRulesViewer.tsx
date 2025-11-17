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

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    Chip,
    Divider,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    CheckCircle as CheckCircleIcon,
    Rule as RuleIcon,
    Info as InfoIcon,
    ChevronRight as ChevronRightIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Place as PlaceIcon
} from '@mui/icons-material';
import { SchemaDefinition } from '../../schemas';
import { FormField } from '../../schemas/json-schema-interpreter';

interface SchemaRulesViewerProps {
    schema: SchemaDefinition;
    onNavigateToField: (fieldKey: string) => void;
    initialSearchTerm?: string;
    onSearchTermChange?: (term: string) => void;
}

interface FieldRule {
    field: FormField;
    rules: {
        type?: string;
        required?: boolean;
        enum?: Array<{ value: any; label: string; description?: string }>;
        pattern?: string;
        minLength?: number;
        maxLength?: number;
        minimum?: number;
        maximum?: number;
        format?: string;
        description?: string;
        dependencies?: string[];
    };
}

const SchemaRulesViewer: React.FC<SchemaRulesViewerProps> = ({ 
    schema, 
    onNavigateToField, 
    initialSearchTerm = '', 
    onSearchTermChange 
}) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'required': true,
        'otherRules': true
    });
    const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
    
    // Update search term when initialSearchTerm changes (from external search)
    React.useEffect(() => {
        if (initialSearchTerm) {
            setSearchTerm(initialSearchTerm);
            // Auto-expand both groups when searching
            setExpandedGroups({
                'required': true,
                'otherRules': true
            });
        }
    }, [initialSearchTerm]);

    // Extract all rules from schema fields
    const extractFieldRules = (): { requiredFields: FieldRule[], otherFields: FieldRule[] } => {
        const requiredFields: FieldRule[] = [];
        const otherFields: FieldRule[] = [];

        schema.formFields?.forEach((field: FormField) => {
            const rules: FieldRule['rules'] = {
                type: field.type,
                required: field.required,
                description: field.description
            };

            // Add validation rules if they exist
            if (field.validation) {
                if (field.validation.min !== undefined) rules.minimum = field.validation.min;
                if (field.validation.max !== undefined) rules.maximum = field.validation.max;
                if (field.validation.pattern) rules.pattern = field.validation.pattern;
            }

            // Add enum options
            if (field.options && field.options.length > 0) {
                rules.enum = field.options;
            }

            const fieldRule: FieldRule = { field, rules };

            if (field.required) {
                requiredFields.push(fieldRule);
            } else {
                otherFields.push(fieldRule);
            }
        });

        return { requiredFields, otherFields };
    };

    const { requiredFields, otherFields } = extractFieldRules();

    // Filter fields based on search term
    const filteredRequiredFields = useMemo(() => {
        if (!searchTerm.trim()) return requiredFields;
        const term = searchTerm.toLowerCase();
        return requiredFields.filter(fieldRule => 
            fieldRule.field.key.toLowerCase().includes(term) ||
            fieldRule.field.label.toLowerCase().includes(term)
        );
    }, [requiredFields, searchTerm]);

    const filteredOtherFields = useMemo(() => {
        if (!searchTerm.trim()) return otherFields;
        const term = searchTerm.toLowerCase();
        return otherFields.filter(fieldRule => 
            fieldRule.field.key.toLowerCase().includes(term) ||
            fieldRule.field.label.toLowerCase().includes(term)
        );
    }, [otherFields, searchTerm]);

    // Group required fields by section
    const groupRequiredFieldsBySection = (fields: FieldRule[]): Record<string, FieldRule[]> => {
        return fields.reduce((acc, fieldRule) => {
            const section = fieldRule.field.section || 'General';
            if (!acc[section]) {
                acc[section] = [];
            }
            acc[section].push(fieldRule);
            return acc;
        }, {} as Record<string, FieldRule[]>);
    };

    const groupedRequiredFields = groupRequiredFieldsBySection(filteredRequiredFields);

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const renderRuleChip = (label: string, value: string | number, color: 'primary' | 'secondary' | 'default' = 'default') => (
        <Chip
            label={`${label}: ${value}`}
            size="small"
            color={color}
            sx={{
                fontSize: '0.7rem',
                height: '22px',
                mr: 0.5,
                mb: 0.5
            }}
        />
    );

    const renderFieldRuleCard = (fieldRule: FieldRule, showRequiredBadge: boolean = false) => {
        const { field, rules } = fieldRule;
        
        return (
            <Card
                key={field.key}
                sx={{
                    backgroundColor: 'rgba(96, 165, 250, 0.05)',
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                }}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ 
                            flexShrink: 0,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: showRequiredBadge ? 'error.main' : 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 0.25
                        }}>
                            {showRequiredBadge ? (
                                <Typography sx={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>!</Typography>
                            ) : (
                                <RuleIcon sx={{ fontSize: 12, color: 'white' }} />
                            )}
                        </Box>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Field name and label */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography 
                                    variant="subtitle2" 
                                    sx={{ 
                                        color: 'primary.main',
                                        fontWeight: 600
                                    }}
                                >
                                    {field.label}
                                </Typography>
                                {showRequiredBadge && (
                                    <Chip
                                        label="Required"
                                        size="small"
                                        color="error"
                                        sx={{
                                            fontSize: '0.65rem',
                                            height: '18px'
                                        }}
                                    />
                                )}
                            </Box>
                            
                            {/* Field path */}
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontFamily: 'monospace',
                                    fontSize: '0.7rem',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    mb: 1
                                }}
                            >
                                {field.key}
                            </Typography>

                            {/* Description */}
                            {rules.description && (
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        fontSize: '0.8rem',
                                        mb: 1.5,
                                        fontStyle: 'italic'
                                    }}
                                >
                                    {rules.description}
                                </Typography>
                            )}

                            {/* Rules chips */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {rules.type && renderRuleChip('Type', rules.type, 'primary')}
                                {rules.format && renderRuleChip('Format', rules.format, 'secondary')}
                                {rules.pattern && renderRuleChip('Pattern', rules.pattern)}
                                {rules.minLength !== undefined && renderRuleChip('Min Length', rules.minLength)}
                                {rules.maxLength !== undefined && renderRuleChip('Max Length', rules.maxLength)}
                                {rules.minimum !== undefined && renderRuleChip('Min', rules.minimum)}
                                {rules.maximum !== undefined && renderRuleChip('Max', rules.maximum)}
                                {rules.enum && (
                                    <Chip
                                        label={`Options: ${rules.enum.slice(0, 3).map(opt => opt.label).join(', ')}${rules.enum.length > 3 ? '...' : ''}`}
                                        size="small"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: '22px',
                                            mr: 0.5,
                                            mb: 0.5
                                        }}
                                    />
                                )}
                            </Box>
                        </Box>
                        
                        {/* Navigation button */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                            <Tooltip title="Go to field in form" placement="left">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigateToField(field.key);
                                    }}
                                    sx={{
                                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                        color: 'primary.main',
                                        '&:hover': {
                                            backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                        }
                                    }}
                                >
                                    <PlaceIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ height: '100%', overflow: 'auto' }}>
            {/* Header Info */}
            <Box sx={{ 
                mb: 3, 
                p: 2, 
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderRadius: 2,
                border: '1px solid rgba(96, 165, 250, 0.2)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <InfoIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Schema Rules Overview
                    </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {schema.metadata.name} - v{schema.metadata.version}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                    Search by field ID or name, then use the button to navigate to the field in the form.
                </Typography>
                
                {/* Search Field */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by field ID (e.g., operation.import.content.id)"
                    value={searchTerm}
                    onChange={(e) => {
                        const newTerm = e.target.value;
                        setSearchTerm(newTerm);
                        onSearchTermChange?.(newTerm);
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSearchTerm('');
                                        onSearchTermChange?.('');
                                    }}
                                    sx={{ padding: 0.5 }}
                                >
                                    <ClearIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                            '&.Mui-focused': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }
                        }
                    }}
                />
            </Box>

            {/* Group 1: Required Fields by Section */}
            <Accordion
                expanded={expandedGroups['required'] || false}
                onChange={() => toggleGroup('required')}
                sx={{
                    mb: 2,
                    backgroundColor: 'rgba(244, 67, 54, 0.03)',
                    border: '1px solid rgba(244, 67, 54, 0.15)',
                    '&:before': {
                        display: 'none',
                    },
                    '& .MuiAccordionSummary-root': {
                        backgroundColor: 'rgba(244, 67, 54, 0.08)',
                        borderBottom: expandedGroups['required'] ? '1px solid rgba(244, 67, 54, 0.2)' : 'none',
                    }
                }}
            >
                <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'error.main' }} />}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <CheckCircleIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            color: 'error.main'
                        }}>
                            Required Attributes
                        </Typography>
                        <Chip
                            label={searchTerm ? `${filteredRequiredFields.length} / ${requiredFields.length}` : `${requiredFields.length} field${requiredFields.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                color: 'error.main',
                                ml: 'auto'
                            }}
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, pt: 1 }}>
                    {Object.entries(groupedRequiredFields).map(([sectionName, sectionFields]) => (
                        <Box key={sectionName} sx={{ mb: 3 }}>
                            <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    mb: 1.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Box sx={{ 
                                    width: 4, 
                                    height: 16, 
                                    backgroundColor: 'error.main',
                                    borderRadius: 1
                                }} />
                                {sectionName}
                                <Chip
                                    label={sectionFields.length}
                                    size="small"
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: '16px',
                                        minWidth: '16px',
                                        ml: 0.5
                                    }}
                                />
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {sectionFields.map(fieldRule => renderFieldRuleCard(fieldRule, true))}
                            </Box>
                        </Box>
                    ))}
                </AccordionDetails>
            </Accordion>

            {/* Group 2: Other Rules */}
            <Accordion
                expanded={expandedGroups['otherRules'] || false}
                onChange={() => toggleGroup('otherRules')}
                sx={{
                    mb: 2,
                    backgroundColor: 'rgba(96, 165, 250, 0.03)',
                    border: '1px solid rgba(96, 165, 250, 0.15)',
                    '&:before': {
                        display: 'none',
                    },
                    '& .MuiAccordionSummary-root': {
                        backgroundColor: 'rgba(96, 165, 250, 0.08)',
                        borderBottom: expandedGroups['otherRules'] ? '1px solid rgba(96, 165, 250, 0.2)' : 'none',
                    }
                }}
            >
                <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <RuleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            color: 'primary.main'
                        }}>
                            Other Field Rules
                        </Typography>
                        <Chip
                            label={searchTerm ? `${filteredOtherFields.length} / ${otherFields.length}` : `${otherFields.length} field${otherFields.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                color: 'primary.main',
                                ml: 'auto'
                            }}
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {filteredOtherFields.map(fieldRule => renderFieldRuleCard(fieldRule, false))}
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Summary */}
            <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {searchTerm ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                        Showing: <strong>{filteredRequiredFields.length + filteredOtherFields.length}</strong> of <strong>{requiredFields.length + otherFields.length}</strong> fields
                        {' '}(<strong>{filteredRequiredFields.length}</strong> required, <strong>{filteredOtherFields.length}</strong> optional)
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                        Total: <strong>{requiredFields.length + otherFields.length}</strong> fields 
                        (<strong>{requiredFields.length}</strong> required, <strong>{otherFields.length}</strong> optional)
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default SchemaRulesViewer;

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

import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Grid2,
    Container,
    createTheme,
    ThemeProvider,
    alpha,
    AppBar,
    Toolbar,
    Paper,
    Divider,
    Button,
    Card,
    CardContent,
    Tooltip,
    Chip,
    Badge,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon,
    Schema as SchemaIcon,
    Preview as PreviewIcon,
    Save as SaveIcon,
    Code as CodeIcon,
    AccountTree as AccountTreeIcon,
    Fingerprint as FingerprintIcon,
    Inventory as InventoryIcon,
    Error as ErrorIcon,
    ViewModule as ViewModuleIcon,
    DataObject as DataObjectIcon,
    Warning as WarningIcon,
    ChevronRight as ChevronRightIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { getAvailableSchemas, SchemaDefinition } from '../../schemas';
import SchemaSelector from './SchemaSelector';
import DynamicForm, { DynamicFormRef } from './DynamicForm';
import JsonPreview from './JsonPreview';
import JsonViewer from '../general/JsonViewer';

interface SubmodelCreatorProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    onCreateSubmodel: (submodelData: any) => Promise<void>;
    selectedSchema: SchemaDefinition | null;
    schemaKey: string;
    manufacturerPartId?: string;
    twinId?: string;
    dtrAasId?: string;
    loading?: boolean;
}

// Dark theme matching the application style
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#60a5fa',
        },
        secondary: {
            main: '#f48fb1',
        },
        background: {
            default: '#121212',
            paper: 'rgba(0, 0, 0, 0.4)',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
        },
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#121212',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                },
            },
        },
    },
});

const SubmodelCreator: React.FC<SubmodelCreatorProps> = ({
    open,
    onClose,
    onBack,
    onCreateSubmodel,
    selectedSchema,
    schemaKey,
    manufacturerPartId,
    twinId,
    dtrAasId,
    loading = false
}) => {
    const [formData, setFormData] = useState<any>({});
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState<'json' | 'errors'>('json');
    const formRef = useRef<DynamicFormRef>(null);

    // Function to handle clipboard copy
    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            console.log(`${fieldName} copied to clipboard`);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    // Schema-aware error parsing interface
    interface ParsedError {
        message: string;
        fieldKey?: string;
        fieldLabel?: string;
        fieldPath?: string;
        section?: string;
        severity: 'error' | 'warning' | 'info';
        context?: string;
        arrayIndex?: number;
    }

    // ErrorViewer component - Schema-aware version with grouped errors
    const ErrorViewer: React.FC<{ 
        errors: string[], 
        onNavigateToField: (fieldKey: string) => void 
    }> = ({ errors, onNavigateToField }) => {
        
        // State for controlling which error groups are expanded
        const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

        // Schema-aware error parsing function
        const parseValidationError = (error: string): ParsedError => {
            // Extract field information using schema structure
            const findFieldInSchema = (fieldName: string): { key: string, label: string, path: string, section: string } | null => {
                if (!selectedSchema?.formFields) return null;
                
                // Look for exact match first
                const exactMatch = selectedSchema.formFields.find(field => 
                    field.key === fieldName || 
                    field.label === fieldName ||
                    field.key.endsWith(`.${fieldName}`)
                );
                
                if (exactMatch) {
                    return {
                        key: exactMatch.key,
                        label: exactMatch.label,
                        path: exactMatch.key,
                        section: exactMatch.section || 'General'
                    };
                }
                
                // Look for partial matches in nested fields
                const partialMatch = selectedSchema.formFields.find(field => 
                    field.key.toLowerCase().includes(fieldName.toLowerCase()) ||
                    field.label.toLowerCase().includes(fieldName.toLowerCase())
                );
                
                if (partialMatch) {
                    return {
                        key: partialMatch.key,
                        label: partialMatch.label,
                        path: partialMatch.key,
                        section: partialMatch.section || 'General'
                    };
                }
                
                return null;
            };
            
            // Extract field name from error message with multiple patterns
            let fieldName: string | null = null;
            let fieldInfo: { key: string, label: string, path: string, section: string } | null = null;
            let arrayIndex: number | undefined = undefined;
            
            // Try different patterns to extract field name
            const patterns = [
                // Array patterns
                /(\w+)\[(\d+)\]\.(\w+)\s+is required/i,  // field[0].subfield is required
                /(\w+)\[(\d+)\]\s+is required/i,        // field[0] is required
                // Nested field patterns
                /(\w+)\.(\w+)\.(\w+)\s+is required/i,   // group.subgroup.field is required
                /(\w+)\.(\w+)\s+is required/i,          // group.field is required
                // Simple patterns
                /(\w+)\s+is required/i,                 // field is required
                /(\w+)\s+field is required/i,           // field field is required
                /(\w+)\s+must be/i,                     // field must be
                /(\w+)\s+format is invalid/i,           // field format is invalid
                // Quoted patterns
                /'([^']+)'\s+is required/i,             // 'field' is required
                /"([^"]+)"\s+is required/i,             // "field" is required
                // Property patterns
                /field\s+'([^']+)'/i,                   // field 'name'
                /property\s+'([^']+)'/i,                // property 'name'
            ];
            
            for (const pattern of patterns) {
                const match = error.match(pattern);
                if (match) {
                    if (pattern.source.includes('\\[(\\d+)\\]')) {
                        // Array field match
                        fieldName = match[1];
                        arrayIndex = parseInt(match[2]);
                        if (match[3]) {
                            fieldName = `${match[1]}.${match[3]}`;
                        }
                    } else if (match[3]) {
                        // Triple nested match
                        fieldName = `${match[1]}.${match[2]}.${match[3]}`;
                    } else if (match[2]) {
                        // Double nested match
                        fieldName = `${match[1]}.${match[2]}`;
                    } else {
                        // Simple field match
                        fieldName = match[1];
                    }
                    
                    fieldInfo = findFieldInSchema(fieldName);
                    if (fieldInfo) break;
                    
                    // If no direct match, try simpler versions
                    if (!fieldInfo && fieldName.includes('.')) {
                        const simpleName = fieldName.split('.').pop();
                        if (simpleName) {
                            fieldInfo = findFieldInSchema(simpleName);
                            if (fieldInfo) {
                                fieldName = simpleName;
                                break;
                            }
                        }
                    }
                }
            }
            
            // If no field found, try to extract from the end of the message
            if (!fieldInfo && error.includes('required')) {
                const words = error.split(' ');
                for (let i = words.length - 1; i >= 0; i--) {
                    const word = words[i].replace(/['"]/g, '');
                    fieldInfo = findFieldInSchema(word);
                    if (fieldInfo) {
                        fieldName = word;
                        break;
                    }
                }
            }
            
            // Create more specific error messages based on schema context
            let specificMessage = error;
            let context = '';
            
            if (fieldInfo) {
                const pathParts = fieldInfo.path.split('.');
                if (pathParts.length > 1) {
                    context = pathParts.slice(0, -1).join(' → ');
                    
                    // Create more user-friendly messages
                    if (error.includes('is required')) {
                        specificMessage = `${fieldInfo.label} is required`;
                        if (arrayIndex !== undefined) {
                            specificMessage += ` (item ${arrayIndex + 1})`;
                        }
                    } else if (error.includes('format is invalid')) {
                        specificMessage = `${fieldInfo.label} has an invalid format`;
                    } else if (error.includes('must be')) {
                        specificMessage = error.replace(fieldName || '', fieldInfo.label);
                    }
                }
            }
            
            return {
                message: specificMessage,
                fieldKey: fieldInfo?.key,
                fieldLabel: fieldInfo?.label,
                fieldPath: fieldInfo?.path,
                section: fieldInfo?.section || 'General',
                severity: 'error',
                context,
                arrayIndex
            };
        };

        const parsedErrors = errors.map(parseValidationError);

        // Group errors by section
        const groupedErrors = parsedErrors.reduce((acc, error) => {
            const section = error.section || 'General';
            if (!acc[section]) {
                acc[section] = [];
            }
            acc[section].push(error);
            return acc;
        }, {} as Record<string, ParsedError[]>);

        // Get section display name
        const getSectionDisplayName = (sectionName: string): string => {
            const sectionNames: Record<string, string> = {
                'Metadata': 'Metadata',
                'Identification': 'Identification',
                'Operation': 'Operation',
                'Characteristics': 'Product Characteristics',
                'Commercial': 'Commercial Information',
                'Materials': 'Materials',
                'Sustainability': 'Sustainability',
                'General': 'General'
            };
            return sectionNames[sectionName] || sectionName.replace(/([A-Z])/g, ' $1').trim();
        };

        // Toggle group expansion
        const toggleGroup = (sectionName: string) => {
            setExpandedGroups(prev => ({
                ...prev,
                [sectionName]: !prev[sectionName]
            }));
        };

        if (parsedErrors.length === 0) {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    p: 4
                }}>
                    <Box sx={{ 
                        fontSize: 64, 
                        mb: 2,
                        opacity: 0.5
                    }}>
                        ✅
                    </Box>
                    <Typography variant="h6" sx={{ color: 'success.main', mb: 1, fontWeight: 600 }}>
                        No Validation Errors
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Your submodel data is valid and ready to submit
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ height: '100%', overflow: 'auto' }}>
                {/* Grouped Errors */}
                {Object.entries(groupedErrors).map(([sectionName, sectionErrors]) => {
                    const isExpanded = expandedGroups[sectionName] ?? false; // Default collapsed
                    const displayName = getSectionDisplayName(sectionName);
                    
                    return (
                        <Accordion
                            key={sectionName}
                            expanded={isExpanded}
                            onChange={() => toggleGroup(sectionName)}
                            sx={{
                                mb: 2,
                                backgroundColor: 'rgba(244, 67, 54, 0.03)',
                                border: '1px solid rgba(244, 67, 54, 0.15)',
                                '&:before': {
                                    display: 'none',
                                },
                                '& .MuiAccordionSummary-root': {
                                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                    borderBottom: isExpanded ? '1px solid rgba(244, 67, 54, 0.2)' : 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(244, 67, 54, 0.12)',
                                    }
                                }
                            }}
                        >
                            <AccordionSummary 
                                expandIcon={<ExpandMoreIcon sx={{ color: 'error.main' }} />}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                    <Typography variant="subtitle1" sx={{ 
                                        fontWeight: 600,
                                        color: 'error.main'
                                    }}>
                                        {displayName}
                                    </Typography>
                                    <Chip
                                        label={`${sectionErrors.length} error${sectionErrors.length !== 1 ? 's' : ''}`}
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
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {sectionErrors.map((parsedError, index) => (
                                        <Card key={index} sx={{
                                            backgroundColor: 'rgba(244, 67, 54, 0.05)',
                                            border: '1px solid rgba(244, 67, 54, 0.2)',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            cursor: parsedError.fieldKey ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease',
                                            ...(parsedError.fieldKey && {
                                                '&:hover': {
                                                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                                    borderColor: 'rgba(244, 67, 54, 0.3)',
                                                    transform: 'translateX(4px)',
                                                    boxShadow: '0 2px 6px rgba(244, 67, 54, 0.15)'
                                                }
                                            })
                                        }} onClick={() => parsedError.fieldKey && onNavigateToField(parsedError.fieldKey)}>
                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ 
                                                        flexShrink: 0,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        backgroundColor: 'error.main',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mt: 0.25
                                                    }}>
                                                        <WarningIcon sx={{ fontSize: 12, color: 'white' }} />
                                                    </Box>
                                                    
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        {/* Error message */}
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                color: 'error.main',
                                                                lineHeight: 1.4,
                                                                fontWeight: 500,
                                                                mb: 1
                                                            }}
                                                        >
                                                            {parsedError.message}
                                                        </Typography>
                                                        
                                                        {/* Field path */}
                                                        {parsedError.fieldPath && (
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
                                                                    mt: 0.5
                                                                }}
                                                            >
                                                                {parsedError.fieldPath}
                                                                {parsedError.arrayIndex !== undefined && ` [${parsedError.arrayIndex}]`}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    
                                                    {/* Navigation indicator */}
                                                    {parsedError.fieldKey && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                                            <Typography 
                                                                variant="caption" 
                                                                sx={{ 
                                                                    color: 'primary.main',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                Go to field
                                                            </Typography>
                                                            <ChevronRightIcon 
                                                                sx={{ 
                                                                    color: 'primary.main', 
                                                                    fontSize: 14
                                                                }} 
                                                            />
                                                        </Box>
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
                
                {/* Overall Summary */}
                <Box sx={{ 
                    mt: 3, 
                    p: 2, 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1 }}>
                        <strong>{parsedErrors.length}</strong> validation issue{parsedErrors.length !== 1 ? 's' : ''} found across <strong>{Object.keys(groupedErrors).length}</strong> section{Object.keys(groupedErrors).length !== 1 ? 's' : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block' }}>
                        Click on any error to navigate to the corresponding field. Expand sections to view details.
                    </Typography>
                </Box>
            </Box>
        );
    };

    // Initialize form data with default values when schema changes
    useEffect(() => {
        if (selectedSchema && open) {
            const defaultData = selectedSchema.createDefault(manufacturerPartId);
            setFormData(defaultData);
            
            // 🧪 Debug: Log schema structure for verification (development mode)
            console.log('🔍 DPP Schema Analysis:');
            console.log('Total Form Fields:', selectedSchema.formFields?.length || 0);
            console.log('Form Fields Structure:');
            
            // Group fields by section to see structure
            const fieldsBySection = selectedSchema.formFields?.reduce((acc: any, field: any) => {
                if (!acc[field.section]) acc[field.section] = [];
                acc[field.section].push({
                    key: field.key,
                    label: field.label,
                    type: field.type,
                    required: field.required
                });
                return acc;
            }, {}) || {};
            
            Object.entries(fieldsBySection).forEach(([section, fields]: [string, any]) => {
                console.log(`📁 ${section} (${fields.length} fields):`);
                fields.forEach((field: any) => {
                    const requiredMark = field.required ? '🔴' : '🔵';
                    const nestedMark = field.key.includes('.') ? '└─' : '├─';
                    console.log(`  ${nestedMark} ${requiredMark} ${field.key} (${field.type}): ${field.label}`);
                });
            });
            
            console.log('📊 Schema Validation Test Results:');
            
            // Immediately validate the default data
            if (selectedSchema.validate) {
                const validation = selectedSchema.validate(defaultData);
                setValidationErrors(validation.errors);
                
                // 🧪 Test schema validation with specific DPP data
                // Test invalid BPNL
                const testInvalidBPNL = {
                    metadata: {
                        version: "1.0",
                        economicOperatorId: "INVALID_BPNL", // ❌ Should fail BpnlTrait pattern
                        passportIdentifier: "550e8400-e29b-41d4-a716-446655440000",
                        predecessor: "550e8400-e29b-41d4-a716-446655440001",
                        backupReference: "backup-ref",
                        language: "en",
                        issueDate: "2025-01-01",
                        expirationDate: "2025-12-31"
                    }
                };
                
                const bpnlTest = selectedSchema.validate(testInvalidBPNL);
                console.log('❌ BPNL Pattern Test:', bpnlTest.isValid ? 'FAILED - Should be invalid' : 'PASSED - Correctly detected invalid BPNL');
                if (!bpnlTest.isValid) {
                    console.log('   Errors:', bpnlTest.errors);
                }
                
                // Test invalid UUID
                const testInvalidUUID = {
                    metadata: {
                        version: "1.0",
                        economicOperatorId: "BPNLABCDEF123456",
                        passportIdentifier: "not-a-valid-uuid", // ❌ Should fail UuidV4Trait pattern
                        predecessor: "also-not-uuid",
                        backupReference: "backup-ref",
                        language: "en",
                        issueDate: "2025-01-01",
                        expirationDate: "2025-12-31"
                    }
                };
                
                const uuidTest = selectedSchema.validate(testInvalidUUID);
                console.log('❌ UUID Pattern Test:', uuidTest.isValid ? 'FAILED - Should be invalid' : 'PASSED - Correctly detected invalid UUID');
                if (!uuidTest.isValid) {
                    console.log('   Errors:', uuidTest.errors);
                }
                
                // Test valid data
                const testValidData = {
                    metadata: {
                        version: "1.0",
                        economicOperatorId: "BPNLABCDEF123456", // ✅ Valid BPNL
                        passportIdentifier: "550e8400-e29b-41d4-a716-446655440000", // ✅ Valid UUID
                        predecessor: "550e8400-e29b-41d4-a716-446655440001", // ✅ Valid UUID
                        backupReference: "backup-ref",
                        language: "en",
                        issueDate: "2025-01-01", // ✅ Valid date
                        expirationDate: "2025-12-31" // ✅ Valid date
                    }
                };
                
                const validTest = selectedSchema.validate(testValidData);
                console.log('✅ Valid Data Test:', validTest.isValid ? 'PASSED - Correctly accepted valid data' : 'FAILED - Should be valid');
                if (!validTest.isValid) {
                    console.log('   Errors:', validTest.errors);
                }
            } else {
                setValidationErrors([]);
            }
        }
    }, [selectedSchema, manufacturerPartId, open]);

    const handleFormChange = (newData: any) => {
        setFormData(newData);
        
        // Validate the form data
        if (selectedSchema?.validate) {
            const validation = selectedSchema.validate(newData);
            setValidationErrors(validation.errors);
        }
    };

    const handleSubmit = async () => {
        if (!selectedSchema || validationErrors.length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreateSubmodel(formData);
        } catch (error) {
            console.error('Error creating submodel:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNavigateToField = (fieldKey: string) => {
        if (formRef.current) {
            formRef.current.scrollToField(fieldKey);
        }
    };

    const isFormValid = validationErrors.length === 0 && Object.keys(formData).length > 0;

    return (
        <ThemeProvider theme={darkTheme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullScreen
                PaperProps={{
                    sx: {
                        backgroundColor: 'background.paper',
                    }
                }}
            >
                {/* Custom App Bar */}
                <AppBar position="relative" elevation={0} sx={{ backgroundColor: '#1e1e1e' }}>
                    <Toolbar sx={{ px: 3 }}>
                        <IconButton 
                            onClick={onBack}
                            color="inherit"
                            sx={{ 
                                mr: 2,
                                p: 1,
                                '&:hover': {
                                    backgroundColor: alpha('#ffffff', 0.1)
                                }
                            }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Create New Submodel - {selectedSchema?.metadata.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    {twinId ? `For Twin: ${twinId}` : 'Creating new submodel'}
                                    {selectedSchema && ` • SemanticID: ${selectedSchema.metadata.semanticId}`}
                                </Typography>
                            </Box>
                        </Box>                        <IconButton 
                            onClick={onClose} 
                            color="inherit"
                            sx={{ 
                                p: 1.5,
                                '&:hover': {
                                    backgroundColor: alpha('#ffffff', 0.1)
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>

                <DialogContent sx={{ 
                    p: 0,
                    backgroundColor: '#121212',
                    height: 'calc(100vh - 140px)',
                    overflow: 'auto'
                }}>
                    <Container maxWidth={false} sx={{ minHeight: '100%', p: 3, display: 'flex', flexDirection: 'column' }}>
                        {/* Header Section - Manufacturer Part ID */}
                        <Paper sx={{ 
                            p: 3, 
                            mb: 3, 
                            backgroundColor: 'rgba(96, 165, 250, 0.1)',
                            border: '1px solid rgba(96, 165, 250, 0.2)',
                            flexShrink: 0
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                    <SchemaIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600, mb: 2 }}>
                                            Target Product
                                        </Typography>
                                        
                                        {/* All IDs as self-contained chips */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1 }}>
                                            {/* Manufacturer Part ID */}
                                            <Tooltip title="Click to copy Manufacturer Part ID">
                                                <Chip
                                                    icon={<InventoryIcon />}
                                                    label={`Manufacturer Part ID: ${manufacturerPartId}`}
                                                    variant="outlined"
                                                    size="medium"
                                                    clickable
                                                    onClick={() => handleCopy(manufacturerPartId || '', 'Manufacturer Part ID')}
                                                    sx={{
                                                        height: '36px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                                        color: '#ffffff',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                            borderColor: 'rgba(255, 255, 255, 0.5)'
                                                        },
                                                        '& .MuiChip-icon': {
                                                            color: '#ffffff'
                                                        },
                                                        '& .MuiChip-label': {
                                                            color: '#ffffff !important',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            px: 1
                                                        }
                                                    }}
                                                />
                                            </Tooltip>

                                            {/* Twin ID */}
                                            {twinId && (
                                                <Tooltip title="Click to copy Twin ID (Global Asset ID)">
                                                    <Chip
                                                        icon={<AccountTreeIcon />}
                                                        label={`Twin ID: ${twinId.startsWith('urn:uuid:') ? twinId : `urn:uuid:${twinId}`}`}
                                                        variant="outlined"
                                                        size="medium"
                                                        clickable
                                                        onClick={() => handleCopy(twinId.startsWith('urn:uuid:') ? twinId : `urn:uuid:${twinId}`, 'Twin ID')}
                                                        sx={{
                                                            height: '36px',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                                            color: '#ffffff',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                borderColor: 'rgba(255, 255, 255, 0.5)'
                                                            },
                                                            '& .MuiChip-icon': {
                                                                color: '#ffffff'
                                                            },
                                                            '& .MuiChip-label': {
                                                                color: '#ffffff !important',
                                                                fontSize: '14px',
                                                                fontWeight: 500,
                                                                px: 1
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}

                                            {/* AAS ID */}
                                            {dtrAasId && (
                                                <Tooltip title="Click to copy AAS ID">
                                                    <Chip
                                                        icon={<FingerprintIcon />}
                                                        label={`AAS ID: ${dtrAasId.startsWith('urn:uuid:') ? dtrAasId : `urn:uuid:${dtrAasId}`}`}
                                                        variant="outlined"
                                                        size="medium"
                                                        clickable
                                                        onClick={() => handleCopy(dtrAasId.startsWith('urn:uuid:') ? dtrAasId : `urn:uuid:${dtrAasId}`, 'AAS ID')}
                                                        sx={{
                                                            height: '36px',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                                            color: '#ffffff',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                borderColor: 'rgba(255, 255, 255, 0.5)'
                                                            },
                                                            '& .MuiChip-icon': {
                                                                color: '#ffffff'
                                                            },
                                                            '& .MuiChip-label': {
                                                                color: '#ffffff !important',
                                                                fontSize: '14px',
                                                                fontWeight: 500,
                                                                px: 1
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}

                                            {/* Fallback message when no twin */}
                                            {(!twinId && !dtrAasId) && (
                                                <Chip 
                                                    label="Twin Status: Not yet created" 
                                                    variant="outlined" 
                                                    size="medium" 
                                                    sx={{ 
                                                        height: '36px',
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                                        '& .MuiChip-label': {
                                                            fontSize: '14px',
                                                            px: 2
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Main Content - Two Panel Layout */}
                        <Box sx={{ flex: 1, display: 'flex', gap: 3, minHeight: '600px' }}>
                            {/* Left Panel - Form */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Card sx={{ 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                                }}>
                                    <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Form Header */}
                                        <Box sx={{ 
                                            p: 3, 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2
                                        }}>
                                            <SchemaIcon sx={{ color: 'primary.main' }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    Submodel Configuration
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Fill in the details for your {selectedSchema?.metadata.name} submodel
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Form Content */}
                                        <Box sx={{ 
                                            flex: 1, 
                                            overflow: 'auto', 
                                            p: 3,
                                            // Custom scrollbar styling
                                            '&::-webkit-scrollbar': {
                                                width: '8px',
                                            },
                                            '&::-webkit-scrollbar-track': {
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '4px',
                                            },
                                            '&::-webkit-scrollbar-thumb': {
                                                background: 'rgba(96, 165, 250, 0.6)',
                                                borderRadius: '4px',
                                                '&:hover': {
                                                    background: 'rgba(96, 165, 250, 0.8)',
                                                }
                                            },
                                            '&::-webkit-scrollbar-thumb:active': {
                                                background: 'rgba(96, 165, 250, 1)',
                                            }
                                        }}>
                                            {selectedSchema && (
                                                <DynamicForm
                                                    ref={formRef}
                                                    schema={selectedSchema}
                                                    data={formData}
                                                    onChange={handleFormChange}
                                                    errors={validationErrors}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Right Panel - JSON Preview */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Card sx={{ 
                                    flex: 1, 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                                }}>
                                    <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Preview Header */}
                                        <Box sx={{ 
                                            p: 3, 
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            {/* Left side - Title and description */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                {viewMode === 'json' ? (
                                                    <DataObjectIcon sx={{ color: 'primary.main' }} />
                                                ) : (
                                                    <Badge 
                                                        badgeContent={validationErrors.length} 
                                                        color="error"
                                                        sx={{ 
                                                            '& .MuiBadge-badge': { 
                                                                fontSize: '0.75rem',
                                                                minWidth: '20px',
                                                                height: '20px'
                                                            } 
                                                        }}
                                                    >
                                                        <ErrorIcon sx={{ color: 'error.main' }} />
                                                    </Badge>
                                                )}
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {viewMode === 'json' ? 'JSON Preview' : 'Validation Errors'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {viewMode === 'json' 
                                                            ? 'Real-time preview of your submodel data'
                                                            : `${validationErrors.length} validation issue${validationErrors.length !== 1 ? 's' : ''} found`
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Right side - Toggle buttons */}
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant={viewMode === 'json' ? 'contained' : 'outlined'}
                                                    size="small"
                                                    startIcon={<DataObjectIcon />}
                                                    onClick={() => setViewMode('json')}
                                                    sx={{
                                                        minWidth: '80px',
                                                        textTransform: 'none',
                                                        fontSize: '0.875rem',
                                                        ...(viewMode === 'json' && {
                                                            backgroundColor: 'primary.main',
                                                            '&:hover': {
                                                                backgroundColor: 'primary.dark'
                                                            }
                                                        })
                                                    }}
                                                >
                                                    JSON
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'errors' ? 'contained' : 'outlined'}
                                                    size="small"
                                                    startIcon={
                                                        <Badge 
                                                            badgeContent={validationErrors.length} 
                                                            color="error"
                                                            sx={{ 
                                                                '& .MuiBadge-badge': { 
                                                                    fontSize: '0.65rem',
                                                                    minWidth: '16px',
                                                                    height: '16px'
                                                                } 
                                                            }}
                                                        >
                                                            <ErrorIcon />
                                                        </Badge>
                                                    }
                                                    onClick={() => setViewMode('errors')}
                                                    sx={{
                                                        minWidth: '100px',
                                                        textTransform: 'none',
                                                        fontSize: '0.875rem',
                                                        ...(viewMode === 'errors' && {
                                                            backgroundColor: 'error.main',
                                                            color: 'white',
                                                            '&:hover': {
                                                                backgroundColor: 'error.dark'
                                                            }
                                                        })
                                                    }}
                                                >
                                                    Errors
                                                </Button>
                                            </Box>
                                        </Box>

                                        {/* Preview Content */}
                                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                                            {viewMode === 'json' ? (
                                                <JsonViewer data={formData} />
                                            ) : (
                                                <ErrorViewer 
                                                    errors={validationErrors}
                                                    onNavigateToField={handleNavigateToField}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Box>

                        {/* Footer Actions */}
                        <Box sx={{ 
                            mt: 3, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 3,
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 2,
                            border: '1px solid rgba(255, 255, 255, 0.12)'
                        }}>
                            <Box>
                                {validationErrors.length === 0 && Object.keys(formData).length > 0 && (
                                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                                        Form is valid and ready to submit
                                    </Typography>
                                )}
                            </Box>
                            
                            <Tooltip 
                                title={
                                    !isFormValid && !isSubmitting
                                        ? `Please fix ${validationErrors.length} validation error${validationErrors.length !== 1 ? 's' : ''} before creating the submodel`
                                        : isSubmitting
                                        ? 'Creating submodel...'
                                        : 'Create submodel with current data'
                                }
                                placement="top"
                            >
                                <span>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || isSubmitting}
                                        sx={{
                                            background: isFormValid && !isSubmitting 
                                                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                                : 'rgba(100, 100, 100, 0.3)',
                                            borderRadius: '10px',
                                            textTransform: 'none',
                                            color: '#ffffff',
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            boxShadow: isFormValid && !isSubmitting 
                                                ? '0 4px 16px rgba(34, 197, 94, 0.3)'
                                                : 'none',
                                            '&:hover': {
                                                background: isFormValid && !isSubmitting 
                                                    ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                                                    : 'rgba(100, 100, 100, 0.3)',
                                                transform: isFormValid && !isSubmitting ? 'translateY(-1px)' : 'none',
                                                boxShadow: isFormValid && !isSubmitting 
                                                    ? '0 6px 20px rgba(34, 197, 94, 0.4)'
                                                    : 'none',
                                            },
                                            '&:disabled': {
                                                backgroundColor: 'rgba(100, 100, 100, 0.3)',
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                cursor: 'not-allowed',
                                            },
                                            transition: 'all 0.2s ease-in-out',
                                        }}
                                    >
                                        {isSubmitting ? 'Creating Submodel...' : 'Create Submodel'}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Box>
                    </Container>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
};

export default SubmodelCreator;
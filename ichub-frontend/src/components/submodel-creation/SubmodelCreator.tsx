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
    Chip
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
    Inventory as InventoryIcon
} from '@mui/icons-material';
import { getAvailableSchemas, SchemaDefinition } from '../../schemas';
import SchemaSelector from './SchemaSelector';
import DynamicForm, { DynamicFormRef } from './DynamicForm';
import JsonPreview from './JsonPreview';

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

    // Initialize form data with default values when schema changes
    useEffect(() => {
        if (selectedSchema && open) {
            const defaultData = selectedSchema.createDefault(manufacturerPartId);
            setFormData(defaultData);
            
            // Immediately validate the default data
            if (selectedSchema.validate) {
                const validation = selectedSchema.validate(defaultData);
                setValidationErrors(validation.errors);
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
                                            gap: 2
                                        }}>
                                            <PreviewIcon sx={{ color: 'secondary.main' }} />
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    JSON Preview
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                    Real-time preview of your submodel data
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Preview Content */}
                                        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                                            <JsonPreview 
                                                data={formData}
                                                errors={validationErrors}
                                                onNavigateToField={handleNavigateToField}
                                            />
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
                                {validationErrors.length > 0 && (
                                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                                        {validationErrors.length} validation error{validationErrors.length !== 1 ? 's' : ''} found
                                    </Typography>
                                )}
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
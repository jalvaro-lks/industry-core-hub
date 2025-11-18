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
    Dialog,
    DialogContent,
    Box,
    Typography,
    IconButton,
    Card,
    CardContent,
    CardActionArea,
    Grid2,
    Container,
    createTheme,
    ThemeProvider,
    alpha,
    Chip,
    AppBar,
    Toolbar,
    Tooltip,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Close as CloseIcon,
    Schema as SchemaIcon,
    Add as AddIcon,
    AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { getAvailableSchemas, SchemaDefinition, SCHEMA_REGISTRY } from '../../schemas';
import { parseSemanticId } from '../../utils/semantics';

interface SchemaSelectorProps {
    open: boolean;
    onClose: () => void;
    onSchemaSelect: (schemaKey: string, schema: SchemaDefinition) => void;
    manufacturerPartId?: string;
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
    },
});

const SchemaSelector: React.FC<SchemaSelectorProps> = ({
    open,
    onClose,
    onSchemaSelect,
    manufacturerPartId
}) => {
    const availableSchemas = getAvailableSchemas();
    const [copySuccess, setCopySuccess] = useState(false);
    const [copiedValue, setCopiedValue] = useState<string | null>(null);

    const handleCopy = async (value: string, event: React.MouseEvent) => {
        event.stopPropagation(); // Prevenir que se active el click de la card
        try {
            await navigator.clipboard.writeText(value);
            setCopiedValue(value);
            setCopySuccess(true);
        } catch (error) {
            console.error('Failed to copy value:', error);
        }
    };

    const handleSchemaSelect = (schemaKey: string, schema: SchemaDefinition) => {
        onSchemaSelect(schemaKey, schema);
    };

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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <AccountTreeIcon sx={{ fontSize: 28 }} />
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Select Schema for New Submodel
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                    {manufacturerPartId ? `Creating submodel for: ${manufacturerPartId}` : 'Choose a schema template to create your submodel'}
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton 
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
                    <Container maxWidth="xl" sx={{ py: 4, px: 3, height: '100%' }}>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" sx={{ 
                                color: 'text.primary', 
                                mb: 2,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <SchemaIcon sx={{ color: 'primary.main' }} />
                                Available Schema Templates
                            </Typography>
                            <Typography variant="body1" sx={{ 
                                color: 'text.secondary',
                                mb: 3
                            }}>
                                Select a schema template to begin creating your submodel. Each template provides a structured 
                                format with predefined fields and validation rules.
                            </Typography>
                        </Box>

                        <Grid2 container spacing={3}>
                            {/* Available Schema Cards */}  
                            {Object.entries(SCHEMA_REGISTRY).map(([schemaKey, schema]: [string, SchemaDefinition]) => {
                                return (
                                    <Grid2 
                                        key={schemaKey} 
                                        size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                                    >
                                        <Card sx={{
                                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: 2,
                                            height: '280px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(96, 165, 250, 0.4)',
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 32px rgba(96, 165, 250, 0.2)'
                                            },
                                            overflow: 'hidden'
                                        }}>
                                            <CardActionArea 
                                                onClick={() => handleSchemaSelect(schemaKey, schema)}
                                                sx={{ height: '100%', p: 0 }}
                                            >
                                                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    {/* Schema Title (Full Name) */}
                                                    <Box>
                                                        <Typography
                                                            variant="h5"
                                                            sx={{
                                                                color: 'text.primary',
                                                                fontWeight: 600,
                                                                mb: 1.5,
                                                                fontSize: '1.5rem',
                                                                lineHeight: 1.3,
                                                                width: '100%'
                                                            }}
                                                        >
                                                            {schema.metadata.name}
                                                        </Typography>
                                                        {/* Version Chip directly below title */}
                                                        <Chip
                                                            label={`v${schema.metadata.version}`}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: schema.metadata.color,
                                                                color: 'white',
                                                                fontWeight: 600,
                                                                fontSize: '10px',
                                                                alignSelf: 'flex-start',
                                                                mb: 0
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Schema Description - centered vertically */}
                                                    <Box sx={{ 
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        flex: 1,
                                                        py: 2
                                                    }}>
                                                        <Typography variant="body2" sx={{ 
                                                            color: 'text.secondary',
                                                            fontSize: '0.875rem',
                                                            lineHeight: 1.4,
                                                            textAlign: 'left'
                                                        }}>
                                                            {schema.metadata.description}
                                                        </Typography>
                                                    </Box>

                                                    {/* Semantic ID and Namespace */}
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column',
                                                        gap: 1,
                                                        mt: 'auto'
                                                    }}>
                                                        {/* Semantic ID chip removed as requested */}
                                                        {/* Namespace Chip */}
                                                        {schema.metadata.namespace && (
                                                            <Tooltip
                                                                title={`Click to copy namespace: ${schema.metadata.namespace}`}
                                                                placement="top"
                                                                arrow
                                                                disableInteractive
                                                                enterDelay={200}
                                                                leaveDelay={0}
                                                            >
                                                                <Chip
                                                                    label={schema.metadata.namespace}
                                                                    size="medium"
                                                                    variant="outlined"
                                                                    onClick={(e) => handleCopy(schema.metadata.namespace!, e)}
                                                                    sx={{
                                                                        fontSize: '10px',
                                                                        height: '24px',
                                                                        width: '100%',
                                                                        borderColor: 'rgba(96, 165, 250, 0.4)',
                                                                        color: 'rgba(96, 165, 250, 0.9)',
                                                                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                                                                        fontFamily: 'monospace',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                        '&:hover': {
                                                                            borderColor: 'rgba(96, 165, 250, 0.8)',
                                                                            backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                                                            transform: 'scale(1.02)'
                                                                        },
                                                                        '& .MuiChip-label': {
                                                                            px: 1,
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid2>
                                );
                            })}

                            {/* Future Schema Placeholder Card */}
                            <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                <Card sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                                    borderRadius: 2,
                                    height: '280px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                        border: '2px dashed rgba(255, 255, 255, 0.3)',
                                    }
                                }}>
                                    <CardContent sx={{ 
                                        textAlign: 'center',
                                        p: 3
                                    }}>
                                        <AddIcon sx={{ 
                                            fontSize: 48, 
                                            color: alpha('#ffffff', 0.3),
                                            mb: 2
                                        }} />
                                        <Typography variant="h6" sx={{ 
                                            color: alpha('#ffffff', 0.5),
                                            fontWeight: 500,
                                            mb: 1
                                        }}>
                                            More Schemas
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                            color: alpha('#ffffff', 0.3),
                                            fontSize: '0.75rem'
                                        }}>
                                            Additional schema templates will be available soon
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        </Grid2>
                    </Container>
                </DialogContent>
            </Dialog>

            {/* Snackbar for copy confirmation */}
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setCopySuccess(false)} 
                    severity="success" 
                    sx={{ width: '100%' }}
                >
                    Copied to clipboard: {copiedValue}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default SchemaSelector;
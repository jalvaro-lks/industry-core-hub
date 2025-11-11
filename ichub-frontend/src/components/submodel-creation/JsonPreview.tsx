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
    Alert,
    Chip,
    Paper,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    Error as ErrorIcon,
    ErrorOutline as ErrorOutlineIcon,
    CheckCircle as CheckCircleIcon,
    Code as CodeIcon,
    NavigateNext as NavigateNextIcon,
    ExpandMore as ExpandMoreIcon,
    Link as LinkIcon
} from '@mui/icons-material';

interface JsonPreviewProps {
    data: any;
    errors?: string[];
    onNavigateToField?: (fieldKey: string) => void;
}

const JsonPreview: React.FC<JsonPreviewProps> = ({ data, errors = [], onNavigateToField }) => {
    const [errorsExpanded, setErrorsExpanded] = useState(false);
    const formatJsonString = (obj: any): string => {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            return 'Error formatting JSON';
        }
    };

    // Map error messages to field keys for navigation
    const getFieldKeyFromError = (error: string): string | null => {
        // Extract field names from "X is required" messages
        const requiredMatch = error.match(/^(.+) is required$/);
        if (requiredMatch) {
            const fieldLabel = requiredMatch[1];
            // Convert label to potential field key - this is a heuristic approach
            const fieldKey = fieldLabel
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/id$/, 'Id');
            
            // Common mappings for DPP fields
            const fieldMappings: Record<string, string> = {
                'version': 'metadata.version',
                'expirationdate': 'metadata.expirationDate',
                'issuedate': 'metadata.issueDate',
                'economicoperatorid': 'metadata.economicOperatorId',
                'passportidentifier': 'metadata.passportIdentifier',
                'predecessor': 'metadata.predecessor',
                'backupreference': 'metadata.backupReference',
                'language': 'metadata.language',
                'manufacturerpartid': 'identification.manufacturerPartId',
                'nameatmanufacturer': 'identification.nameAtManufacturer',
                'carriertype': 'identification.carrierType',
                'carrierlayout': 'identification.carrierLayout'
            };
            
            return fieldMappings[fieldKey] || null;
        }
        
        return null;
    };

    const handleNavigateToError = (error: string) => {
        const fieldKey = getFieldKeyFromError(error);
        if (fieldKey && onNavigateToField) {
            onNavigateToField(fieldKey);
        }
    };

    const hasErrors = errors.length > 0;
    const hasData = data && Object.keys(data).length > 0;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Status Indicator - Only show when no errors */}
            {!hasErrors && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasData ? (
                        <>
                            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'success.main' }}>
                                Valid JSON structure
                            </Typography>
                        </>
                    ) : (
                        <>
                            <CodeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Waiting for data...
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {/* Error Messages Accordion - Minimalist */}
            {hasErrors && (
                <Accordion 
                    expanded={errorsExpanded}
                    onChange={(event, isExpanded) => setErrorsExpanded(isExpanded)}
                    sx={{ 
                        mb: 2,
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        border: 'none',
                        '&:before': {
                            display: 'none',
                        },
                        '& .MuiAccordionSummary-root': {
                            backgroundColor: 'transparent',
                            border: 'none',
                            minHeight: 40,
                            px: 0,
                            '&.Mui-expanded': {
                                minHeight: 40,
                            }
                        }
                    }}
                >
                    <AccordionSummary 
                        expandIcon={<ExpandMoreIcon sx={{ color: 'error.main', fontSize: 18 }} />}
                        sx={{ 
                            px: 1,
                            '& .MuiAccordionSummary-expandIconWrapper': {
                                marginRight: '8px' // Mantiene distancia consistente
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                            <ErrorIcon sx={{ color: 'error.main', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 500 }}>
                                {errors.length} validation error{errors.length !== 1 ? 's' : ''} found
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pt: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {errors.map((error, index) => {
                                const fieldKey = getFieldKeyFromError(error);
                                const canNavigate = fieldKey && onNavigateToField;
                                
                                return (
                                    <Box
                                        key={index}
                                        onClick={canNavigate ? () => handleNavigateToError(error) : undefined}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            py: 1,
                                            px: 2.5,
                                            ml: 1,
                                            backgroundColor: 'rgba(211, 47, 47, 0.05)',
                                            borderRadius: 1,
                                            cursor: canNavigate ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': canNavigate ? {
                                                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                                transform: 'translateX(2px)',
                                            } : {}
                                        }}
                                    >
                                        <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 16 }} />
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: 'error.main', 
                                                flex: 1,
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            {error}
                                        </Typography>
                                        {canNavigate ? (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 0.5,
                                                opacity: 0.8,
                                                '&:hover': { opacity: 1 }
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.75rem' }}>
                                                    Go to field
                                                </Typography>
                                                <NavigateNextIcon 
                                                    sx={{ 
                                                        color: 'primary.main', 
                                                        fontSize: 18
                                                    }} 
                                                />
                                            </Box>
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                opacity: 0.5
                                            }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                                                    Not navigable
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* JSON Content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Paper sx={{
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: hasErrors 
                        ? '1px solid rgba(211, 47, 47, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 1,
                    overflow: 'auto',
                    position: 'relative',
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
                    {/* JSON Syntax Highlighting Header */}
                    <Box sx={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        zIndex: 1
                    }}>
                        <CodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontWeight: 600
                        }}>
                            JSON Output
                        </Typography>
                        <Chip
                            label={`${Object.keys(data || {}).length} fields`}
                            size="small"
                            sx={{
                                ml: 'auto',
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(96, 165, 250, 0.2)',
                                color: 'primary.main'
                            }}
                        />
                    </Box>

                    {/* JSON Content */}
                    <Box sx={{ p: 2 }}>
                        {hasData ? (
                            <pre style={{
                                margin: 0,
                                padding: 0,
                                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                color: '#ffffff',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                <code style={{
                                    background: 'none',
                                    padding: 0,
                                    color: 'inherit'
                                }}>
                                    {formatJsonString(data)}
                                </code>
                            </pre>
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '200px',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <CodeIcon sx={{ 
                                    fontSize: 48, 
                                    color: 'rgba(255, 255, 255, 0.2)' 
                                }} />
                                <Typography variant="body2" sx={{ 
                                    color: 'text.secondary',
                                    textAlign: 'center'
                                }}>
                                    Start filling the form to see the JSON preview
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Box>

            {/* Footer Info */}
            {hasData && (
                <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <Typography variant="caption" sx={{ 
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5
                    }}>
                        Preview Statistics:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${Object.keys(data).length} top-level fields`}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.secondary'
                            }}
                        />
                        <Chip
                            label={`${formatJsonString(data).length} characters`}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.secondary'
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default JsonPreview;
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
    Alert,
    Chip,
    Paper,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Tooltip
} from '@mui/material';
import {
    Error as ErrorIcon,
    ErrorOutline as ErrorOutlineIcon,
    CheckCircle as CheckCircleIcon,
    Code as CodeIcon,
    NavigateNext as NavigateNextIcon,
    ExpandMore as ExpandMoreIcon,
    Link as LinkIcon,
    ContentCopy as ContentCopyIcon,
    Check as CheckIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { downloadJson } from '../../utils/downloadJson';

interface JsonPreviewProps {
    data: any;
    errors?: string[];
    onNavigateToField?: (fieldKey: string) => void;
    interactive?: boolean; // Si true, activa interactividad (hover en keys)
}

const JsonPreview: React.FC<JsonPreviewProps> = ({ data, errors = [], onNavigateToField, interactive = false }) => {
    const [errorsExpanded, setErrorsExpanded] = useState(false);
    const [hoveredLine, setHoveredLine] = useState<number | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [clickedLine, setClickedLine] = useState<number | null>(null);
    const [clickedAddress, setClickedAddress] = useState<string>('');

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };
    const handleDownloadJson = () => {
        downloadJson(data, 'submodel.json');
    };

    // Preprocesado: genera un array de { line, address } para cada línea del JSON
    // Añadimos tipo de línea para lógica de navegación
    type JsonLine = { line: string; address: string | null; type: 'object-open' | 'object-close' | 'array-open' | 'array-close' | 'primitive' | 'key-array-open' | 'key-object-open' | 'key-primitive' };
    const getJsonLinesWithAddress = (data: any): JsonLine[] => {
        const lines: JsonLine[] = [];
        const pathStack: (string | number)[] = [];
        function walk(node: any, indent: number, parentIsArray: boolean) {
            const pad = (n: number) => '  '.repeat(n);
            if (Array.isArray(node)) {
                lines.push({
                    line: pad(indent) + '[',
                    address: pathStack.length > 0 ? pathStack.join('.') : null,
                    type: 'array-open'
                });
                for (let i = 0; i < node.length; i++) {
                    pathStack.push(i);
                    walk(node[i], indent + 1, true);
                    pathStack.pop();
                }
                lines.push({
                    line: pad(indent) + ']',
                    address: pathStack.length > 0 ? pathStack.join('.') : null,
                    type: 'array-close'
                });
            } else if (node !== null && typeof node === 'object') {
                lines.push({
                    line: pad(indent) + '{',
                    address: pathStack.length > 0 ? pathStack.join('.') : null,
                    type: 'object-open'
                });
                const keys = Object.keys(node);
                keys.forEach((key, idx) => {
                    pathStack.push(key);
                    const value = node[key];
                    let valueIsPrimitive = (typeof value !== 'object' || value === null);
                    let valueIsArray = Array.isArray(value);
                    let valueIsObject = !valueIsArray && typeof value === 'object' && value !== null;
                    let keyStr = pad(indent + 1) + '"' + key + '": ';
                    if (valueIsPrimitive) {
                        let valStr = JSON.stringify(value);
                        lines.push({
                            line: keyStr + valStr + (idx < keys.length - 1 ? ',' : ''),
                            address: pathStack.join('.'),
                            type: 'key-primitive'
                        });
                    } else if (valueIsArray) {
                        lines.push({
                            line: keyStr + '[',
                            address: pathStack.join('.'),
                            type: 'key-array-open'
                        });
                        for (let i = 0; i < value.length; i++) {
                            pathStack.push(i);
                            walk(value[i], indent + 2, true);
                            pathStack.pop();
                        }
                        lines.push({
                            line: pad(indent + 1) + ']' + (idx < keys.length - 1 ? ',' : ''),
                            address: pathStack.join('.'),
                            type: 'array-close'
                        });
                    } else if (valueIsObject) {
                        lines.push({
                            line: keyStr + '{',
                            address: pathStack.join('.'),
                            type: 'key-object-open'
                        });
                        walk(value, indent + 2, false);
                        lines.push({
                            line: pad(indent + 1) + '}' + (idx < keys.length - 1 ? ',' : ''),
                            address: pathStack.join('.'),
                            type: 'object-close'
                        });
                    }
                    pathStack.pop();
                });
                lines.push({
                    line: pad(indent) + '}',
                    address: pathStack.length > 0 ? pathStack.join('.') : null,
                    type: 'object-close'
                });
            } else {
                lines.push({
                    line: pad(indent) + JSON.stringify(node),
                    address: pathStack.length > 0 ? pathStack.join('.') : null,
                    type: 'primitive'
                });
            }
        }
        walk(data, 0, false);
        return lines;
    };

    // Memoizar para evitar recálculo
    const jsonLinesWithAddress = useMemo(() => getJsonLinesWithAddress(data), [data]);

    // Función para colorear cada línea (imitando VSCode)
    const highlightJsonLine = (line: string) => {
        let html = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        html = html.replace(/("[^"]+?")(?=\s*:)/g, (m) => `<span style=\"color:#9CDCFE\">${m}</span>`);
        html = html.replace(/(:\s*)"(.*?)"/g, (m, p1, p2) => `${p1}<span style=\"color:#CE9178\">"${p2}"</span>`);
        html = html.replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, (m, p1, p2) => `${p1}<span style=\"color:#B5CEA8\">${p2}</span>`);
        html = html.replace(/(:\s*)(true|false|null)/g, (m, p1, p2) => `${p1}<span style=\"color:#569CD6\">${p2}</span>`);
        html = html.replace(/([{}\[\]])/g, '<span style=\"color:#FFD700\">$1</span>');
        html = html.replace(/(,)/g, '<span style=\"color:#D4D4D4\">$1</span>');
        return html;
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
                    {/* JSON Syntax Highlighting Header + Copy/Download */}
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
                        <Box sx={{ flex: 1 }} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={copySuccess ? 'Copied!' : 'Copy JSON'}>
                                <IconButton
                                    size="small"
                                    onClick={handleCopyJson}
                                    sx={{
                                        color: copySuccess ? '#4CAF50' : '#CCCCCC',
                                        backgroundColor: copySuccess ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: copySuccess 
                                                ? 'rgba(76, 175, 80, 0.2)' 
                                                : 'rgba(255, 255, 255, 0.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    {copySuccess ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Download JSON">
                                <IconButton
                                    size="small"
                                    onClick={handleDownloadJson}
                                    sx={{
                                        color: '#CCCCCC',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                        },
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                >
                                    <DownloadIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* JSON Content */}
                    <Box sx={{ p: 0 }}>
                        {hasData ? (
                            <Box sx={{ display: 'flex', fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', fontSize: '0.875rem', lineHeight: 1.6, color: '#ffffff', background: 'none', border: 'none', width: '100%' }}>
                                {/* Columna de números de línea */}
                                <Box sx={{
                                    background: '#18181a',
                                    color: '#858585',
                                    userSelect: 'none',
                                    textAlign: 'right',
                                    pt: 2,
                                    pb: 2,
                                    borderRight: '1px solid #23272f',
                                    minWidth: '40px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                    letterSpacing: '0.5px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    pl: '5px',
                                    pr: '5px',
                                }}>
                                    {jsonLinesWithAddress.map((_, idx) => (
                                        <Box key={idx} sx={{
                                            height: '1.6em',
                                            lineHeight: '1.6em',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            background: hoveredLine === idx ? 'rgba(96,165,250,0.08)' : 'none',
                                            transition: 'background 0.15s',
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit'
                                        }}>{idx + 1}</Box>
                                    ))}
                                </Box>
                                {/* JSON coloreado con navegación precisa */}
                                <Box sx={{ flex: 1, pl: 2, pt: 2, pb: 2, overflowX: 'auto' }}>
                                    {jsonLinesWithAddress.map(({ line, address, type }, idx) => {
                                        let navAddress = address;
                                        if ((type === 'object-open' || type === 'key-object-open' || type === 'key-array-open' || type === 'array-open') && address) {
                                            for (let j = idx + 1; j < jsonLinesWithAddress.length; j++) {
                                                const l = jsonLinesWithAddress[j];
                                                if (l.address && l.address.startsWith(address) && l.type === 'key-primitive') {
                                                    navAddress = l.address;
                                                    break;
                                                }
                                            }
                                            navAddress = address;
                                        }
                                        return (
                                            <Box
                                                key={idx}
                                                component="div"
                                                sx={{
                                                    height: '1.6em',
                                                    lineHeight: '1.6em',
                                                    whiteSpace: 'pre',
                                                    background: hoveredLine === idx ? 'rgba(96,165,250,0.08)' : 'none',
                                                    transition: 'background 0.15s',
                                                    cursor: navAddress ? 'pointer' : 'default'
                                                }}
                                                onMouseEnter={() => setHoveredLine(idx)}
                                                onMouseLeave={() => setHoveredLine(null)}
                                                onClick={() => {
                                                    if (navAddress) {
                                                        setClickedLine(idx);
                                                        setClickedAddress(navAddress);
                                                        if (onNavigateToField) {
                                                            onNavigateToField(navAddress);
                                                        }
                                                        setTimeout(() => setClickedLine(null), 1500);
                                                    }
                                                }}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: highlightJsonLine(line) }} />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
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
                            label={`${JSON.stringify(data, null, 2).length} characters`}
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
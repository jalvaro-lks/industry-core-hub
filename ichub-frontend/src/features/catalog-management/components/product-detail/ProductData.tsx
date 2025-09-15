/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
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

import { Box, Grid2, Chip, Snackbar, Alert, Card, CardContent, Divider, Tooltip, IconButton, Typography } from '@mui/material'
import { PartType } from '../../types/types';
import { PieChart } from '@mui/x-charts/PieChart';
import WifiTetheringErrorIcon from '@mui/icons-material/WifiTetheringError';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import ShareIcon from '@mui/icons-material/Share';
import InfoIcon from '@mui/icons-material/Info';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { SharedPartner } from '../../types/types';
import SharedTable from './SharedTable';
import { useEffect, useState } from 'react';
import { fetchCatalogPartTwinDetails } from '../../api';
import { CatalogPartTwinDetailsRead } from '../../types/twin-types';

interface ProductDataProps {
    part: PartType;
    sharedParts: SharedPartner[];
}

// Modern copyable field component
interface CopyableFieldProps {
    label: string;
    value: string;
    icon?: React.ReactNode;
    onCopy: (value: string, fieldName: string) => void;
    variant?: 'standard' | 'chip';
}

const CopyableField = ({ label, value, icon, onCopy, variant = 'standard' }: CopyableFieldProps) => {
    if (variant === 'chip') {
        return (
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    
                    <Typography variant="caption1" sx={{ 
                        color: 'text.secondary', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em',
                        fontWeight: 600 
                    }}>
                        {label}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        label={value}
                        variant="outlined"
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'text.primary',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            maxWidth: 400,
                            '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                paddingX: 2,
                                paddingY: 0.5
                            },
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                borderColor: 'primary.main'
                            }
                        }}
                        clickable
                        onClick={() => onCopy(value, label)}
                    />
                    <Tooltip title={`Copy ${label}`}>
                        <IconButton
                            size="small"
                            onClick={() => onCopy(value, label)}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                    color: 'primary.main',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
                <Typography variant="label3" sx={{ color: 'text.primary' }}>
                    {label}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body1" sx={{ color: 'text.primary', flex: 1 }}>
                    {value}
                </Typography>
                <Tooltip title={`Copy ${label}`}>
                    <IconButton
                        size="small"
                        onClick={() => onCopy(value, label)}
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {
                                color: 'primary.main',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                        }}
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <Divider sx={{ mt: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
        </Box>
    );
};

const ProductData = ({ part, sharedParts }: ProductDataProps) => {
    const [twinDetails, setTwinDetails] = useState<CatalogPartTwinDetailsRead | null>(null);
    const [isLoadingTwin, setIsLoadingTwin] = useState(false);
    const [copySnackbar, setCopySnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        const fetchTwinData = async () => {
            if (part.manufacturerId && part.manufacturerPartId) {
                setIsLoadingTwin(true);
                try {
                    console.log('Fetching twin details for part:', part.manufacturerId, part.manufacturerPartId);
                    const twinData = await fetchCatalogPartTwinDetails(part.manufacturerId, part.manufacturerPartId);
                    console.log('Twin data received:', twinData);
                    setTwinDetails(twinData);
                } catch (error) {
                    console.error('Error fetching twin details:', error);
                    setTwinDetails(null);
                } finally {
                    setIsLoadingTwin(false);
                }
            }
        };

        fetchTwinData();
    }, [part.manufacturerId, part.manufacturerPartId]);

    const handleCopy = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySnackbar({ open: true, message: `${fieldName} copied to clipboard!` });
        } catch (error) {
            console.error('Failed to copy:', error);
            setCopySnackbar({ open: true, message: `Failed to copy ${fieldName}` });
        }
    };

    const handleCloseSnackbar = () => {
        setCopySnackbar({ open: false, message: '' });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not available';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            {/* Header Section */}
            <Card sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 2
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Grid2 container spacing={2} alignItems="center">
                        {/* Left Side - Product Name and Manufacturer Info */}
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <InventoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'text.primary', mb: 0.5, fontWeight: 600 }}>
                                        {part.name}
                                    </Typography>
                                    <Chip 
                                        label={part.category} 
                                        variant="outlined" 
                                        size="small"
                                        sx={{ 
                                            backgroundColor: '#0f172a',
                                            borderColor: '#3b82f6',
                                            color: '#ffffff',
                                            '& .MuiChip-label': {
                                                color: '#ffffff !important',
                                                fontSize: '12px',
                                                fontWeight: 500
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                            {/* Manufacturer Info Chips */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                                <Tooltip title="Click to copy Manufacturer ID">
                                    <Chip
                                        icon={<BusinessIcon />}
                                        label={`Manufacturer ID: ${part.manufacturerId}`}
                                        variant="filled"
                                        size="small"
                                        clickable
                                        onClick={() => handleCopy(part.manufacturerId, 'Manufacturer ID')}
                                        style={{
                                            backgroundColor: '#1e3a8a',
                                            color: '#ffffff'
                                        }}
                                        sx={{
                                            backgroundColor: '#1e3a8a !important',
                                            borderColor: '#3b82f6 !important',
                                            color: '#ffffff !important',
                                            '&:hover': {
                                                backgroundColor: '#1e40af !important'
                                            },
                                            '& .MuiChip-icon': {
                                                color: '#ffffff !important'
                                            },
                                            '& .MuiChip-label': {
                                                color: '#ffffff !important',
                                                fontSize: '12px !important',
                                                fontWeight: '600 !important'
                                            },
                                            '& span': {
                                                color: '#ffffff !important'
                                            },
                                            '&.MuiChip-root span': {
                                                color: '#ffffff !important'
                                            },
                                            '&.MuiChip-root .MuiChip-label': {
                                                color: '#ffffff !important'
                                            }
                                        }}
                                    />
                                </Tooltip>
                                                                <Tooltip title="Click to copy Manufacturer Part ID">
                                    <Chip
                                        icon={<InventoryIcon />}
                                        label={`Manufacturer Part ID: ${part.manufacturerPartId}`}
                                        variant="filled"
                                        size="small"
                                        clickable
                                        onClick={() => handleCopy(part.manufacturerPartId, 'Manufacturer Part ID')}
                                        style={{
                                            backgroundColor: '#166534',
                                            color: '#ffffff'
                                        }}
                                        sx={{
                                            backgroundColor: '#166534 !important',
                                            borderColor: '#22c55e !important',
                                            color: '#ffffff !important',
                                            '&:hover': {
                                                backgroundColor: '#15803d !important'
                                            },
                                            '& .MuiChip-icon': {
                                                color: '#ffffff !important'
                                            },
                                            '& .MuiChip-label': {
                                                color: '#ffffff !important',
                                                fontSize: '12px !important',
                                                fontWeight: '600 !important'
                                            },
                                            '& span': {
                                                color: '#ffffff !important'
                                            },
                                            '&.MuiChip-root span': {
                                                color: '#ffffff !important'
                                            },
                                            '&.MuiChip-root .MuiChip-label': {
                                                color: '#ffffff !important'
                                            }
                                        }}
                                    />
                                </Tooltip>
                            </Box>
                        </Grid2>

                        {/* Right Side - Digital Twin Info */}
                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        color: 'text.primary', 
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        justifyContent: { xs: 'flex-start', md: 'flex-end' }
                                    }}>
                                        <DeviceHubIcon sx={{ color: 'primary.main' }} />
                                        Digital Twin
                                    </Typography>
                                    {isLoadingTwin ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                            <Chip 
                                                label="Loading AAS ID..." 
                                                variant="outlined" 
                                                size="small" 
                                                disabled 
                                                sx={{
                                                    '& .MuiChip-label': {
                                                        color: '#ffffff !important',
                                                        fontSize: '12px'
                                                    }
                                                }}
                                            />
                                            <Chip 
                                                label="Loading Twin ID..." 
                                                variant="outlined" 
                                                size="small" 
                                                disabled 
                                                sx={{
                                                    '& .MuiChip-label': {
                                                        color: '#ffffff !important',
                                                        fontSize: '12px'
                                                    }
                                                }}
                                            />
                                        </Box>
                                    ) : twinDetails ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                            {twinDetails.dtrAasId && (
                                                <Tooltip title="Click to copy AAS ID">
                                                    <Chip
                                                        icon={<FingerprintIcon />}
                                                        label={`AAS: ${twinDetails.dtrAasId}`}
                                                        variant="outlined"
                                                        size="small"
                                                        clickable
                                                        onClick={() => handleCopy(twinDetails.dtrAasId, 'AAS ID')}
                                                        sx={{
                                                            backgroundColor: '#7c2d92',
                                                            borderColor: '#a855f7',
                                                            color: '#ffffff',
                                                            maxWidth: '100%',
                                                            '&:hover': {
                                                                backgroundColor: '#86198f'
                                                            },
                                                            '& .MuiChip-icon': {
                                                                color: '#ffffff'
                                                            },
                                                            '& .MuiChip-label': {
                                                                color: '#ffffff !important',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '300px'
                                                            },
                                                            '& span': {
                                                                color: '#ffffff !important'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                            {twinDetails.globalId && (
                                                <Tooltip title="Click to copy Digital Twin ID">
                                                    <Chip
                                                        icon={<AccountTreeIcon />}
                                                        label={`Twin: ${twinDetails.globalId}`}
                                                        variant="outlined"
                                                        size="small"
                                                        clickable
                                                        onClick={() => handleCopy(twinDetails.globalId, 'Digital Twin ID')}
                                                        sx={{
                                                            backgroundColor: '#c2410c',
                                                            borderColor: '#f97316',
                                                            color: '#ffffff',
                                                            maxWidth: '100%',
                                                            '&:hover': {
                                                                backgroundColor: '#ea580c'
                                                            },
                                                            '& .MuiChip-icon': {
                                                                color: '#ffffff'
                                                            },
                                                            '& .MuiChip-label': {
                                                                color: '#ffffff !important',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '300px'
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                            {(!twinDetails.dtrAasId && !twinDetails.globalId) && (
                                                <Chip 
                                                    label="No Twin IDs" 
                                                    variant="outlined" 
                                                    size="small" 
                                                    sx={{ 
                                                        color: '#ffffff',
                                                        borderColor: 'rgba(255, 255, 255, 0.3)',
                                                        '& .MuiChip-label': {
                                                            color: '#ffffff !important'
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                            <Chip 
                                                label="No Twin Data" 
                                                variant="outlined" 
                                                size="small" 
                                                sx={{ 
                                                    color: 'text.disabled',
                                                    borderColor: 'rgba(255, 255, 255, 0.3)'
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Grid2>
                    </Grid2>
                </CardContent>
            </Card>

            <Grid2 container spacing={3}>
                {/* Left Column - Part Details */}
                <Grid2 size={{ lg: 6, md: 12, sm: 12 }}>
                    <Card sx={{ 
                        height: 'fit-content',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 2
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ 
                                color: 'text.primary', 
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <InfoIcon sx={{ color: 'primary.main' }} />
                                Part Details
                            </Typography>

                            {part.bpns && (
                                <CopyableField
                                    label="Site of Origin (BPNS)"
                                    value={part.bpns}
                                    icon={<LocationOnIcon />}
                                    onCopy={handleCopy}
                                />
                            )}

                            <Box sx={{ mb: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <DescriptionIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="label3" sx={{ color: 'text.primary' }}>
                                        Description
                                    </Typography>
                                </Box>
                                <Typography variant="body3" sx={{ 
                                    color: 'text.secondary',
                                    fontStyle: part.description ? 'normal' : 'italic'
                                }}>
                                    {part.description || 'No description available'}
                                </Typography>
                            </Box>

                            {/* Digital Twin Timestamps */}
                            {twinDetails && (
                                <>
                                    <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
                                    <Typography variant="h6" sx={{ 
                                        color: 'text.primary', 
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}>
                                        <AccessTimeIcon sx={{ color: 'primary.main' }} />
                                        Twin Timestamps
                                    </Typography>

                                    {/* Timestamps */}
                                    <Grid2 container spacing={2}>
                                        <Grid2 size={6}>
                                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 1 }}>
                                                <AccessTimeIcon sx={{ color: 'success.main', mb: 1 }} />
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    mb: 1
                                                }}>
                                                    Created
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {isLoadingTwin 
                                                        ? 'Loading...' 
                                                        : twinDetails?.createdDate 
                                                            ? formatDate(twinDetails.createdDate)
                                                            : 'Not available'
                                                    }
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 1 }}>
                                                <UpdateIcon sx={{ color: 'warning.main', mb: 1 }} />
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    mb: 1
                                                }}>
                                                    Updated
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {isLoadingTwin 
                                                        ? 'Loading...' 
                                                        : twinDetails?.modifiedDate 
                                                            ? formatDate(twinDetails.modifiedDate)
                                                            : 'Not available'
                                                    }
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                    </Grid2>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid2>

                {/* Right Column - Sharing & Materials */}
                <Grid2 size={{ lg: 6, md: 12, sm: 12 }}>
                    {/* Sharing Information Card */}
                    <Card sx={{ 
                        mb: 3,
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 2
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ 
                                color: 'text.primary', 
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <ShareIcon sx={{ color: 'primary.main' }} />
                                Shared With
                            </Typography>
                            
                            {sharedParts.length > 0 ? (
                                <SharedTable sharedParts={sharedParts} />
                            ) : (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 2,
                                    p: 3,
                                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: 1,
                                    border: '1px dashed rgba(255, 255, 255, 0.12)'
                                }}>
                                    <WifiTetheringErrorIcon sx={{ color: 'text.secondary' }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        No sharing insights are currently available. Share this part with a partner to view the information here.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Materials & Dimensions Card */}
                    <Card sx={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 2
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ 
                                color: 'text.primary', 
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <InfoIcon sx={{ color: 'primary.main' }} />
                                More Information
                            </Typography>
                            
                            <Grid2 container spacing={3}>
                                {/* Materials Chart */}
                                <Grid2 size={{ md: 8, xs: 12 }}>
                                    <Typography variant="label3" sx={{ color: 'text.primary', mb: 2, display: 'block' }}>
                                        Materials:
                                    </Typography>
                                    {(part.materials && part.materials.length > 0) ? (
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'center',
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: 1,
                                            p: 2
                                        }}>
                                            <PieChart
                                                series={[
                                                    {
                                                        data: part.materials.map((material) => ({
                                                            value: material.share,
                                                            label: material.name,
                                                        })),
                                                        highlightScope: { fade: 'global', highlight: 'item' },
                                                    },
                                                ]}
                                                width={200}
                                                height={200}
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 3,
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: 1,
                                            border: '1px dashed rgba(255, 255, 255, 0.12)'
                                        }}>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                No materials data available
                                            </Typography>
                                        </Box>
                                    )}
                                </Grid2>
                                
                                {/* Physical Properties */}
                                <Grid2 size={{ md: 4, xs: 12 }}>
                                    <Typography variant="label3" sx={{ color: 'text.primary', mb: 2, display: 'block' }}>
                                        Dimensions:
                                    </Typography>
                                    <Grid2 container spacing={2}>
                                        <Grid2 size={6}>
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                p: 1.5, 
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}>
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}>
                                                    Width
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {part.width?.value || '-'} {part.width?.unit || ''}
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                p: 1.5, 
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}>
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}>
                                                    Height
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {part.height?.value || '-'} {part.height?.unit || ''}
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                p: 1.5, 
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}>
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}>
                                                    Length
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {part.length?.value || '-'} {part.length?.unit || ''}
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                        <Grid2 size={6}>
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                p: 1.5, 
                                                backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                                                borderRadius: 1,
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}>
                                                <Typography variant="caption1" sx={{ 
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}>
                                                    Weight
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                                    {part.weight?.value || '-'} {part.weight?.unit || ''}
                                                </Typography>
                                            </Box>
                                        </Grid2>
                                    </Grid2>
                                </Grid2>
                            </Grid2>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>

            {/* Copy notification snackbar */}
            <Snackbar
                open={copySnackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="success" 
                    sx={{ 
                        width: '100%',
                        backgroundColor: '#2e7d32',
                        color: '#ffffff',
                        '& .MuiAlert-icon': {
                            color: '#ffffff'
                        },
                        '& .MuiAlert-message': {
                            color: '#ffffff'
                        },
                        '& .MuiAlert-action button': {
                            color: '#ffffff'
                        }
                    }}
                >
                    {copySnackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductData;

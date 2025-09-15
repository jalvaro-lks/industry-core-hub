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

import { Box, Grid2, Chip, Snackbar, Alert, Card, CardContent, Divider, Tooltip, IconButton } from '@mui/material'
import { Typography } from '@catena-x/portal-shared-components';
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
                    {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <InventoryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Box>
                            <Typography variant="h2" sx={{ color: 'text.primary', mb: 0.5 }}>
                                {part.name}
                            </Typography>
                            <Chip 
                                label={part.category} 
                                variant="outlined" 
                                size="small"
                                sx={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }}
                            />
                        </Box>
                    </Box>
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

                            <CopyableField
                                label="Manufacturer"
                                value={part.manufacturerId}
                                icon={<BusinessIcon />}
                                onCopy={handleCopy}
                            />

                            <CopyableField
                                label="Manufacturer Part ID"
                                value={part.manufacturerPartId}
                                icon={<InventoryIcon />}
                                onCopy={handleCopy}
                            />

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

                            {/* Digital Twin Information */}
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
                                        <DeviceHubIcon sx={{ color: 'primary.main' }} />
                                        Digital Twin Information
                                    </Typography>

                                    <CopyableField
                                        label="AAS Identifier"
                                        value={twinDetails.dtrAasId || 'Not available'}
                                        icon={<FingerprintIcon />}
                                        onCopy={handleCopy}
                                        variant="chip"
                                    />

                                    <CopyableField
                                        label="Digital Twin ID"
                                        value={twinDetails.globalId || 'Not available'}
                                        icon={<AccountTreeIcon />}
                                        onCopy={handleCopy}
                                        variant="chip"
                                    />

                                    {/* Timestamps */}
                                    <Grid2 container spacing={2} sx={{ mt: 2 }}>
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
                    sx={{ width: '100%' }}
                >
                    {copySnackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductData;

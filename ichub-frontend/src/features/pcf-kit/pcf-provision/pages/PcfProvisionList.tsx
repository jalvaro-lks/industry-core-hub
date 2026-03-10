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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Co2 as Co2Icon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  EnergySavingsLeaf as EnergySavingsLeafIcon,
  IosShare as IosShareIcon
} from '@mui/icons-material';
import { PCFListItem } from '../types';
import { fetchUserPCFs, deletePCF, sharePCF } from '../api/pcfProvisionApi';
import { pcfCardStyles, getEmissionLevel } from '../styles/cardStyles';
import { QRCodeSVG } from 'qrcode.react';

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': 'Draft',
    'active': 'Registered',
    'shared': 'Shared',
    'pending': 'Pending'
  };
  return statusMap[status.toLowerCase()] || status;
};

const getStatusChipStyle = (status: string) => {
  const statusKey = status.toLowerCase() as keyof typeof pcfCardStyles.chip;
  return pcfCardStyles.chip[statusKey] || pcfCardStyles.chip.default;
};

const formatShortDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};

const generateCXId = (manufacturerPartId?: string, partInstanceId?: string): string => {
  if (!manufacturerPartId || !partInstanceId) return '';
  return `CX:${manufacturerPartId}:${partInstanceId}`;
};

const PcfProvisionList: React.FC = () => {
  const navigate = useNavigate();
  const [pcfs, setPcfs] = useState<PCFListItem[]>([]);
  const [filteredPcfs, setFilteredPcfs] = useState<PCFListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pcfToDelete, setPcfToDelete] = useState<PCFListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPcfForMenu, setSelectedPcfForMenu] = useState<PCFListItem | null>(null);
  const openMenu = Boolean(anchorEl);
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showCarouselControls, setShowCarouselControls] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [pcfToShare, setPcfToShare] = useState<PCFListItem | null>(null);
  const [partnerBpn, setPartnerBpn] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const checkCarouselOverflow = () => {
    if (carouselRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = carouselRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      setShowCarouselControls(hasOverflow);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = 340;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkCarouselOverflow, 300);
    }
  };

  // Load PCFs on mount
  useEffect(() => {
    loadPCFs();
  }, []);

  // Filter PCFs when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPcfs(pcfs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = pcfs.filter(
        pcf =>
          pcf.name.toLowerCase().includes(query) ||
          pcf.manufacturerPartId?.toLowerCase().includes(query) ||
          pcf.partInstanceId?.toLowerCase().includes(query)
      );
      setFilteredPcfs(filtered);
    }
  }, [searchQuery, pcfs]);

  // Update scroll controls
  useEffect(() => {
    checkCarouselOverflow();
    window.addEventListener('resize', checkCarouselOverflow);
    return () => window.removeEventListener('resize', checkCarouselOverflow);
  }, [filteredPcfs]);

  const loadPCFs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUserPCFs();
      setPcfs(data);
      setFilteredPcfs(data);
    } catch (err) {
      console.error('Error loading PCFs:', err);
      setError('Failed to load PCF declarations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, pcf: PCFListItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedPcfForMenu(pcf);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPcfForMenu(null);
  };

  const handleViewPCF = (pcf: PCFListItem) => {
    navigate(`/pcf/provision/${pcf.id}`);
    handleMenuClose();
  };

  const handleDeleteClick = (pcf: PCFListItem) => {
    setPcfToDelete(pcf);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!pcfToDelete) return;
    
    setIsDeleting(true);
    try {
      await deletePCF(pcfToDelete.id);
      setPcfs(prev => prev.filter(p => p.id !== pcfToDelete.id));
      setDeleteDialogOpen(false);
      setPcfToDelete(null);
    } catch (err) {
      console.error('Error deleting PCF:', err);
      setError('Failed to delete PCF. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareClick = (pcf: PCFListItem) => {
    setPcfToShare(pcf);
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleShareConfirm = async () => {
    if (!pcfToShare || !partnerBpn.trim()) return;
    
    setIsSharing(true);
    try {
      await sharePCF(pcfToShare.id, partnerBpn.trim());
      setPcfs(prev => prev.map(p => 
        p.id === pcfToShare.id 
          ? { ...p, status: 'shared' as const, shareCount: p.shareCount + 1 }
          : p
      ));
      setShareDialogOpen(false);
      setPcfToShare(null);
      setPartnerBpn('');
    } catch (err) {
      console.error('Error sharing PCF:', err);
      setError('Failed to share PCF. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess({ ...copySuccess, [id]: true });
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCreateNew = () => {
    navigate('/pcf/provision/create');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#22c55e' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header - Similar to EcoPass */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)'
            }}
          >
            <Co2Icon sx={{ fontSize: { xs: 28, sm: 32 }, color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                color: '#fff',
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' }
              }}
            >
              PCF Declarations
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Manage your Product Carbon Footprint declarations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              ...pcfCardStyles.button.primary,
              display: { xs: 'none', sm: 'flex' },
              px: 3,
              py: 1.5
            }}
          >
            Create PCF
          </Button>
        </Box>

        {/* Mobile Create Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            ...pcfCardStyles.button.primary,
            display: { xs: 'flex', sm: 'none' },
            py: 1.5,
            mb: 2
          }}
        >
          Create PCF
        </Button>
      </Box>

      {/* Sticky Search Bar - Similar to EcoPass */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(10px)',
          py: 2,
          mb: 2,
          mx: -2,
          px: 2,
          borderBottom: '1px solid rgba(34, 197, 94, 0.1)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search PCF declarations by name, part ID, or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
              </InputAdornment>
            )
          }}
          sx={pcfCardStyles.textField}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#f44336' }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Empty State - Similar to EcoPass but for PCF */}
      {filteredPcfs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
          <EnergySavingsLeafIcon sx={{ fontSize: 64, color: 'rgba(34, 197, 94, 0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            {searchQuery ? 'No PCF declarations found' : 'No PCF declarations yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Create your first Product Carbon Footprint declaration to get started'}
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              startIcon={<Co2Icon />}
              onClick={handleCreateNew}
              sx={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                borderRadius: { xs: '10px', md: '12px' },
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.125rem' },
                padding: { xs: '12px 32px', md: '14px 40px' },
                minWidth: { xs: '200px', md: '240px' },
                textTransform: 'none' as const,
                boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 12px 32px rgba(34, 197, 94, 0.5)',
                  transform: 'translateY(-2px) scale(1.02)'
                }
              }}
            >
              Get Started
            </Button>
          )}
        </Box>
      ) : (
        /* PCF Cards Carousel */
        <Box sx={{ position: 'relative' }}>
          {/* Scroll controls */}
          {showCarouselControls && canScrollLeft && (
            <IconButton
              onClick={() => scrollCarousel('left')}
              sx={{
                position: 'absolute',
                left: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
          {showCarouselControls && canScrollRight && (
            <IconButton
              onClick={() => scrollCarousel('right')}
              sx={{
                position: 'absolute',
                right: -20,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                backgroundColor: 'rgba(30, 30, 30, 0.9)',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.3)' }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          )}

          {/* Cards container */}
          <Box
            ref={carouselRef}
            onScroll={checkCarouselOverflow}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              pb: 2,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {filteredPcfs.map((pcf) => {
              const cxId = generateCXId(pcf.manufacturerPartId, pcf.partInstanceId);
              const emissionLevel = pcf.carbonFootprint ? getEmissionLevel(pcf.carbonFootprint) : 'low';
              
              return (
                <Card
                  key={pcf.id}
                  sx={{
                    ...pcfCardStyles.card,
                    minWidth: 320,
                    maxWidth: 360,
                    height: 400,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(34, 197, 94, 0.3)',
                    }
                  }}
                  onClick={() => handleViewPCF(pcf)}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getStatusLabel(pcf.status)}
                          size="small"
                          sx={{
                            ...getStatusChipStyle(pcf.status),
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {pcf.status === 'active' && (
                          <Tooltip title="Share PCF">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareClick(pcf);
                              }}
                              sx={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                              <IosShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, pcf)}
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Name and Version */}
                    <Typography variant="h6" color="white" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
                      {pcf.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      v{pcf.version} • {formatShortDate(pcf.createdAt)}
                    </Typography>

                    {/* Carbon Footprint Metric */}
                    {pcf.carbonFootprint !== undefined && (
                      <Box
                        sx={{
                          ...pcfCardStyles.metric.carbonFootprint,
                          ...pcfCardStyles.metric[emissionLevel],
                          mb: 2,
                          flex: 1
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Carbon Footprint
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ color: pcfCardStyles.metric[emissionLevel].color }}>
                          {pcf.carbonFootprint.toFixed(2)} <Typography component="span" variant="body2">kg CO₂e</Typography>
                        </Typography>
                        {pcf.declaredUnit && (
                          <Typography variant="caption" color="text.secondary">
                            per {pcf.declaredUnit}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* CX ID with QR Code */}
                    {cxId && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
                        <Box
                          sx={{
                            p: 1,
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <QRCodeSVG value={cxId} size={48} level="M" />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Discovery ID
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              variant="body2"
                              color="white"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {cxId}
                            </Typography>
                            <Tooltip title={copySuccess[pcf.id] ? 'Copied!' : 'Copy'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyToClipboard(cxId, pcf.id);
                                }}
                                sx={{ color: copySuccess[pcf.id] ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
                              >
                                {copySuccess[pcf.id] ? <CheckCircleIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            '& .MuiMenuItem-root': {
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }
          }
        }}
      >
        <MenuItem onClick={() => selectedPcfForMenu && handleViewPCF(selectedPcfForMenu)}>
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 20 }} /> View Details
        </MenuItem>
        {selectedPcfForMenu?.status === 'active' && (
          <MenuItem onClick={() => selectedPcfForMenu && handleShareClick(selectedPcfForMenu)}>
            <IosShareIcon sx={{ mr: 1.5, fontSize: 20 }} /> Share
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => selectedPcfForMenu && handleDeleteClick(selectedPcfForMenu)}
          sx={{ color: '#ef4444 !important' }}
        >
          <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1 }}>
          Delete PCF Declaration?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete "{pcfToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            sx={{
              backgroundColor: '#ef4444',
              color: 'white',
              '&:hover': { backgroundColor: '#dc2626' }
            }}
          >
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            minWidth: 450
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Share PCF Declaration
          <IconButton onClick={() => setShareDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter the Business Partner Number (BPN) of the partner you want to share "{pcfToShare?.name}" with.
          </Typography>
          <TextField
            fullWidth
            label="Partner BPN"
            placeholder="BPNL..."
            value={partnerBpn}
            onChange={(e) => setPartnerBpn(e.target.value)}
            sx={pcfCardStyles.textField}
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setShareDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShareConfirm}
            disabled={isSharing || !partnerBpn.trim()}
            sx={pcfCardStyles.button.primary}
          >
            {isSharing ? <CircularProgress size={20} color="inherit" /> : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PcfProvisionList;
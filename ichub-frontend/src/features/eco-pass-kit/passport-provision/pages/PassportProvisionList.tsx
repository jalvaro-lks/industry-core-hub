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
  CardActions,
  Chip,
  IconButton,
  Grid2,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge as MuiBadge,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Delete as DeleteIcon,
  PostAdd as PostAddIcon,
  Inventory as InventoryIcon,
  CloudUpload as CloudUploadIcon,
  CloudQueue as CloudQueueIcon,
  MoreVert as MoreVertIcon,
  Launch as LaunchIcon,
  IosShare as IosShareIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  GridView as GridViewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DPPListItem } from '../types';
import { fetchUserDPPs, deleteDPP, getDPPById } from '../api/provisionApi';
import { darkCardStyles } from '../styles/cardStyles';
import { formatShortDate, generateCXId } from '../utils/formatters';
import { CardChip } from '../components/CardChip';
import { getParticipantId } from '@/services/EnvironmentService';
import { exportPassportToPDF } from '../../utils/pdfExport';
import { QRCodeSVG } from 'qrcode.react';

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Registered',
    'shared': 'Shared',
    'draft': 'Draft',
    'pending': 'Pending'
  };
  return statusMap[status.toLowerCase()] || status;
};

const PassportProvisionList: React.FC = () => {
  const navigate = useNavigate();
  const [dpps, setDpps] = useState<DPPListItem[]>([]);
  const [filteredDpps, setFilteredDpps] = useState<DPPListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dppToDelete, setDppToDelete] = useState<DPPListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDppForMenu, setSelectedDppForMenu] = useState<DPPListItem | null>(null);
  const openMenu = Boolean(anchorEl);
  const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});
  const [seeAllDialogOpen, setSeeAllDialogOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showCarouselControls, setShowCarouselControls] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
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
      const cardWidth = 340; // 320px card + 20px padding
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkCarouselOverflow, 300);
    }
  };

  useEffect(() => {
    loadDPPs();
  }, []);

  useEffect(() => {
    filterDPPs();
  }, [searchQuery, dpps]);

  useEffect(() => {
    checkCarouselOverflow();
    window.addEventListener('resize', checkCarouselOverflow);
    return () => window.removeEventListener('resize', checkCarouselOverflow);
  }, [filteredDpps]);

  const loadDPPs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUserDPPs();
      setDpps(data);
      setFilteredDpps(data);
    } catch (err) {
      setError('Failed to load digital product passports');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDPPs = () => {
    if (!searchQuery.trim()) {
      setFilteredDpps(dpps);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = dpps.filter(dpp =>
      dpp.name.toLowerCase().includes(query) ||
      (dpp.manufacturerPartId?.toLowerCase() || '').includes(query) ||
      (dpp.serialNumber?.toLowerCase() || '').includes(query) ||
      dpp.version.includes(query)
    );
    setFilteredDpps(filtered);
  };

  const handleCreateNew = () => {
    navigate('/passport/provision/create');
  };

  const handleView = async (dppId: string) => {
    try {
      // Fetch full DPP data before navigation
      const fullDppData = await getDPPById(dppId);
      if (fullDppData) {
        // Pass the full DPP data to skip loading animation
        navigate(`/passport/provision/${dppId}`, { state: { dppData: fullDppData } });
      } else {
        // Navigate without data, will load on the detail page
        navigate(`/passport/provision/${dppId}`);
      }
    } catch (error) {
      console.error('Error fetching DPP data:', error);
      // Navigate anyway, will load on the detail page
      navigate(`/passport/provision/${dppId}`);
    }
  };

  const handleShare = (dppId: string) => {
    // Will be implemented with ShareDialog
    console.log('Share DPP:', dppId);
  };

  const handleExportPDF = async (dpp: DPPListItem) => {
    await exportPassportToPDF({
      name: dpp.name,
      status: dpp.status,
      version: dpp.version,
      manufacturerPartId: dpp.manufacturerPartId,
      serialNumber: dpp.serialNumber,
      passportIdentifier: dpp.passportIdentifier,
      twinId: dpp.twinId,
      semanticId: dpp.semanticId,
      manufacturerBPN: getParticipantId()
    });
  };

  const handleDeleteClick = (dpp: DPPListItem) => {
    setDppToDelete(dpp);
    setDeleteDialogOpen(true);
  };

  const handleCopyPassportId = async (dppId: string) => {
    const dpp = dpps.find(d => d.id === dppId);
    if (!dpp || !dpp.manufacturerPartId || !dpp.serialNumber) return;
    
    const passportId = `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`;
    try {
      await navigator.clipboard.writeText(passportId);
      setCopySuccess({ ...copySuccess, [dppId]: true });
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [dppId]: false }));
        setAnchorEl(null);
        setSelectedDppForMenu(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy passport ID:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!dppToDelete) return;

    try {
      setIsDeleting(true);
      await deleteDPP(dppToDelete.id);
      setDpps(prev => prev.filter(d => d.id !== dppToDelete.id));
      setDeleteDialogOpen(false);
      setDppToDelete(null);
    } catch (err) {
      setError('Failed to delete passport');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
            }}
          >
            <PostAddIcon sx={{ fontSize: { xs: 28, sm: 32 }, color: '#fff' }} />
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
              Digital Product Passports
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Manage and share your product passports
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            sx={{
              ...darkCardStyles.button.primary,
              display: { xs: 'none', sm: 'flex' },
              px: 3,
              py: 1.5
            }}
          >
            Create Passport
          </Button>
        </Box>

        {/* Mobile Create Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            ...darkCardStyles.button.primary,
            display: { xs: 'flex', sm: 'none' },
            py: 1.5,
            mb: 2
          }}
        >
          Create Passport
        </Button>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by name, manufacturer part ID, or instance ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
              </InputAdornment>
            )
          }}
          sx={darkCardStyles.textField}
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
            borderRadius: '12px',
            '& .MuiAlert-icon': { color: '#f44336' },
            '& .MuiAlert-message': { color: '#fff' }
          }}
        >
          {error}
        </Alert>
      )}

      {/* DPP Cards */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%',
          mb: 2,
        }}
      >
        {showCarouselControls && canScrollLeft && (
          <IconButton
            onClick={() => scrollCarousel('left')}
            sx={{
              position: 'absolute',
              left: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 48,
              height: 48,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.95)',
                borderColor: 'rgba(102, 126, 234, 0.8)',
                transform: 'translateY(-50%) scale(1.15)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
              },
              '&:active': {
                transform: 'translateY(-50%) scale(0.95)',
              },
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        
        {showCarouselControls && canScrollRight && (
          <IconButton
            onClick={() => scrollCarousel('right')}
            sx={{
              position: 'absolute',
              right: -16,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 48,
              height: 48,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.95)',
                borderColor: 'rgba(102, 126, 234, 0.8)',
                transform: 'translateY(-50%) scale(1.15)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
              },
              '&:active': {
                transform: 'translateY(-50%) scale(0.95)',
              },
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)'
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        <Box
          ref={carouselRef}
          onScroll={checkCarouselOverflow}
          className="custom-cards-list"
          sx={{
            display: 'flex !important',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            pb: 3,
            pt: 1,
            WebkitOverflowScrolling: 'touch',
            flexWrap: 'nowrap !important',
            '&::-webkit-scrollbar': {
              height: '12px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              margin: '0 20px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
              borderRadius: '10px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(90deg, rgba(102, 126, 234, 1) 0%, rgba(118, 75, 162, 1) 100%)',
                transform: 'scaleY(1.2)',
              },
              '&:active': {
                background: 'rgba(102, 126, 234, 1)',
              },
            },
          }}
        >
          {filteredDpps.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
              <InventoryIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                {searchQuery ? 'No passports found' : 'No passports yet'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 3 }}>
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Create your first digital product passport to get started'}
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateNew}
                  sx={darkCardStyles.button.primary}
                >
                  Create Passport
                </Button>
              )}
            </Box>
          ) : (
            filteredDpps.map((dpp) => (
            <Box 
              key={dpp.id}
              className="custom-card-box"
              sx={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
              }}
            >
              <Box
                className="custom-card"
                sx={{ 
                  height: 320,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)',
                  }
                }}
                onClick={() => handleView(`CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`)}
              >
                <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                  <CardChip status={dpp.status} statusText={getStatusLabel(dpp.status)} />
                  <Box className="custom-card-header-buttons">
                    {(dpp.status === 'draft' || dpp.status === 'pending') && (
                      <Tooltip title="Register passport" arrow>
                        <span>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              // Register functionality placeholder
                              console.log('Register DPP:', dpp.id);
                            }}
                          >
                            {dpp.status === 'draft' ? (
                              <CloudUploadIcon className="register-btn" />
                            ) : (
                              <CloudQueueIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {dpp.status !== 'draft' && dpp.status !== 'pending' && (
                      <Tooltip title="Share passport" arrow>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(dpp.id);
                          }}
                        >
                          <IosShareIcon sx={{ color: 'white' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="More options" arrow>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnchorEl(e.currentTarget);
                          setSelectedDppForMenu(dpp);
                        }}
                      >
                        <MoreVertIcon sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Tooltip title={dpp.name} arrow placement="top">
                        <Typography variant="h5" sx={{ mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', cursor: 'help' }}>
                          {(() => {
                            const passportName = dpp.name;
                            if (passportName.length <= 55) return passportName;
                            const startLength = 15;
                            const endLength = 15;
                            return `${passportName.substring(0, startLength)}...${passportName.substring(passportName.length - endLength)}`;
                          })()}
                        </Typography>
                      </Tooltip>
                    </Box>
                    {dpp.manufacturerPartId && dpp.serialNumber && (
                      <Box 
                        sx={{ 
                          flexShrink: 0,
                          backgroundColor: '#fff',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <QRCodeSVG 
                          value={`CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`}
                          size={70}
                          level="M"
                          includeMargin={false}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ mt: 0.5, flex: 1, minHeight: 0 }}>
                    <Typography 
                      sx={{ 
                        fontSize: '0.65rem', 
                        color: 'rgba(255,255,255,0.45)', 
                        fontWeight: 500, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.8px', 
                        mb: '0px',
                        display: 'block'
                      }}
                    >
                      Passport Discovery ID
                    </Typography>
                    <Tooltip title={dpp.manufacturerPartId && dpp.serialNumber ? `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}` : 'N/A'} arrow placement="top">
                      <Typography 
                        sx={{ 
                          fontFamily: 'Monaco, "Lucida Console", monospace',
                          fontSize: '0.76rem',
                          color: 'rgba(255,255,255,0.87)',
                          lineHeight: 1.1,
                          fontWeight: 500,
                          letterSpacing: '0.1px',
                          display: 'block',
                          mb: '0px',
                          maxWidth: '100%',
                          cursor: 'help'
                        }}
                      >
                        {(() => {
                          if (!dpp.manufacturerPartId || !dpp.serialNumber) return 'N/A';
                          const passportId = `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`;
                          if (passportId.length <= 30) return passportId;
                          const startLength = 15;
                          const endLength = 12;
                          return `${passportId.substring(0, startLength)}...${passportId.substring(passportId.length - endLength)}`;
                      })()}
                    </Typography>
                  </Tooltip>
                  {dpp.passportIdentifier && (
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        sx={{ 
                          fontSize: '0.65rem', 
                          color: 'rgba(255,255,255,0.45)', 
                          fontWeight: 500, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.8px', 
                          mb: '0px',
                          display: 'block'
                        }}
                      >
                        Passport ID
                      </Typography>
                      <Tooltip title={dpp.passportIdentifier} arrow placement="top">
                        <Typography 
                          sx={{ 
                            fontFamily: 'Monaco, "Lucida Console", monospace',
                            fontSize: '0.76rem',
                            color: 'rgba(255,255,255,0.87)',
                            lineHeight: 1.1,
                            fontWeight: 500,
                            letterSpacing: '0.1px',
                            display: 'block',
                            mb: '0px',
                            maxWidth: '100%',
                            cursor: 'help'
                          }}
                        >
                          {(() => {
                            const passportId = dpp.passportIdentifier;
                            if (passportId.length <= 30) return passportId;
                            const startLength = 15;
                            const endLength = 12;
                            return `${passportId.substring(0, startLength)}...${passportId.substring(passportId.length - endLength)}`;
                          })()}
                        </Typography>
                      </Tooltip>
                    </Box>
                  )}
                  </Box>
                </Box>
                <Box className="custom-card-button-box" sx={{ pb: "0!important" }}>
                  <Box 
                    sx={{ 
                      mb: 0,
                      mx: 0,
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'linear-gradient(90deg, rgba(79, 172, 254, 0.15) 0%, rgba(79, 172, 254, 0.08) 100%)',
                      borderTop: '1px solid rgba(79, 172, 254, 0.2)',
                      borderBottom: '1px solid rgba(79, 172, 254, 0.2)',
                      py: 0.8,
                      px: 2,
                      position: 'relative'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        color: 'rgba(79, 172, 254, 0.9)',
                        fontWeight: 600,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      Version {dpp.version}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      {formatShortDate(dpp.createdAt)}
                    </Typography>
                  </Box>
                  <Button variant="contained" size="small" endIcon={<LaunchIcon />}>
                    View
                  </Button>
                </Box>
              </Box>
            </Box>
          ))
        )}
        </Box>
      </Box>

      {/* See All Button */}
      {filteredDpps.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<GridViewIcon />}
            onClick={() => setSeeAllDialogOpen(true)}
            sx={{
              ...darkCardStyles.button.outlined,
              px: 4,
              py: 1.5,
            }}
          >
            See All ({filteredDpps.length})
          </Button>
        </Box>
      )}

      {/* See All Dialog */}
      <Dialog
        open={seeAllDialogOpen}
        onClose={() => setSeeAllDialogOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            ...darkCardStyles.card,
            width: '90vw',
            maxWidth: '1400px',
            height: '85vh',
            maxHeight: '900px',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: '#fff', 
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            pb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GridViewIcon />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              All Digital Product Passports ({filteredDpps.length})
            </Typography>
          </Box>
          <IconButton
            onClick={() => setSeeAllDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)', '&:hover': { color: '#fff' } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, overflow: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'center',
            }}
          >
            {filteredDpps.map((dpp) => (
              <Box 
                key={dpp.id}
                className="custom-card-box"
              >
                <Box
                  className="custom-card"
                  sx={{ 
                    height: 320,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(102, 126, 234, 0.3)',
                    }
                  }}
                  onClick={() => {
                    setSeeAllDialogOpen(false);
                    handleView(`CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`);
                  }}
                >
                  <Box className="custom-card-header" sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                    <CardChip status={dpp.status} statusText={getStatusLabel(dpp.status)} />
                    <Box className="custom-card-header-buttons">
                      {(dpp.status === 'draft' || dpp.status === 'pending') && (
                        <Tooltip title="Register passport" arrow>
                          <span>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Register DPP:', dpp.id);
                              }}
                            >
                              {dpp.status === 'draft' ? (
                                <CloudUploadIcon className="register-btn" />
                              ) : (
                                <CloudQueueIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {dpp.status !== 'draft' && dpp.status !== 'pending' && (
                        <Tooltip title="Share passport" arrow>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(dpp.id);
                            }}
                          >
                            <IosShareIcon sx={{ color: 'white' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="More options" arrow>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnchorEl(e.currentTarget);
                            setSelectedDppForMenu(dpp);
                          }}
                        >
                          <MoreVertIcon sx={{ color: 'rgba(255, 255, 255, 0.68)' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Box className="custom-card-content" sx={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Tooltip title={dpp.name} arrow placement="top">
                          <Typography variant="h5" sx={{ mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', cursor: 'help' }}>
                            {(() => {
                              const passportName = dpp.name;
                              if (passportName.length <= 55) return passportName;
                              const startLength = 15;
                              const endLength = 15;
                              return `${passportName.substring(0, startLength)}...${passportName.substring(passportName.length - endLength)}`;
                            })()}
                          </Typography>
                        </Tooltip>
                      </Box>
                      {dpp.manufacturerPartId && dpp.serialNumber && (
                        <Box 
                          sx={{ 
                            flexShrink: 0,
                            backgroundColor: '#fff',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          <QRCodeSVG 
                            value={`CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`}
                            size={70}
                            level="M"
                            includeMargin={false}
                          />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ mt: 0.5, flex: 1, minHeight: 0 }}>
                      <Typography 
                        sx={{ 
                          fontSize: '0.65rem', 
                          color: 'rgba(255,255,255,0.45)', 
                          fontWeight: 500, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.8px', 
                          mb: '0px',
                          display: 'block'
                        }}
                      >
                        Passport Discovery ID
                      </Typography>
                      <Tooltip title={dpp.manufacturerPartId && dpp.serialNumber ? `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}` : 'N/A'} arrow placement="top">
                        <Typography 
                          sx={{ 
                            fontFamily: 'Monaco, "Lucida Console", monospace',
                            fontSize: '0.76rem',
                            color: 'rgba(255,255,255,0.87)',
                            lineHeight: 1.1,
                            fontWeight: 500,
                            letterSpacing: '0.1px',
                            display: 'block',
                            mb: '0px',
                            maxWidth: '100%',
                            cursor: 'help'
                          }}
                        >
                          {(() => {
                            if (!dpp.manufacturerPartId || !dpp.serialNumber) return 'N/A';
                            const passportId = `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`;
                            if (passportId.length <= 30) return passportId;
                            const startLength = 15;
                            const endLength = 12;
                            return `${passportId.substring(0, startLength)}...${passportId.substring(passportId.length - endLength)}`;
                        })()}
                      </Typography>
                    </Tooltip>
                    {dpp.passportIdentifier && (
                      <Box sx={{ mt: 1 }}>
                        <Typography 
                          sx={{ 
                            fontSize: '0.65rem', 
                            color: 'rgba(255,255,255,0.45)', 
                            fontWeight: 500, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px', 
                            mb: '0px',
                            display: 'block'
                          }}
                        >
                          Passport ID
                        </Typography>
                        <Tooltip title={dpp.passportIdentifier} arrow placement="top">
                          <Typography 
                            sx={{ 
                              fontFamily: 'Monaco, "Lucida Console", monospace',
                              fontSize: '0.76rem',
                              color: 'rgba(255,255,255,0.87)',
                              lineHeight: 1.1,
                              fontWeight: 500,
                              letterSpacing: '0.1px',
                              display: 'block',
                              mb: '0px',
                              maxWidth: '100%',
                              cursor: 'help'
                            }}
                          >
                            {(() => {
                              const passportId = dpp.passportIdentifier;
                              if (passportId.length <= 30) return passportId;
                              const startLength = 15;
                              const endLength = 12;
                              return `${passportId.substring(0, startLength)}...${passportId.substring(passportId.length - endLength)}`;
                            })()}
                          </Typography>
                        </Tooltip>
                      </Box>
                    )}
                    </Box>
                  </Box>
                  <Box className="custom-card-button-box" sx={{ pb: "0!important" }}>
                    <Box 
                      sx={{ 
                        mb: 0,
                        mx: 0,
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'linear-gradient(90deg, rgba(79, 172, 254, 0.15) 0%, rgba(79, 172, 254, 0.08) 100%)',
                        borderTop: '1px solid rgba(79, 172, 254, 0.2)',
                        borderBottom: '1px solid rgba(79, 172, 254, 0.2)',
                        py: 0.8,
                        px: 2,
                        position: 'relative'
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          color: 'rgba(79, 172, 254, 0.9)',
                          fontWeight: 600,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Version {dpp.version}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }}
                      >
                        {formatShortDate(dpp.createdAt)}
                      </Typography>
                    </Box>
                    <Button variant="contained" size="small" endIcon={<LaunchIcon />}>
                      View
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => {
          setAnchorEl(null);
          setSelectedDppForMenu(null);
        }}
        MenuListProps={{ 'aria-labelledby': 'more-options-button' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { backgroundColor: 'white !important' } }}
      >
        {selectedDppForMenu && (
          <>
            <MenuItem
              onClick={() => {
                handleShare(selectedDppForMenu.id);
                setAnchorEl(null);
                setSelectedDppForMenu(null);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 16px',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <IosShareIcon fontSize="small" sx={{ marginRight: 1, color: '#000000 !important', fill: '#000000 !important' }} />
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>
                Share passport
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCopyPassportId(selectedDppForMenu.id);
              }}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 16px',
                cursor: 'pointer',
                backgroundColor: copySuccess[selectedDppForMenu.id] ? '#4caf50 !important' : 'transparent',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: copySuccess[selectedDppForMenu.id] ? '#4caf50 !important' : '#f5f5f5'
                }
              }}
            >
              {copySuccess[selectedDppForMenu.id] ? (
                <CheckCircleIcon
                  fontSize="small"
                  sx={{ color: 'white !important', fill: 'white !important', marginRight: 1 }}
                />
              ) : (
                <ContentCopyIcon
                  fontSize="small"
                  sx={{ marginRight: 1, color: '#000000 !important', fill: '#000000 !important' }}
                />
              )}
              <Box component="span" sx={{
                fontSize: '0.875rem',
                color: copySuccess[selectedDppForMenu.id] ? 'white' : 'black',
                transition: 'color 0.3s ease'
              }}>
                {copySuccess[selectedDppForMenu.id] ? 'Copied!' : 'Copy Discovery ID'}
              </Box>
            </MenuItem>
            <MenuItem
              onClick={async () => {
                await handleExportPDF(selectedDppForMenu);
                setAnchorEl(null);
                setSelectedDppForMenu(null);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 16px',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <PictureAsPdfIcon fontSize="small" sx={{ marginRight: 1, color: '#000000 !important', fill: '#000000 !important' }} />
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>
                Export PDF
              </Box>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteClick(selectedDppForMenu);
                setAnchorEl(null);
                setSelectedDppForMenu(null);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 16px',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <DeleteIcon fontSize="small" sx={{ marginRight: 1, color: '#000000 !important', fill: '#000000 !important' }} />
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'black' }}>
                Delete passport
              </Box>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            ...darkCardStyles.card,
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
          Delete Digital Product Passport
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to delete "{dppToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={darkCardStyles.button.outlined}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            sx={{
              ...darkCardStyles.button.primary,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PassportProvisionList;

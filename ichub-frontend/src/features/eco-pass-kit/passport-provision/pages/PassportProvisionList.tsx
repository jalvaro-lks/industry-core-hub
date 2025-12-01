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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DPPListItem } from '../types';
import { fetchUserDPPs, deleteDPP, getDPPById } from '../api/provisionApi';
import { darkCardStyles } from '../styles/cardStyles';
import { formatShortDate, generateCXId } from '../utils/formatters';
import { CardChip } from '../components/CardChip';
import { getParticipantId } from '@/services/EnvironmentService';

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

  useEffect(() => {
    loadDPPs();
  }, []);

  useEffect(() => {
    filterDPPs();
  }, [searchQuery, dpps]);

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
    const doc = new jsPDF();
    
    // Generate QR Code if discovery ID is available
    let qrCodeDataUrl = '';
    if (dpp.manufacturerPartId && dpp.serialNumber) {
      const discoveryId = `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`;
      
      // Create a temporary canvas to render the QR code SVG
      const canvas = document.createElement('canvas');
      const qrSize = 200;
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', qrSize.toString());
        svg.setAttribute('height', qrSize.toString());
        svg.setAttribute('viewBox', `0 0 ${qrSize} ${qrSize}`);
        
        // Generate QR code using qrcode.react logic
        const QRCodeLib = await import('qrcode.react');
        const tempDiv = document.createElement('div');
        const root = await import('react-dom/client').then(m => m.createRoot(tempDiv));
        
        await new Promise<void>((resolve) => {
          root.render(
            React.createElement(QRCodeLib.QRCodeSVG, {
              value: discoveryId,
              size: qrSize,
              level: 'M',
              includeMargin: true
            })
          );
          setTimeout(() => {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const img = new Image();
              img.onload = () => {
                ctx.drawImage(img, 0, 0);
                qrCodeDataUrl = canvas.toDataURL('image/png');
                root.unmount();
                resolve();
              };
              img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            } else {
              resolve();
            }
          }, 100);
        });
      }
    }
    
    // Title (left side)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Product Passport', 20, 20);
    
    // Product Name (left side)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(dpp.name, 20, 32);
    
    // Add QR Code box in top right if available
    let separatorEndX = 190;
    if (qrCodeDataUrl) {
      const discoveryId = `CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`;
      const qrCodeSize = 60;
      const boxPadding = 7;
      const boxX = 128;
      const boxY = 8;
      const boxSize = qrCodeSize + (boxPadding * 2);
      
      // Draw outer border box (dashed line for cutting guide)
      doc.setLineWidth(0.3);
      doc.setLineDash([2, 2]);
      doc.setDrawColor(150, 150, 150);
      doc.rect(boxX - 2, boxY - 2, boxSize + 4, boxSize + 4);
      
      // Draw inner solid border box
      doc.setLineDash([]);
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.rect(boxX, boxY, boxSize, boxSize);
      
      // Add QR code centered in the box
      doc.addImage(qrCodeDataUrl, 'PNG', boxX + boxPadding, boxY + boxPadding, qrCodeSize, qrCodeSize);
      
      // Display actual Discovery ID below the box
      doc.setFontSize(6);
      doc.setFont('courier', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(discoveryId, boxX + (boxSize / 2), boxY + boxSize + 4, { align: 'center' });
      
      // Add scissors icon symbol (✂)
      doc.setFontSize(8);
      doc.text('✂', boxX - 5, boxY + 5);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Adjust separator line to not cross QR code box
      separatorEndX = boxX - 5;
    }
    
    // Separator line (stops before QR code)
    doc.setLineWidth(0.5);
    doc.line(20, 42, separatorEndX, 42);
    
    // Information sections
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let yPos = 55;
    const lineHeight = 8;
    
    // Status
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(dpp.status.toUpperCase(), 60, yPos);
    yPos += lineHeight;
    
    // BPN (Business Partner Number)
    const bpn = getParticipantId();
    if (bpn) {
      doc.setFont('helvetica', 'bold');
      doc.text('Manufacturer ID:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(bpn, 60, yPos);
      yPos += lineHeight;
    }
    
    // Version
    doc.setFont('helvetica', 'bold');
    doc.text('Version:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(dpp.version, 60, yPos);
    yPos += lineHeight;
    
    // Manufacturer Part ID
    if (dpp.manufacturerPartId) {
      doc.setFont('helvetica', 'bold');
      doc.text('Manufacturer Part ID:', 20, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(dpp.manufacturerPartId, 20, yPos + 5);
      doc.setFontSize(12);
      yPos += lineHeight + 5;
    }
    
    // Part Instance ID (Serial Number)
    if (dpp.serialNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text('Part Instance ID:', 20, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(dpp.serialNumber, 20, yPos + 5);
      doc.setFontSize(12);
      yPos += lineHeight + 5;
    }
    
    // Discovery ID
    if (dpp.manufacturerPartId && dpp.serialNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text('Passport Discovery ID:', 20, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(`CX:${dpp.manufacturerPartId}:${dpp.serialNumber}`, 20, yPos + 5);
      doc.setFontSize(12);
      yPos += lineHeight + 5;
    }
    
    // Passport ID
    if (dpp.passportIdentifier) {
      doc.setFont('helvetica', 'bold');
      doc.text('Passport ID:', 20, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(dpp.passportIdentifier, 20, yPos + 5);
      doc.setFontSize(12);
      yPos += lineHeight + 5;
    }
    
    // AAS ID (Twin ID)
    if (dpp.twinId) {
      doc.setFont('helvetica', 'bold');
      doc.text('AAS ID:', 20, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.text(dpp.twinId, 20, yPos + 5);
      doc.setFontSize(12);
      yPos += lineHeight + 5;
    }
    
    // Created Date
    doc.setFont('helvetica', 'bold');
    doc.text('Created:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatShortDate(dpp.createdAt), 60, yPos);
    yPos += lineHeight + 2;
    
    // Semantic ID (last item)
    doc.setFont('helvetica', 'bold');
    doc.text('Semantic ID:', 20, yPos);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const semanticIdLines = doc.splitTextToSize(dpp.semanticId, 170);
    doc.text(semanticIdLines, 20, yPos + 5);
    doc.setFontSize(12);
    yPos += lineHeight + (semanticIdLines.length * 3) + 8;
    
    // Dataspace sharing notice - styled as alert box
    const boxHeight = 28;
    
    // Border (outer box for alert look)
    doc.setDrawColor(33, 150, 243); // Blue border
    doc.setLineWidth(1);
    doc.roundedRect(15, yPos - 3, 180, boxHeight, 2, 2, 'S');
    
    // Light blue background
    doc.setFillColor(227, 242, 253); // Very light blue
    doc.roundedRect(15.5, yPos - 2.5, 179, boxHeight - 1, 2, 2, 'F');
    
    // Icon area (darker blue stripe on left)
    doc.setFillColor(33, 150, 243);
    doc.rect(16, yPos - 2, 8, boxHeight - 2, 'F');
    
    // Info icon (white)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('i', 19.5, yPos + 4);
    
    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 101, 192); // Darker blue for text
    doc.text('Shared & Accessible via Dataspace', 28, yPos + 3);
    
    // Notice text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60); // Dark gray
    const noticeText = 'A Eclipse Tractus-X dataspace membership and DSP agreement to the license of usage (negotiated via an EDC Connector, or similar), may be required to get authorization for this data.';
    const noticeLines = doc.splitTextToSize(noticeText, 160);
    doc.text(noticeLines, 28, yPos + 9);
    
    yPos += boxHeight + 5;
    
    // Reset
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);
    doc.setTextColor(0, 0, 0);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by Industry Core Hub', 105, 280, { align: 'center' });
    doc.text(new Date().toLocaleString(), 105, 285, { align: 'center' });
    
    // Save the PDF
    const fileName = `DPP_${dpp.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
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

      {/* DPP Cards List */}
      <Box className="custom-cards-list">
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
            <Box key={dpp.id} className="custom-card-box">
              <Box
                className="custom-card"
                sx={{ height: "240px" }}
                onClick={() => handleView(dpp.id)}
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
                  <Tooltip title={dpp.name} arrow placement="top">
                    <Typography variant="h5" sx={{ mb: 0.5, wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto', cursor: 'help' }}>
                      {(() => {
                        const passportName = dpp.name;
                        if (passportName.length <= 80) return passportName;
                        const startLength = 20;
                        const endLength = 20;
                        return `${passportName.substring(0, startLength)}...${passportName.substring(passportName.length - endLength)}`;
                      })()}
                    </Typography>
                  </Tooltip>
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

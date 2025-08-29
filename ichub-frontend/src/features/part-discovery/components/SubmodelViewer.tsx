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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  useTheme,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import { fetchSubmodel, SubmodelDiscoveryResponse } from '../api';

interface SubmodelViewerProps {
  open: boolean;
  onClose: () => void;
  counterPartyId: string;
  shellId: string;
  dtrConnectorUrl?: string;
  submodel: {
    id: string;
    idShort: string;
    semanticId: {
      type: string;
      keys: Array<{
        type: string;
        value: string;
      }>;
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`submodel-tabpanel-${index}`}
      aria-labelledby={`submodel-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const JsonViewer: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const theme = useTheme();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Format JSON with line numbers
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split('\n');

  const formatJsonWithLineNumbers = () => {
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      return (
        <Box key={index} sx={{ display: 'flex', minHeight: '1.5rem' }}>
          <Box
            sx={{
              width: '50px',
              textAlign: 'right',
              pr: 2,
              color: '#858585', // VS Code line number color
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              userSelect: 'none',
              borderRight: '1px solid #3e3e3e', // VS Code border color
              backgroundColor: '#252526', // VS Code line number background
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end'
            }}
          >
            {lineNumber}
          </Box>
          <Box
            sx={{
              flex: 1,
              pl: 2,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre',
              color: '#D4D4D4',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: highlightJson(line) }} />
          </Box>
        </Box>
      );
    });
  };

  const highlightJson = (line: string): string => {
    // Simple text without highlighting
    return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Tooltip title={copySuccess ? "Copied!" : "Copy JSON"}>
          <IconButton
            size="small"
            onClick={handleCopyJson}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
              }
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Paper
        sx={{
          width: '100%',
          maxHeight: '100%',
          minHeight: 'fit-content',
          backgroundColor: '#1e1e1e', // VS Code dark background
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            maxHeight: '100%',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '12px',
              height: '12px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#2d2d2d' // Dark scrollbar track
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#555', // Dark scrollbar thumb
              borderRadius: '6px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#777' // Lighter on hover
            }
          }}
        >
          {formatJsonWithLineNumbers()}
        </Box>
      </Paper>
    </Box>
  );
};

export const SubmodelViewer: React.FC<SubmodelViewerProps> = ({
  open,
  onClose,
  counterPartyId,
  shellId,
  dtrConnectorUrl,
  submodel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submodelData, setSubmodelData] = useState<SubmodelDiscoveryResponse | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [lastLoadedSubmodelId, setLastLoadedSubmodelId] = useState<string | null>(null);
  const theme = useTheme();

  const semanticIdValue = submodel.semanticId?.keys?.[0]?.value || '';

  const fetchSubmodelData = useCallback(async () => {
    // Prevent multiple calls for the same submodel
    if (lastLoadedSubmodelId === submodel.id || loading) {
      console.log('SubmodelViewer: Preventing duplicate API call for submodel:', submodel.id);
      return;
    }

    console.log('SubmodelViewer: Fetching submodel data for:', submodel.id);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchSubmodel(
        counterPartyId,
        shellId,
        submodel.id,
        semanticIdValue
      );
      setSubmodelData(response);
      setLastLoadedSubmodelId(submodel.id);
      console.log('SubmodelViewer: Successfully fetched submodel data');
    } catch (err) {
      console.error('Error fetching submodel:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submodel data');
    } finally {
      setLoading(false);
    }
  }, [counterPartyId, shellId, submodel.id, semanticIdValue, lastLoadedSubmodelId, loading]);

  useEffect(() => {
    if (open && submodel.id && counterPartyId && shellId) {
      fetchSubmodelData();
    }
  }, [open, submodel.id, counterPartyId, shellId, fetchSubmodelData]);

  // Reset data when submodel changes
  useEffect(() => {
    if (submodel.id !== lastLoadedSubmodelId) {
      setSubmodelData(null);
      setError(null);
    }
  }, [submodel.id, lastLoadedSubmodelId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab(0);
      setError(null);
    }
  }, [open]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDownloadJson = () => {
    if (submodelData?.submodel) {
      const jsonString = JSON.stringify(submodelData.submodel, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `submodel-${submodel.id}-${submodel.idShort || 'data'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleShareEmail = () => {
    if (submodelData?.submodel) {
      const jsonString = JSON.stringify(submodelData.submodel, null, 2);
      const subject = encodeURIComponent(`Submodel Data: ${submodel.idShort || 'Digital Twin Data'}`);
      const body = encodeURIComponent(`Hello,

I'm sharing submodel data with you:

Digital Twin ID: ${shellId}
Business Partner Number (BPN): ${counterPartyId}
DTR Endpoint: ${dtrConnectorUrl || 'N/A'}
Submodel ID: ${submodelData.submodelDescriptor.submodelId}
Semantic ID: ${submodelData.submodelDescriptor.semanticId}
Status: ${submodelData.submodelDescriptor.status}

JSON Data:
${jsonString}

Best regards`);
      
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoLink, '_blank');
    }
  };

  const renderSubmodelInfo = () => {
    if (!submodelData) return null;

    return (
      <Box>
        <Card sx={{ mb: 2, borderRadius: 0 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: '600', color: 'primary.main' }}>
                Submodel Information
              </Typography>
              <Chip
                label={submodelData.submodelDescriptor.status}
                color={submodelData.submodelDescriptor.status === 'success' ? 'success' : 'error'}
                size="small"
                sx={{
                  fontWeight: '600',
                  '& .MuiChip-label': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                  Submodel ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<InfoIcon />}
                    label={submodelData.submodelDescriptor.submodelId}
                    variant="outlined"
                    size="small"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      },
                      '& .MuiChip-icon': {
                        color: 'primary.main'
                      }
                    }}
                  />
                  <Tooltip title="Copy Submodel ID">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(submodelData.submodelDescriptor.submodelId)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'success.main',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                  Semantic ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<DataObjectIcon />}
                    label={submodelData.submodelDescriptor.semanticId}
                    variant="outlined"
                    size="small"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      },
                      '& .MuiChip-icon': {
                        color: 'secondary.main'
                      }
                    }}
                  />
                  <Tooltip title="Copy Semantic ID">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(submodelData.submodelDescriptor.semanticId)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'success.main',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                  Asset ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<SecurityIcon />}
                    label={submodelData.submodelDescriptor.assetId}
                    variant="outlined"
                    size="small"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      },
                      '& .MuiChip-icon': {
                        color: 'warning.main'
                      }
                    }}
                  />
                  <Tooltip title="Copy Asset ID">
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(submodelData.submodelDescriptor.assetId)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'success.main',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                  Connector URL:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                  {submodelData.submodelDescriptor.connectorUrl}
                </Typography>
              </Box>
              {submodelData.submodelDescriptor.error && (
                <Box>
                  <Alert severity="error" sx={{ mt: 1, borderRadius: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: '600', mb: 0.5 }}>
                      Error Details:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {submodelData.submodelDescriptor.error}
                    </Typography>
                  </Alert>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {submodelData.dtr && (
          <Card sx={{ borderRadius: 0 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: '600', color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" />
                DTR Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                    Connector URL:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                    {submodelData.dtr.connectorUrl}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 0.5 }}>
                    Asset ID:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<SecurityIcon />}
                      label={submodelData.dtr.assetId}
                      variant="outlined"
                      size="small"
                      sx={{
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          fontFamily: 'monospace',
                          fontSize: '0.75rem'
                        },
                        '& .MuiChip-icon': {
                          color: 'warning.main'
                        }
                      }}
                    />
                    <Tooltip title="Copy DTR Asset ID">
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(submodelData.dtr!.assetId)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'success.main',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)'
                          }
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderJsonData = () => {
    if (!submodelData?.submodel || Object.keys(submodelData.submodel).length === 0) {
      return (
        <Alert severity="info">
          No submodel data available or data could not be retrieved.
        </Alert>
      );
    }

    return <JsonViewer data={submodelData.submodel} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          background: theme.palette.background.default,
          borderRadius: 0
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Submodel Viewer
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            {submodel.idShort}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Left side - Information */}
          <Box sx={{ width: '40%', borderRight: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, flexShrink: 0 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ minHeight: 'auto' }}
              >
                <Tab 
                  label="Information" 
                  icon={<DescriptionIcon />} 
                  iconPosition="start"
                  sx={{ minHeight: 'auto', py: 2, textTransform: 'none', fontWeight: 600 }}
                />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: theme.palette.background.default }}>
              <TabPanel value={activeTab} index={0}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ borderRadius: 0 }}>
                    {error}
                  </Alert>
                ) : (
                  renderSubmodelInfo()
                )}
              </TabPanel>
            </Box>
          </Box>

          {/* Right side - JSON Data */}
          <Box sx={{ width: '60%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, px: 2, py: 2, backgroundColor: theme.palette.background.paper, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
                <DataObjectIcon color="primary" />
                Submodel Data (JSON)
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden', backgroundColor: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ borderRadius: 0, m: 2 }}>
                  {error}
                </Alert>
              ) : (
                <Box sx={{ 
                  flex: '0 1 auto', 
                  overflow: 'hidden', 
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%'
                }}>
                  {renderJsonData()}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderRadius: 0, borderTop: `1px solid ${theme.palette.divider}`, p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 2,
            py: 1,
            fontSize: '0.85rem',
            fontWeight: '500'
          }}
        >
          Close
        </Button>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Button 
            onClick={handleShareEmail}
            startIcon={<EmailIcon />}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1,
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
            disabled={!submodelData?.submodel || Object.keys(submodelData?.submodel || {}).length === 0}
          >
            Share via Email
          </Button>
          <Button 
            onClick={handleDownloadJson}
            startIcon={<DownloadIcon />}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              py: 1,
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
            disabled={!submodelData?.submodel || Object.keys(submodelData?.submodel || {}).length === 0}
          >
            Download JSON
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

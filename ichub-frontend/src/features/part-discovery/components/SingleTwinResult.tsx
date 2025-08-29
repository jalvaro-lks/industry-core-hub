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

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PublicIcon from '@mui/icons-material/Public';
import LabelIcon from '@mui/icons-material/Label';

interface SingleTwinResultProps {
  singleTwinResult: {
    shell_descriptor: {
      id: string;
      idShort?: string;
      globalAssetId: string;
      submodelDescriptors: Array<{
        endpoints: Array<{
          interface: string;
          protocolInformation: {
            href: string;
            endpointProtocol: string;
            endpointProtocolVersion: string[];
            subprotocol: string;
            subprotocolBody: string;
            subprotocolBodyEncoding: string;
            securityAttributes: Array<{
              type: string;
              key: string;
              value: string;
            }>;
          };
        }>;
        idShort: string;
        id: string;
        semanticId: {
          type: string;
          keys: Array<{
            type: string;
            value: string;
          }>;
        };
        supplementalSemanticId: unknown[];
        description: unknown[];
        displayName: unknown[];
      }>;
      specificAssetIds: Array<{
        name: string;
        value: string;
      }>;
    };
    dtr?: {
      connectorUrl: string;
      assetId: string;
    };
  };
}

export const SingleTwinResult: React.FC<SingleTwinResultProps> = ({ singleTwinResult }) => {
  const [dtrInfoOpen, setDtrInfoOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Extract digitalTwinType from specificAssetIds
  const digitalTwinType = singleTwinResult.shell_descriptor.specificAssetIds.find(
    assetId => assetId.name === 'digitalTwinType'
  )?.value || 'Asset Administration Shell';

  const handleViewSubmodels = () => {
    // TODO: Implement view submodels functionality
    console.log('View submodels:', singleTwinResult.shell_descriptor.submodelDescriptors);
  };

  const handleRetrieveSubmodel = (submodel: SingleTwinResultProps['singleTwinResult']['shell_descriptor']['submodelDescriptors'][0]) => {
    // TODO: Implement retrieve specific submodel functionality
    console.log('Retrieve submodel:', submodel);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Single Twin Results Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ px: 2, pt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: '600', color: 'primary.main' }}>
          Digital Twin Found
        </Typography>
        {/* DTR Information Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            DTR Details
          </Typography>
          <IconButton
            onClick={() => setDtrInfoOpen(true)}
            sx={{
              color: 'primary.main',
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.16)'
              }
            }}
          >
            <InfoIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Asset Identifiers Section */}
      {singleTwinResult.shell_descriptor.specificAssetIds.length > 0 && (
        <Box sx={{ px: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LabelIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
            Asset Identifiers
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {singleTwinResult.shell_descriptor.specificAssetIds.map((assetId, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  icon={<LabelIcon />}
                  label={`${assetId.name}: ${assetId.value}`}
                  variant="outlined"
                  size="small"
                  sx={{
                    maxWidth: '400px',
                    '& .MuiChip-label': {
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    },
                    '& .MuiChip-icon': {
                      color: 'success.main'
                    }
                  }}
                />
                <Tooltip title={`Copy ${assetId.name}`}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(assetId.value)}
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
            ))}
          </Box>
        </Box>
      )}

      {/* Cards Row - Digital Twin Info and IDs */}
      <Box sx={{ display: 'flex', gap: 2, mx: 2, mb: 3 }}>
        {/* Digital Twin Information Card */}
        <Card sx={{ flex: 1 }}>
          <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: '600', color: 'primary.main' }}>
                Digital Twin Information
              </Typography>
              <Chip
                label={digitalTwinType}
                variant="filled"
                size="small"
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: 'primary.main',
                  fontWeight: '600',
                  '& .MuiChip-label': {
                    fontSize: '0.75rem'
                  }
                }}
              />
            </Box>
            
            {/* IdShort */}
            {singleTwinResult.shell_descriptor.idShort && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 1 }}>
                  Name (IdShort):
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: '600', color: 'text.primary' }}>
                  {singleTwinResult.shell_descriptor.idShort}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* IDs Card */}
        <Card sx={{ flex: 1 }}>
          <Box sx={{ p: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '600', color: 'primary.main', mb: 3 }}>
              Identifiers
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* AAS ID */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 1 }}>
                  AAS ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<FingerprintIcon />}
                    label={singleTwinResult.shell_descriptor.id}
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
                  <Tooltip title="Copy AAS ID">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyToClipboard(singleTwinResult.shell_descriptor.id)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Global Asset ID */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 1 }}>
                  Global Asset ID:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<PublicIcon />}
                    label={singleTwinResult.shell_descriptor.globalAssetId}
                    variant="outlined"
                    size="small"
                    sx={{
                      maxWidth: '100%',
                      '& .MuiChip-label': {
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      },
                      '& .MuiChip-icon': {
                        color: 'success.main'
                      }
                    }}
                  />
                  <Tooltip title="Copy Global Asset ID">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyToClipboard(singleTwinResult.shell_descriptor.globalAssetId)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(25, 118, 210, 0.1)'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Submodels Card */}
      <Card sx={{ mx: 2, mb: 3 }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: '600', color: 'primary.main', mb: 3 }}>
            Available Submodels
          </Typography>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {singleTwinResult.shell_descriptor.submodelDescriptors.length} submodel(s) available
            </Typography>
            {singleTwinResult.shell_descriptor.submodelDescriptors.length > 0 && (
              <Box>
                {singleTwinResult.shell_descriptor.submodelDescriptors.map((submodel, index) => (
                  <Box key={index} sx={{ mb: 1.5, p: 1.5, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {submodel.idShort || `Submodel ${index + 1}`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {submodel.id && (
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                            {submodel.id.substring(submodel.id.lastIndexOf('/') + 1) || submodel.id}
                          </Typography>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRetrieveSubmodel(submodel)}
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            px: 1.5,
                            py: 0.5,
                            minWidth: 'auto'
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                    
                    {submodel.semanticId && submodel.semanticId.keys && submodel.semanticId.keys.length > 0 && (
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: '500' }}>
                          Semantic ID{submodel.semanticId.keys.length > 1 ? 's' : ''}:
                        </Typography>
                        {submodel.semanticId.keys.map((key, keyIndex) => (
                          <Typography 
                            key={keyIndex} 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.75rem', 
                              color: 'primary.main', 
                              ml: 1,
                              mt: 0.25,
                              fontFamily: 'monospace'
                            }}
                          >
                            • {key.value.substring(key.value.lastIndexOf('/') + 1) || key.value}
                            {key.type && (
                              <Typography 
                                component="span" 
                                sx={{ 
                                  fontSize: '0.7rem', 
                                  color: 'text.disabled', 
                                  ml: 1,
                                  fontFamily: 'inherit'
                                }}
                              >
                                ({key.type})
                              </Typography>
                            )}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleViewSubmodels}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1
              }}
            >
              View All Submodels
            </Button>
          </Box>
        </Box>
      </Card>
      
      {/* DTR Information Dialog */}
      <Dialog
        open={dtrInfoOpen}
        onClose={() => setDtrInfoOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: '600', 
          color: 'primary.main',
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          pb: 2,
          px: 3,
          pt: 3
        }}>
          Digital Twin Registry Information
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* DTR Connector URL */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 1 }}>
                DTR Connector URL:
              </Typography>
              <Typography variant="body2" sx={{ 
                wordBreak: 'break-all', 
                fontFamily: 'monospace', 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.8rem'
              }}>
                {singleTwinResult?.dtr?.connectorUrl}
              </Typography>
            </Box>

            {/* DTR Asset ID */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: '600', color: 'text.secondary', mb: 1 }}>
                DTR Asset ID:
              </Typography>
              <Typography variant="body2" sx={{ 
                wordBreak: 'break-all', 
                fontFamily: 'monospace', 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.8rem'
              }}>
                {singleTwinResult?.dtr?.assetId}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={() => setDtrInfoOpen(false)}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="ID copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'success.main',
            fontSize: '0.875rem'
          }
        }}
      />
    </Box>
  );
};

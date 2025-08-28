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

import MoreVert from "@mui/icons-material/MoreVert";
import Launch from "@mui/icons-material/Launch";
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Download from '@mui/icons-material/Download';
import { Box, Typography, IconButton, Button, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { useState } from "react";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { DiscoveryCardChip } from "./DiscoveryCardChip";
import { StatusVariants } from "../../../../types/statusVariants";
import { ErrorNotFound } from "../../../../components/general/ErrorNotFound";
import LoadingSpinner from "../../../../components/general/LoadingSpinner";
import { AASData } from "../../../part-discovery/utils";

export interface AppContent {
  id?: string;
  manufacturerId: string;
  manufacturerPartId: string;
  name?: string;
  category?: string;
  status?: StatusVariants;
  dtrIndex?: number; // DTR index for display
  shellId?: string; // Shell ID (AAS ID) for display
  rawTwinData?: AASData; // Raw AAS/shell data for download
}

export interface CardDecisionProps {
  items: AppContent[];
  onClick: (e: string) => void;
  onRegisterClick?: (manufacturerId: string, manufacturerPartId: string) => void; 
  isLoading: boolean;
}

export const CatalogPartsDiscovery = ({
  items,
  onClick,
  onRegisterClick, 
  isLoading
}: CardDecisionProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<AppContent | null>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: AppContent) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleCopyShellId = async () => {
    if (selectedItem?.shellId) {
      try {
        await navigator.clipboard.writeText(selectedItem.shellId);
        console.log('Shell ID copied to clipboard:', selectedItem.shellId);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy Shell ID:', err);
      }
    }
    handleMenuClose();
  };

  const handleDownloadTwinData = () => {
    if (selectedItem?.rawTwinData) {
      try {
        const jsonString = JSON.stringify(selectedItem.rawTwinData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `twin-${selectedItem.manufacturerPartId || selectedItem.shellId || 'data'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Twin data downloaded successfully');
      } catch (err) {
        console.error('Failed to download twin data:', err);
      }
    }
    handleMenuClose();
  };

  return (
    <Box className="custom-cards-list">
      {isLoading && (
        <LoadingSpinner />
      )}
      {!isLoading && items.length === 0 && (
        <ErrorNotFound icon={ReportProblemIcon} message="No catalog parts available, please check your ichub-backend connection/configuration"/>
      )}
      {items.map((item) => {
        const name = item.name ?? "";
        const productId = item.manufacturerId + "/" + item.manufacturerPartId;
        return (
          <Box key={productId} className="custom-card-box">
            <Box
              className="custom-card"
              sx={{
                height: "220px"
              }}
              onClick={() => {
                onClick(productId);
              }}
            >
              <Box className="custom-card-header">
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <DiscoveryCardChip 
                    status={item.status} 
                    statusText={item.status} 
                    dtrIndex={item.dtrIndex}
                    useDtrDisplay={item.dtrIndex !== undefined}
                  />
                </Box>

                <Box className="custom-card-header-buttons">                  
                  {(item.status === StatusVariants.draft || item.status === StatusVariants.pending) && (
                    <Tooltip title="Register part" arrow>
                      <span> 
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRegisterClick) {
                              onRegisterClick(item.manufacturerId, item.manufacturerPartId);
                            }
                          }}
                        >
                          {item.status === StatusVariants.draft ? (
                            <CloudUploadIcon className="register-btn"/>
                          ) : (
                            <CloudQueueIcon sx={{ color: "rgba(255, 255, 255, 0.5)" }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <Tooltip title="More options" arrow>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, item)}
                    >
                      <MoreVert sx={{ color: "rgba(255, 255, 255, 0.68)" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box className="custom-card-content">
                <Typography variant="h5">
                  {name}
                </Typography>
                {item.shellId && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.7rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      display: 'block',
                      mt: 0.5,
                      mb: 0.5,
                      wordBreak: 'break-all',
                      lineHeight: 1.1,
                      maxHeight: '15px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.shellId}
                  </Typography>
                )}
                <br></br>
                <Typography variant="label2">
                  {item.category}
                </Typography>
              </Box>
              <Box className="custom-card-button-box">
                <Button variant="contained" size="small" endIcon={<Launch />}>
                  View
                </Button>
              </Box>
            </Box>
          </Box>
        );
      })}
      
      {/* More options menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'more-options-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedItem?.shellId && (
          <MenuItem onClick={handleCopyShellId}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy Shell ID</ListItemText>
          </MenuItem>
        )}
        {selectedItem?.rawTwinData && (
          <MenuItem onClick={handleDownloadTwinData}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download Twin Data</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

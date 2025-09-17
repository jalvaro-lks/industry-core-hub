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

import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ViewListIcon from '@mui/icons-material/ViewList';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import IosShare from '@mui/icons-material/IosShare';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useEffect, useState, useCallback } from 'react';
import { SerializedPart } from '../types';
import { SerializedPartTwinRead } from '../types/twin-types';
import { createSerializedPartTwin, shareSerializedPartTwin, unshareSerializedPartTwin, deleteSerializedPart, fetchAllSerializedPartTwins } from '../api';
import { StatusVariants } from '../../catalog-management/types/types';
import { SerializedPartStatusChip } from '../../catalog-management/components/product-detail/SerializedPartStatusChip';

// Extended SerializedPart interface to include twin status
interface SerializedPartWithStatus extends SerializedPart {
  twinStatus: StatusVariants;
  globalId?: string;
}

interface SerializedPartsTableProps {
  parts: SerializedPart[];
  onView?: (part: SerializedPart) => void;
  onRefresh?: () => void;
}

const SerializedPartsTable = ({ parts, onRefresh }: SerializedPartsTableProps) => {
  const [rows, setRows] = useState<SerializedPartWithStatus[]>([]);
  const [twinCreatingId, setTwinCreatingId] = useState<number | null>(null);
  const [twinSharingId, setTwinSharingId] = useState<number | null>(null);
  const [twinUnsharingId, setTwinUnsharingId] = useState<number | null>(null);
  const [partDeletingId, setPartDeletingId] = useState<number | null>(null);

  // Helper function to fetch twins for all unique parts in the table
  const fetchTwinsForParts = useCallback(async (): Promise<SerializedPartTwinRead[]> => {
    const uniqueParts = Array.from(
      new Set(parts.map(p => `${p.manufacturerId}-${p.manufacturerPartId}`))
    ).map(key => {
      const [manufacturerId, manufacturerPartId] = key.split('-');
      return { manufacturerId, manufacturerPartId };
    });

    const allTwins: SerializedPartTwinRead[] = [];
    for (const { manufacturerId, manufacturerPartId } of uniqueParts) {
      const twins = await fetchAllSerializedPartTwins(manufacturerId, manufacturerPartId);
      allTwins.push(...twins);
    }
    return allTwins;
  }, [parts]);

  // Determine twin status based on twin data
  const determineTwinStatus = (serializedPart: SerializedPart, twins: SerializedPartTwinRead[]): { status: StatusVariants; globalId?: string } => {
    const twin = twins.find(
      (t) => t.manufacturerId === serializedPart.manufacturerId &&
             t.manufacturerPartId === serializedPart.manufacturerPartId &&
             t.partInstanceId === serializedPart.partInstanceId
    );

    if (!twin) {
      return { status: StatusVariants.draft };
    }

    if (twin.shares && twin.shares.length > 0) {
      return { status: StatusVariants.shared, globalId: twin.globalId?.toString() };
    }

    return { status: StatusVariants.registered, globalId: twin.globalId?.toString() };
  };

  useEffect(() => {
    const loadTwinData = async () => {
      try {
        // Fetch twins for the specific parts being displayed
        const allTwins = await fetchTwinsForParts();
        
        // Merge serialized parts with twin status
        const rowsWithStatus = parts.map((serializedPart, index) => {
          const { status, globalId } = determineTwinStatus(serializedPart, allTwins);
          return {
            ...serializedPart,
            id: serializedPart.id || index,
            twinStatus: status,
            globalId,
            businessPartnerName: serializedPart.businessPartner.name,
            businessPartnerBpnl: serializedPart.businessPartner.bpnl,
          };
        });

        setRows(rowsWithStatus);
      } catch (error) {
        console.error("Error fetching twin data:", error);
        // If we can't fetch twin data, just show parts as draft
        const rowsWithoutStatus = parts.map((serializedPart, index) => ({
          ...serializedPart,
          id: serializedPart.id || index,
          twinStatus: StatusVariants.draft,
          businessPartnerName: serializedPart.businessPartner.name,
          businessPartnerBpnl: serializedPart.businessPartner.bpnl,
        }));
        setRows(rowsWithoutStatus);
      }
    };

    loadTwinData();
  }, [parts, fetchTwinsForParts]);

  const handleCreateTwin = async (row: SerializedPartWithStatus) => {
    setTwinCreatingId(row.id);
    try {
      await createSerializedPartTwin({
        manufacturerId: row.manufacturerId,
        manufacturerPartId: row.manufacturerPartId,
        partInstanceId: row.partInstanceId,
      });
      
      // Refresh twin data after successful creation - reload all twins for this table
      const allTwins = await fetchTwinsForParts();
      
      const rowsWithStatus = parts.map((serializedPart, index) => {
        const { status, globalId } = determineTwinStatus(serializedPart, allTwins);
        return {
          ...serializedPart,
          id: serializedPart.id || index,
          twinStatus: status,
          globalId,
          businessPartnerName: serializedPart.businessPartner.name,
          businessPartnerBpnl: serializedPart.businessPartner.bpnl,
        };
      });
      setRows(rowsWithStatus);
    } catch (error) {
      console.error("Error creating twin:", error);
    } finally {
      setTwinCreatingId(null);
    }
  };

  const handleShareTwin = async (row: SerializedPartWithStatus) => {
    if (!row.globalId) return;
    
    setTwinSharingId(row.id);
    try {
      await shareSerializedPartTwin({
        manufacturerId: row.manufacturerId,
        manufacturerPartId: row.manufacturerPartId,
        partInstanceId: row.partInstanceId,
      });
      
      // Refresh twin data after successful share
      const twins = await fetchTwinsForParts();
      const rowsWithStatus = parts.map((serializedPart, index) => {
        const { status, globalId } = determineTwinStatus(serializedPart, twins);
        return {
          ...serializedPart,
          id: serializedPart.id || index,
          twinStatus: status,
          globalId,
          businessPartnerName: serializedPart.businessPartner.name,
          businessPartnerBpnl: serializedPart.businessPartner.bpnl,
        };
      });
      setRows(rowsWithStatus);
    } catch (error) {
      console.error("Error sharing twin:", error);
    } finally {
      setTwinSharingId(null);
    }
  };

  const handleUnshareTwin = async (row: SerializedPartWithStatus) => {
    if (!row.globalId) return;
    
    setTwinUnsharingId(row.id);
    try {
      // Find the twin to get the AAS ID
      const twins = await fetchTwinsForParts();
      const twin = twins.find(
        (t) => t.manufacturerId === row.manufacturerId &&
               t.manufacturerPartId === row.manufacturerPartId &&
               t.partInstanceId === row.partInstanceId
      );

      if (!twin || !twin.dtrAasId) {
        console.error("Twin or AAS ID not found for unshare operation");
        return;
      }

      // Get all business partner numbers that the twin is currently shared with
      const businessPartnerNumbers = twin.shares?.map(share => share.businessPartner.bpnl) || [];

      await unshareSerializedPartTwin({
        aasId: twin.dtrAasId.toString(),
        businessPartnerNumberToUnshare: businessPartnerNumbers,
        manufacturerId: row.manufacturerId,
      });
      
      // Refresh twin data after successful unshare
      const updatedTwins = await fetchTwinsForParts();
      const rowsWithStatus = parts.map((serializedPart, index) => {
        const { status, globalId } = determineTwinStatus(serializedPart, updatedTwins);
        return {
          ...serializedPart,
          id: serializedPart.id || index,
          twinStatus: status,
          globalId,
          businessPartnerName: serializedPart.businessPartner.name,
          businessPartnerBpnl: serializedPart.businessPartner.bpnl,
        };
      });
      setRows(rowsWithStatus);
    } catch (error) {
      console.error("Error unsharing twin:", error);
    } finally {
      setTwinUnsharingId(null);
    }
  };

  const handleDeleteSerializedPart = async (row: SerializedPartWithStatus) => {
    console.log("Delete button clicked for row:", row);
    console.log("Row ID:", row.id, "Part Instance ID:", row.partInstanceId);
    
    if (row.id === undefined || row.id === null) {
      console.error("No row ID found for deletion");
      return;
    }
    
    setPartDeletingId(row.id);
    try {
      console.log("Calling deleteSerializedPart with:", row.id, row.partInstanceId);
      await deleteSerializedPart(row.id, row.partInstanceId);
      console.log("Delete API call successful");
      
      // Refresh data after successful deletion
      const twins = await fetchTwinsForParts();
      const rowsWithStatus = parts.map((serializedPart, index) => {
        const { status, globalId } = determineTwinStatus(serializedPart, twins);
        return {
          ...serializedPart,
          id: serializedPart.id || index,
          twinStatus: status,
          globalId,
          businessPartnerName: serializedPart.businessPartner.name,
          businessPartnerBpnl: serializedPart.businessPartner.bpnl,
        };
      });
      setRows(rowsWithStatus);
      console.log("Data refreshed after deletion");
    } catch (error) {
      console.error("Error deleting serialized part:", error);
    } finally {
      setPartDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh button clicked');
    // Trigger the parent to refresh the serialized parts data
    if (onRefresh) {
      console.log('Calling onRefresh callback to fetch fresh serialized parts');
      onRefresh();
    } else {
      console.warn('No onRefresh callback provided');
    }
  };

  // Transform data for DataGrid (keeping the old logic as fallback)
  const fallbackRows = parts.map((part, index) => ({
    id: part.id || `part-${index}`,
    customerPartId: part.customerPartId,
    businessPartnerName: part.businessPartner.name,
    businessPartnerBpnl: part.businessPartner.bpnl,
    manufacturerId: part.manufacturerId,
    manufacturerPartId: part.manufacturerPartId,
    partInstanceId: part.partInstanceId || '',
    name: part.name,
    category: part.category,
    bpns: part.bpns,
    van: part.van,
    twinStatus: StatusVariants.draft,
  }));

  const displayRows = rows.length > 0 ? rows : fallbackRows;

  // Define columns for DataGrid with Status first
  const columns: GridColDef[] = [
    {
      field: 'twinStatus',
      headerName: 'Status',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <SerializedPartStatusChip 
          status={params.value as StatusVariants}
        />
      ),
      sortable: true,
    },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => {
        const row = params.row as SerializedPartWithStatus;
        const actions = [];

        if (row.twinStatus === StatusVariants.draft) {
          actions.push(
            <Tooltip title="Register Twin" key="register" arrow>
              <IconButton
                size="small"
                onClick={() => handleCreateTwin(row)}
                disabled={twinCreatingId === row.id}
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  color: '#1976d2',
                  borderRadius: '8px',
                  width: 36,
                  height: 36,
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: 'rgba(248, 249, 250, 0.3)',
                    border: '1px solid rgba(248, 249, 250, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <CloudUploadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }

        if (row.twinStatus === StatusVariants.registered) {
          actions.push(
            <Tooltip title="Share Twin" key="share" arrow>
              <IconButton
                size="small"
                onClick={() => handleShareTwin(row)}
                disabled={twinSharingId === row.id}
                sx={{
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  color: '#9c27b0',
                  borderRadius: '8px',
                  width: 36,
                  height: 36,
                  border: '1px solid rgba(156, 39, 176, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: 'rgba(248, 249, 250, 0.3)',
                    border: '1px solid rgba(248, 249, 250, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <IosShare fontSize="small" />
              </IconButton>
            </Tooltip>
          );
          
          // Add delete button for registered twins
          actions.push(
            <Tooltip title="Delete Serialized Part" key="delete" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  console.log("Delete button clicked - registered state");
                  handleDeleteSerializedPart(row);
                }}
                disabled={partDeletingId === row.id}
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  borderRadius: '8px',
                  width: 36,
                  height: 36,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: 'rgba(248, 249, 250, 0.3)',
                    border: '1px solid rgba(248, 249, 250, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }

        if (row.twinStatus === StatusVariants.shared) {
          actions.push(
            <Tooltip title="Unshare Twin" key="unshare" arrow>
              <IconButton
                size="small"
                onClick={() => handleUnshareTwin(row)}
                disabled={twinUnsharingId === row.id}
                sx={{
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  color: '#ff9800',
                  borderRadius: '8px',
                  width: 36,
                  height: 36,
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: 'rgba(248, 249, 250, 0.3)',
                    border: '1px solid rgba(248, 249, 250, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <LinkOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
          
          // Add delete button for shared twins
          actions.push(
            <Tooltip title="Delete Serialized Part" key="delete" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  console.log("Delete button clicked - shared state");
                  handleDeleteSerializedPart(row);
                }}
                disabled={partDeletingId === row.id}
                sx={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  color: '#f44336',
                  borderRadius: '8px',
                  width: 36,
                  height: 36,
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(248, 249, 250, 0.1)',
                    color: 'rgba(248, 249, 250, 0.3)',
                    border: '1px solid rgba(248, 249, 250, 0.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }

        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {actions}
          </Box>
        );
      },
    },
    {
      field: 'partInstanceId',
      headerName: 'Part Instance ID',
      width: 270,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'customerPartId',
      headerName: 'Customer Part ID',
      width: 260,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params) => (        
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'businessPartnerName',
      headerName: 'Business Partner',
      width: 180,
      renderCell: (params) => (        
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              color: '#000000 !important',
            }}
          >
            {params.value || params.row.businessPartner?.name || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'businessPartnerBpnl',
      headerName: 'Business Partner BPNL',
      width: 200,
      renderCell: (params) => (        
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              color: '#000000 !important',
            }}
          >
            {params.value || params.row.businessPartner?.bpnl || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'manufacturerId',
      headerName: 'Manufacturer ID',
      width: 170,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'manufacturerPartId',
      headerName: 'Manufacturer Part ID',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    
    {
      field: 'bpns',
      headerName: 'BPNS',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              color: 'rgb(248, 249, 250) !important',
            }}
          >
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'van',
      headerName: 'VAN',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              color: 'rgb(248, 249, 250) !important',
            }}
          >
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Modern Header Section */}
      <Box sx={{ 
        mb: 3,
        p: 3,
        background: 'rgba(35, 35, 38, 0.95)',
        borderRadius: '16px 16px 0 0',
        borderLeft: '4px solid #1976d2',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
            }}>
              <ViewListIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ 
                  color: 'rgb(248, 249, 250)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                Serialized Parts
              </Typography>
              <Typography
                variant="body2"
                sx={{ 
                  color: 'rgba(248, 249, 250, 0.7)',
                  mt: 0.5,
                }}
              >
                View and manage serialized part instances ({displayRows.length} total)
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Modern Table Container */}
      <Paper 
        sx={{ 
          width: '100%',
          background: 'rgba(35, 35, 38, 0.95)',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          border: '1px solid rgba(248, 249, 250, 0.1)',
        }}
      >
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            className="modern-data-grid"
            rows={displayRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
              sorting: {
                sortModel: [{ field: 'id', sort: 'asc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            disableRowSelectionOnClick
            disableColumnFilter={false}
            disableColumnSelector={false}
            disableDensitySelector={false}
            rowHeight={50}
            sx={{
              border: 'none',
              color: '#000000 !important',
              '& *': {
                color: '#000000 !important',
              },
              '& .MuiDataGrid-columnHeaders': {
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(66, 165, 245, 0.1) 100%)',
                fontSize: '0.875rem',
                fontWeight: 700,
                borderBottom: '2px solid rgba(25, 118, 210, 0.3)',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                minHeight: '56px !important',
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '1px solid black',
                  '&:last-child': {
                    borderRight: 'none',
                  },
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  color: '#000000',
                },
                '& .MuiDataGrid-iconButtonContainer': {
                  '& .MuiIconButton-root': {
                    color: '#000000 !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#000000 !important',
                  },
                },
                '& .MuiDataGrid-sortIcon': {
                  color: '#000000 !important',
                },
                '& .MuiDataGrid-menuIcon': {
                  color: '#000000 !important',
                },
                '& .MuiDataGrid-filterIcon': {
                  color: '#000000 !important',
                },
              },
              '& .MuiDataGrid-columnSeparator': {
                color: '#000000 !important',
                '& svg': {
                  color: '#000000 !important',
                },
              },
              '& .MuiDataGrid-columnHeader:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
                borderBottom: '1px solid black',
                borderRight: '1px solid black',
                backgroundColor: 'transparent',
                color: '#000000 !important',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                '&:last-child': {
                  borderRight: 'none',
                },
                '& *': {
                  color: '#000000 !important',
                },
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row': {
                backgroundColor: 'transparent',
                color: '#000000 !important',
                '& .MuiDataGrid-cell': {
                  color: '#000000 !important',
                  '& *': {
                    color: '#000000 !important',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateX(2px)',
                  boxShadow: 'inset 3px 0 0 #1976d2',
                  '& .MuiDataGrid-cell': {
                    color: '#000000 !important',
                    '& *': {
                      color: '#000000 !important',
                    },
                  },
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                  '& .MuiDataGrid-cell': {
                    color: '#000000 !important',
                    '& *': {
                      color: '#000000 !important',
                    },
                  },
                },
                transition: 'all 0.2s ease-in-out',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid rgba(25, 118, 210, 0.2)',
                background: 'rgba(25, 118, 210, 0.05)',
                color: '#000000',
                minHeight: '56px',
                borderRadius: '0 0 16px 16px',
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: 'transparent',
                minHeight: '400px',
              },
              '& .MuiDataGrid-overlay': {
                backgroundColor: 'transparent',
                color: '#000000',
              },
              '& .MuiTablePagination-root': {
                color: '#000000',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: '#000000',
                fontWeight: 500,
              },
              '& .MuiTablePagination-select': {
                color: '#000000',
                backgroundColor: 'rgba(248, 249, 250, 0.1)',
                borderRadius: '6px',
              },
              '& .MuiSvgIcon-root': {
                color: '#000000',
              },
              '& .MuiTablePagination-actions button': {
                color: '#000000',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                },
                '&:disabled': {
                  color: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  gap: 3,
                  p: 4,
                }}>
                  <Box sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(66, 165, 245, 0.1) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}>
                    <ViewListIcon sx={{ fontSize: 32, color: 'rgba(25, 118, 210, 0.8)' }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: 'rgb(248, 249, 250)', fontWeight: 600 }}>
                    No serialized parts found
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(248, 249, 250, 0.6)', textAlign: 'center', maxWidth: 300 }}>
                    There are currently no serialized parts to display. Parts will appear here once they are created.
                  </Typography>
                </Box>
              ),
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SerializedPartsTable;
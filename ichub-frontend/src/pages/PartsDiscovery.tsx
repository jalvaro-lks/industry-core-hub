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
import {
  Box,
  Grid2,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Card,
  Chip,
  Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { CatalogPartsDiscovery } from '../features/part-discovery/components/catalog-parts/CatalogPartsDiscovery';
import { 
  discoverPartTypeShells, 
  discoverPartInstanceShells,
  discoverShellsByCustomerPartId,
  discoverShellsWithCustomQuery,
  discoverSingleShell,
  ShellDiscoveryPaginator,
  SingleShellDiscoveryResponse 
} from '../features/part-discovery/api';
import { 
  ShellDiscoveryResponse, 
  AASData,
  getAASDataSummary
} from '../features/part-discovery/utils';
import { fetchPartners } from '../features/partner-management/api';
import { PartnerInstance } from '../types/partner';

interface PartCardData {
  id: string;
  manufacturerId: string;
  manufacturerPartId: string;
  customerPartId?: string;
  name?: string;
  category?: string;
  digitalTwinType: string;
  globalAssetId: string;
  submodelCount: number;
}

interface SerializedPartData {
  id: string;
  globalAssetId: string;
  manufacturerId: string;
  manufacturerPartId: string;
  customerPartId?: string;
  digitalTwinType: string;
  submodelCount: number;
}

const PartsDiscovery = () => {
  const [partType, setPartType] = useState('Part');
  const [bpnl, setBpnl] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<PartnerInstance | null>(null);
  const [availablePartners, setAvailablePartners] = useState<PartnerInstance[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [globalAssetId, setGlobalAssetId] = useState('');
  const [customerPartId, setCustomerPartId] = useState('');
  const [manufacturerPartId, setManufacturerPartId] = useState('');
  const [partInstanceId, setPartInstanceId] = useState('');
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [customLimit, setCustomLimit] = useState<string>('');
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  
  // Single Twin Search Mode
  const [searchMode, setSearchMode] = useState<'discovery' | 'single'>('discovery');
  const [singleTwinAasId, setSingleTwinAasId] = useState('');
  const [singleTwinResult, setSingleTwinResult] = useState<SingleShellDiscoveryResponse | null>(null);
  
  // Sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Results and pagination
  const [partTypeCards, setPartTypeCards] = useState<PartCardData[]>([]);
  const [serializedParts, setSerializedParts] = useState<SerializedPartData[]>([]);
  const [currentResponse, setCurrentResponse] = useState<ShellDiscoveryResponse | null>(null);
  const [paginator, setPaginator] = useState<ShellDiscoveryPaginator | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load available partners on component mount
  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoadingPartners(true);
        const partners = await fetchPartners();
        setAvailablePartners(partners);
      } catch (err) {
        console.error('Error loading partners:', err);
        // Don't show error for partners loading as it's not critical
      } finally {
        setIsLoadingPartners(false);
      }
    };

    loadPartners();
  }, []);

  // Helper function to get company name from BPNL
  const getCompanyName = (bpnlValue: string): string => {
    const partner = availablePartners.find(p => p.bpnl === bpnlValue);
    return partner?.name || bpnlValue;
  };

  // Handle part type change and clear Part Instance ID when switching to Part
  const handlePartTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPartType = event.target.value;
    setPartType(newPartType);
    
    // Clear Part Instance ID when switching to Part Type
    if (newPartType === 'Part') {
      setPartInstanceId('');
    }
  };

  // Handle single twin search
  const handleSingleTwinSearch = async () => {
    if (!bpnl.trim()) {
      setError('Please enter a partner BPNL');
      return;
    }
    
    if (!singleTwinAasId.trim()) {
      setError('Please enter an AAS ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSingleTwinResult(null);
    
    try {
      const response = await discoverSingleShell(bpnl, singleTwinAasId.trim());
      setSingleTwinResult(response);
      setHasSearched(true);
    } catch (err) {
      let errorMessage = 'Failed to discover digital twin';
      
      if (err instanceof Error) {
        errorMessage = `Single twin search failed: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = `Single twin search failed: ${err}`;
      } else if (err && typeof err === 'object') {
        if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
          const responseData = err.response.data as Record<string, unknown>;
          if (typeof responseData.message === 'string') {
            errorMessage = `Single twin search failed: ${responseData.message}`;
          }
        } else if ('message' in err) {
          const errWithMessage = err as { message: string };
          errorMessage = `Single twin search failed: ${errWithMessage.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate active filter chips - scalable for future filters
  const getActiveFilterChips = () => {
    const filters = [
      {
        value: customerPartId,
        label: 'Customer Part ID',
        tooltip: 'Customer Part ID'
      },
      {
        value: manufacturerPartId,
        label: 'Manufacturer Part ID',
        tooltip: 'Manufacturer Part ID'
      },
      {
        value: globalAssetId,
        label: 'Global Asset ID',
        tooltip: 'Global Asset ID'
      },
      // Only show Part Instance ID filter when Part Instance is selected
      ...(partType === 'Serialized' ? [{
        value: partInstanceId,
        label: 'Part Instance ID',
        tooltip: 'Part Instance Identifier'
      }] : [])
      // Future filters can be easily added here:
      // {
      //   value: someNewFilter,
      //   label: 'New Filter Name',
      //   tooltip: 'New Filter Description'
      // }
    ];

    return filters
      .filter(filter => filter.value && filter.value.trim())
      .map((filter, index) => {
        return (
          <Chip 
            key={`filter-${filter.label}-${index}`}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
                  {filter.label}: 
                </Typography>
                <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: '700', ml: 0.5, color: 'inherit' }}>
                  {filter.value}
                </Typography>
              </Box>
            } 
            size="medium" 
            color="primary" 
            variant="filled"
            title={`${filter.tooltip}: ${filter.value}`}
            sx={{
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              color: '#1976d2',
              border: '1px solid rgba(25, 118, 210, 0.3)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '500',
              px: 2,
              py: 0.5,
              height: 'auto',
              minHeight: '32px',
              maxWidth: '100%',
              '& .MuiChip-label': {
                px: 1,
                py: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'unset'
              },
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                borderColor: 'rgba(25, 118, 210, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          />
        );
      });
  };

  // Convert AAS data to card format
  const convertToPartCards = (shells: AASData[]): PartCardData[] => {
    return shells.map(shell => {
      const summary = getAASDataSummary(shell);
      return {
        id: shell.id,
        manufacturerId: summary.manufacturerId || 'Unknown',
        manufacturerPartId: summary.manufacturerPartId || 'Unknown',
        customerPartId: summary.customerPartId || undefined,
        name: `${summary.manufacturerPartId}`,
        category: summary.customerPartId || undefined,
        digitalTwinType: summary.digitalTwinType || 'Unknown',
        globalAssetId: shell.globalAssetId,
        submodelCount: summary.submodelCount
      };
    });
  };

  // Convert AAS data to serialized parts format
  const convertToSerializedParts = (shells: AASData[]): SerializedPartData[] => {
    return shells.map(shell => {
      const summary = getAASDataSummary(shell);
      return {
        id: shell.id,
        globalAssetId: shell.globalAssetId,
        manufacturerId: summary.manufacturerId || 'Unknown',
        manufacturerPartId: summary.manufacturerPartId || 'Unknown',
        customerPartId: summary.customerPartId || undefined,
        digitalTwinType: summary.digitalTwinType || 'Unknown',
        submodelCount: summary.submodelCount
      };
    });
  };

  const handleGoBack = () => {
    setHasSearched(false);
    setCurrentResponse(null);
    setPaginator(null);
    setPartTypeCards([]);
    setSerializedParts([]);
    setCurrentPage(1);
    setTotalPages(0);
    setError(null);
    // Reset search fields
    setBpnl('');
    setSelectedPartner(null);
    setCustomerPartId('');
    setManufacturerPartId('');
  };

  const handleSearch = async () => {
    if (!bpnl.trim()) {
      setError('Please enter a partner BPNL');
      return;
    }

    // Validate custom limit
    if (isCustomLimit) {
      if (!customLimit.trim()) {
        setError('Please enter a custom limit or select a predefined option');
        return;
      }
      const customLimitNum = parseInt(customLimit);
      if (isNaN(customLimitNum) || customLimitNum < 1 || customLimitNum > 1000) {
        setError('Custom limit must be a number between 1 and 1000');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let response: ShellDiscoveryResponse;
      const limit = pageLimit === 0 ? undefined : pageLimit; // No limit if pageLimit is 0
      
      // Priority search: Customer Part ID > Part Instance ID > Manufacturer Part ID > Digital Twin Type
      if (customerPartId.trim()) {
        response = await discoverShellsByCustomerPartId(bpnl, customerPartId.trim(), limit);
      } else if (partType === 'Serialized' && partInstanceId.trim()) {
        // Search by Part Instance ID using custom query
        const querySpec = [
          { name: 'partInstanceId', value: partInstanceId.trim() }
        ];
        response = await discoverShellsWithCustomQuery(bpnl, querySpec, limit);
      } else if (manufacturerPartId.trim()) {
        // For manufacturerPartId search, we would need a specific API function
        // For now, fall back to digital twin type search
        // TODO: Implement discoverShellsByManufacturerPartId API function
        if (partType === 'Part') {
          response = await discoverPartTypeShells(bpnl, limit);
        } else {
          response = await discoverPartInstanceShells(bpnl, limit);
        }
      } else {
        // Default: search by digital twin type (Part Type or Part Instance)
        if (partType === 'Part') {
          response = await discoverPartTypeShells(bpnl, limit);
        } else {
          response = await discoverPartInstanceShells(bpnl, limit);
        }
      }

      setCurrentResponse(response);
      
      // Log the full response for debugging
      console.log('API Response:', response);
      
      // Check for any error-like fields in the response object
      const responseObj = response as unknown as Record<string, unknown>;
      const errorFields = Object.keys(responseObj).filter(key => 
        key.toLowerCase().includes('error') || 
        key.toLowerCase().includes('warning') ||
        key.toLowerCase().includes('message')
      );
      
      if (errorFields.length > 0) {
        const errorValues = errorFields
          .map(field => ({ field, value: responseObj[field] }))
          .filter(({ value }) => value && typeof value === 'string' && value.trim() !== '');
        
        if (errorValues.length > 0) {
          console.warn('Additional error fields found in response:', errorValues);
          // Log but don't automatically show these as errors unless they're critical
        }
      }
      
      // Check if the API returned an error in the response
      if (response.error) {
        // Handle specific error cases with user-friendly messages
        if (response.error.toLowerCase().includes('no dtrs found')) {
          setError(`No Digital Twin Registries found for partner "${bpnl}". Please verify the BPNL is correct and if the partner has a Connector (with a reachable DTR) connected in the same dataspace as you.`);
        } else {
          setError(`Search failed: ${response.error}`);
        }
        setIsLoading(false);
        return;
      }
      
      // Check if no shell descriptors were found
      if (!response.shellDescriptors || response.shellDescriptors.length === 0) {
        setError('No digital twins found for the specified criteria. Please try different search parameters.');
        setIsLoading(false);
        return;
      }
      
      // Check for errors in DTR statuses
      if (response.dtrs && response.dtrs.length > 0) {
        const errorDtrs = response.dtrs.filter(dtr => 
          dtr.status && (
            dtr.status.toLowerCase().includes('error') ||
            dtr.status.toLowerCase().includes('failed') ||
            dtr.status.toLowerCase().includes('timeout') ||
            dtr.status.toLowerCase().includes('unavailable')
          )
        );
        if (errorDtrs.length > 0) {
          console.warn('DTR errors found:', errorDtrs);
          const errorMessages = errorDtrs.map(dtr => `DTR ${dtr.connectorUrl}: ${dtr.status}`);
          setError(`DTR issues detected: ${errorMessages.join(', ')}`);
          // Don't return here - continue processing in case there are still valid results
        }
      }
      
      // Create paginator
      const digitalTwinType = partType === 'Part' ? 'PartType' : 'PartInstance';
      const newPaginator = new ShellDiscoveryPaginator(
        response,
        bpnl,
        digitalTwinType,
        limit
      );
      setPaginator(newPaginator);

      // Process results based on part type
      if (partType === 'Part') {
        const cards = convertToPartCards(response.shellDescriptors);
        setPartTypeCards(cards);
        setSerializedParts([]);
      } else {
        const serialized = convertToSerializedParts(response.shellDescriptors);
        setSerializedParts(serialized);
        setPartTypeCards([]);
      }

      setCurrentPage(response.pagination?.page || 1);
      // Calculate total pages (this would ideally come from the API)
      if (pageLimit === 0) {
        setTotalPages(1); // No pagination when no limit is set
      } else {
        setTotalPages(Math.ceil(response.shellsFound / pageLimit));
      }

      // Mark that search has been performed successfully
      setHasSearched(true);

    } catch (err) {
      console.error('Search error:', err);
      
      // Extract meaningful error message from different error types
      let errorMessage = 'Error searching for parts. Please try again.';
      
      if (err instanceof Error) {
        // Handle standard Error objects
        errorMessage = `Search failed: ${err.message}`;
      } else if (typeof err === 'string') {
        // Handle string errors
        errorMessage = `Search failed: ${err}`;
      } else if (err && typeof err === 'object') {
        // Handle axios or other structured errors
        if ('response' in err && err.response) {
          // Axios error with response
          const axiosErr = err as { response: { data?: { error?: string; message?: string }; status: number; statusText: string } };
          if (axiosErr.response.data?.error) {
            errorMessage = `API Error: ${axiosErr.response.data.error}`;
          } else if (axiosErr.response.data?.message) {
            errorMessage = `API Error: ${axiosErr.response.data.message}`;
          } else if (axiosErr.response.statusText) {
            errorMessage = `HTTP ${axiosErr.response.status}: ${axiosErr.response.statusText}`;
          } else {
            errorMessage = `HTTP Error ${axiosErr.response.status}`;
          }
        } else if ('message' in err) {
          // Object with message property
          const errWithMessage = err as { message: string };
          errorMessage = `Search failed: ${errWithMessage.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (_: React.ChangeEvent<unknown>, page: number) => {
    if (!paginator || page === currentPage) return;

    setIsLoading(true);
    setError(null);
    
    try {
      let newResponse: ShellDiscoveryResponse | null = null;

      // Handle sequential navigation (most common case)
      if (page === currentPage + 1 && paginator.hasNext()) {
        newResponse = await paginator.next();
      } else if (page === currentPage - 1 && paginator.hasPrevious()) {
        newResponse = await paginator.previous();
      } else {
        // For non-sequential navigation, show a helpful message
        // Cursor-based pagination doesn't support random page access efficiently
        setError(`Direct navigation to page ${page} is not supported. Please use next/previous navigation.`);
        setIsLoading(false);
        return;
      }

      if (newResponse) {
        // Check if the pagination response contains an error
        if (newResponse.error) {
          if (newResponse.error.toLowerCase().includes('no dtrs found')) {
            setError(`No Digital Twin Registries found for partner "${bpnl}" on page ${page}. Please verify the BPNL is correct and the partner has registered digital twins.`);
          } else {
            setError(`Pagination failed: ${newResponse.error}`);
          }
          setIsLoading(false);
          return;
        }
        
        setCurrentResponse(newResponse);
        setCurrentPage(newResponse.pagination?.page || currentPage);

        // Update results based on part type
        if (partType === 'Part') {
          const cards = convertToPartCards(newResponse.shellDescriptors);
          setPartTypeCards(cards);
        } else {
          const serialized = convertToSerializedParts(newResponse.shellDescriptors);
          setSerializedParts(serialized);
        }
      } else {
        setError('No more pages available in that direction.');
      }
    } catch (err) {
      console.error('Pagination error:', err);
      
      // Extract meaningful error message from pagination errors
      let errorMessage = 'Error loading page. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = `Pagination failed: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = `Pagination failed: ${err}`;
      } else if (err && typeof err === 'object') {
        if ('response' in err && err.response) {
          const axiosErr = err as { response: { data?: { error?: string; message?: string }; status: number; statusText: string } };
          if (axiosErr.response.data?.error) {
            errorMessage = `Pagination API Error: ${axiosErr.response.data.error}`;
          } else if (axiosErr.response.data?.message) {
            errorMessage = `Pagination API Error: ${axiosErr.response.data.message}`;
          } else {
            errorMessage = `Pagination HTTP ${axiosErr.response.status}: ${axiosErr.response.statusText}`;
          }
        } else if ('message' in err) {
          const errWithMessage = err as { message: string };
          errorMessage = `Pagination failed: ${errWithMessage.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (partId: string) => {
    console.log('Card clicked:', partId);
    // Navigate to part details or perform other action
  };

  const handleCardShare = (manufacturerId: string, manufacturerPartId: string) => {
    console.log('Share part:', manufacturerId, manufacturerPartId);
    // Implement share functionality
  };

  const handleCardMore = (manufacturerId: string, manufacturerPartId: string) => {
    console.log('More actions for part:', manufacturerId, manufacturerPartId);
    // Implement more actions
  };

  const handleRegisterClick = (manufacturerId: string, manufacturerPartId: string) => {
    console.log('Register part:', manufacturerId, manufacturerPartId);
    // Implement registration functionality
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Compact Header - shown when search results are displayed */}
      {hasSearched && (
        <Box 
          sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            py: 2,
            px: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}
        >
          <Grid2 container alignItems="center" justifyContent="space-between">
            <Grid2 size={3}>
              <Button
                variant="outlined"
                onClick={handleGoBack}
                startIcon={<ArrowBackIcon />}
                size="small"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderColor: 'primary.main'
                  }
                }}
              >
                New Search
              </Button>
            </Grid2>
            <Grid2 size={6}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: '600', 
                  color: 'primary.main',
                  textAlign: 'center'
                }}
              >
                Dataspace Discovery
              </Typography>
            </Grid2>
            <Grid2 size={3}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                minHeight: '32px'
              }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: '500', color: 'primary.main', fontSize: '0.875rem' }}>
                    {getCompanyName(bpnl)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                    {bpnl}
                  </Typography>
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      )}

      {/* Main Content Container */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        {/* Search Mode Toggle and Sidebar Toggle */}
        {!hasSearched && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: '80px',
              right: '20px',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '8px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Sidebar Toggle - only show in discovery mode */}
            {searchMode === 'discovery' && (
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  size="small"
                  sx={{
                    color: '#1976d2',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {sidebarVisible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: '500', 
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(2px)'
                    }
                  }}
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                >
                  {sidebarVisible ? 'Hide' : 'Show'} Filters
                </Typography>
              </Box>
            )}

            {/* Mode Toggle */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: '500', 
                  color: searchMode === 'discovery' ? '#1976d2' : '#666',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
                onClick={() => setSearchMode('discovery')}
              >
              Discovery Mode
            </Typography>
            <Box
              sx={{
                width: '40px',
                height: '20px',
                backgroundColor: searchMode === 'single' ? '#1976d2' : '#ddd',
                borderRadius: '10px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSearchMode(searchMode === 'discovery' ? 'single' : 'discovery')}
            >
              <Box
                sx={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: searchMode === 'single' ? '22px' : '2px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: '500', 
                color: searchMode === 'single' ? '#1976d2' : '#666',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
              onClick={() => setSearchMode('single')}
            >
              Single Twin
            </Typography>
            </Box>
          </Box>
        )}

        <Grid2 container direction="row" sx={{ 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Sidebar - animated hide/show */}
          {!hasSearched && searchMode === 'discovery' && (
            <Grid2 
              size={sidebarVisible ? { lg: 2, md: 4, sm: 12 } : 0}
              padding={0}
              className="parts-discovery-sidebar"
              sx={{
                background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
                minHeight: '100vh',
                borderRight: sidebarVisible ? '1px solid rgba(59, 130, 246, 0.2)' : 'none',
                boxShadow: sidebarVisible ? '4px 0 16px rgba(30, 58, 138, 0.1)' : 'none',
                width: sidebarVisible ? 'auto' : '0px',
                minWidth: sidebarVisible ? 'auto' : '0px',
                maxWidth: sidebarVisible ? 'auto' : '0px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: sidebarVisible ? 1 : 0,
                transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
                // Ensure it takes no space when hidden
                flexBasis: sidebarVisible ? 'auto' : '0px !important',
                flexShrink: sidebarVisible ? 0 : 1,
                flexGrow: 0
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: '600', 
                    color: 'white',
                    mb: 2,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    pb: 1
                  }}
                >
                  Digital Twin Type
                </Typography>
                <RadioGroup 
                  value={partType} 
                  onChange={handlePartTypeChange}
                  sx={{
                    '& .MuiFormControlLabel-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      margin: '4px 0',
                      borderRadius: 2,
                      padding: '8px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      transition: 'all 0.2s ease',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      }
                    },
                    '& .MuiFormControlLabel-label': {
                      fontWeight: '400',
                      fontSize: '0.875rem',
                      color: 'white'
                    },
                    '& .MuiRadio-root': {
                      color: 'rgba(255, 255, 255, 0.6)',
                      padding: '6px',
                      '&.Mui-checked': {
                        color: '#60a5fa'
                      }
                    },
                    '& .Mui-checked + .MuiFormControlLabel-label': {
                      fontWeight: '500',
                      color: '#bfdbfe'
                    }
                  }}
                >
                  <FormControlLabel value="Part" control={<Radio />} label="Part Type (Catalog)" />
                  <FormControlLabel value="Serialized" control={<Radio />} label="Part Instance (Serialized)" />
                </RadioGroup>
              </Box>
                
              <Box sx={{ p: 2 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: '600', 
                    color: 'white',
                    mb: 2,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    pb: 1
                  }}
                >
                  Results per Page
                </Typography>
                <FormControl 
                  fullWidth 
                  size="small" 
                  sx={{ 
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '0.875rem',
                      '& input::placeholder': {
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: '#60a5fa'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.875rem',
                      '&.Mui-focused': {
                        color: '#bfdbfe'
                      }
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  <InputLabel>Results per Page</InputLabel>
                  <Select
                    value={isCustomLimit ? 'custom' : pageLimit}
                    label="Results per Page"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'custom') {
                        setIsCustomLimit(true);
                        setPageLimit(parseInt(customLimit) || 10);
                      } else {
                        setIsCustomLimit(false);
                        setPageLimit(value as number);
                      }
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                    <MenuItem value={0}>No Limit</MenuItem>
                  </Select>
                </FormControl>

                {isCustomLimit && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Limit"
                      placeholder="Enter number of results per page"
                      type="number"
                      value={customLimit}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomLimit(value);
                        if (value && !isNaN(parseInt(value)) && parseInt(value) > 0) {
                          setPageLimit(parseInt(value));
                        }
                      }}
                      inputProps={{
                        min: 1,
                        max: 1000
                      }}
                      helperText={
                        customLimit && (isNaN(parseInt(customLimit)) || parseInt(customLimit) < 1 || parseInt(customLimit) > 1000)
                          ? "Please enter a valid number between 1 and 1000"
                          : "Enter a number between 1 and 1000"
                      }
                      error={customLimit !== '' && (isNaN(parseInt(customLimit)) || parseInt(customLimit) < 1 || parseInt(customLimit) > 1000)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          '& input::placeholder': {
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)'
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderColor: '#60a5fa'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.875rem',
                          '&.Mui-focused': {
                            color: '#bfdbfe'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                    
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ width: '100%', mb: 0.5, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', fontSize: '0.7rem' }}>
                        Quick select:
                      </Typography>
                      {[25, 75, 150, 200, 500].map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          onClick={() => {
                            setCustomLimit(value.toString());
                            setPageLimit(value);
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            fontSize: '0.7rem',
                            height: '24px',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderColor: '#60a5fa'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: '600', 
                      color: 'white',
                      mb: 2,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                      pb: 1
                    }}
                  >
                    Advanced Options
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Part ID (Optional)"
                    placeholder="Enter Customer Part ID"
                    value={customerPartId}
                    onChange={(e) => setCustomerPartId(e.target.value)}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& input::placeholder': {
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: '#60a5fa'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: '#bfdbfe'
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem'
                      }
                    }}
                    helperText="Search by specific Customer Part identifier"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Manufacturer Part ID (Optional)"
                    placeholder="Enter Manufacturer Part ID"
                    value={manufacturerPartId}
                    onChange={(e) => setManufacturerPartId(e.target.value)}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& input::placeholder': {
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: '#60a5fa'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: '#bfdbfe'
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem'
                      }
                    }}
                    helperText="Search by specific Manufacturer Part identifier"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="AAS-ID (Optional)"
                    placeholder="Enter Asset Administration Shell ID"
                    value={globalAssetId}
                    onChange={(e) => setGlobalAssetId(e.target.value)}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '& input::placeholder': {
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          borderColor: '#60a5fa'
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.875rem',
                        '&.Mui-focused': {
                          color: '#bfdbfe'
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem'
                      }
                    }}
                    helperText="Specific Asset Administration Shell identifier"
                  />
                  
                  {/* Part Instance ID - Only shown when Part Instance is selected */}
                  {partType === 'Serialized' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Part Instance ID (Optional)"
                      placeholder="Enter Part Instance identifier"
                      value={partInstanceId}
                      onChange={(e) => setPartInstanceId(e.target.value)}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          '& input::placeholder': {
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.5)'
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            borderColor: 'rgba(255, 255, 255, 0.3)'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderColor: '#60a5fa'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.875rem',
                          '&.Mui-focused': {
                            color: '#bfdbfe'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem'
                        }
                      }}
                      helperText="Search by specific Part Instance identifier"
                    />
                  )}
              </Box>
            </Grid2>
          )}

          {/* Main Content */}
          <Grid2 
            size={
              hasSearched 
                ? 12 
                : (searchMode === 'discovery' 
                    ? (sidebarVisible ? { lg: 10, md: 8, sm: 12 } : 12)
                    : 12
                  )
            }
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: hasSearched ? 'flex-start' : 'center',
              alignItems: 'center',
              minHeight: hasSearched ? 'auto' : '100vh',
              p: hasSearched ? 3 : 4,
              pt: searchMode === 'single' && !hasSearched ? 4 : (hasSearched ? 3 : 4),
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              // Ensure proper positioning when sidebar is hidden
              ...(searchMode === 'discovery' && !sidebarVisible && !hasSearched && {
                pl: 4,
                pr: 4
              })
            }}
          >
            {/* Centered Welcome Screen - only shown when no search has been performed and in discovery mode */}
            {!hasSearched && searchMode === 'discovery' && (
              <Box 
                sx={{ 
                  textAlign: 'center',
                  maxWidth: '700px',
                  width: '100%',
                  transform: 'translateY(-8vh)' // Slightly above center
                }}
              >
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: '700', 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Dataspace Discovery
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#5f6368',
                    mb: 6,
                    fontWeight: '400',
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    lineHeight: 1.6,
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Discover and explore digital twin parts in the Catena-X network
                </Typography>

                {/* Centered Search Card */}
                <Card 
                  sx={{ 
                    p: 5,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 25px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 25px 70px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={4}>
                    <Autocomplete
                      freeSolo
                      options={availablePartners}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return `${option.name} - ${option.bpnl}`;
                      }}
                      value={bpnl}
                      onChange={(_, newValue) => {
                        if (typeof newValue === 'string') {
                          // Custom BPNL entered
                          setBpnl(newValue);
                          setSelectedPartner(null);
                        } else if (newValue) {
                          // Partner selected from dropdown
                          setBpnl(newValue.bpnl);
                          setSelectedPartner(newValue);
                        } else {
                          // Cleared
                          setBpnl('');
                          setSelectedPartner(null);
                        }
                      }}
                      onInputChange={(_, newInputValue) => {
                        setBpnl(newInputValue);
                        if (!availablePartners.find(p => p.bpnl === newInputValue)) {
                          setSelectedPartner(null);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Partner BPNL *"
                          placeholder="Select partner or enter custom BPNL (e.g., BPNL0000000093Q7)"
                          variant="outlined"
                          error={!!error && !bpnl.trim()}
                          helperText={
                            !!error && !bpnl.trim() 
                              ? 'BPNL is required' 
                              : 'Select from available partners or enter a custom Business Partner Number Legal Entity'
                          }
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isLoadingPartners ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                  <InputAdornment position="end">
                                    <IconButton onClick={handleSearch} disabled={isLoading}>
                                      <SearchIcon />
                                    </IconButton>
                                  </InputAdornment>
                                </>
                              ),
                            },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              fontSize: '1.1rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)'
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.bpnl}
                          </Typography>
                        </Box>
                      )}
                      loading={isLoadingPartners}
                      loadingText="Loading partners..."
                      noOptionsText="No partners found. You can still enter a custom BPNL."
                      sx={{ width: '100%' }}
                    />
                    
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleSearch}
                      disabled={isLoading || !bpnl.trim()}
                      startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'none',
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0 30%, #2196f3 90%)',
                          boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          background: '#e0e0e0',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {isLoading ? 'Searching...' : 'Start Discovery'}
                    </Button>
                  </Box>
                </Card>
              </Box>
            )}

            {/* Single Twin Search Screen - only shown when no search has been performed and in single mode */}
            {!hasSearched && searchMode === 'single' && (
              <Box 
                sx={{ 
                  textAlign: 'center',
                  maxWidth: '700px',
                  width: '100%',
                  mx: 'auto',
                  transform: 'translateY(-8vh)' // Slightly above center to match discovery mode
                }}
              >
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: '700', 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Single Digital Twin
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#5f6368',
                    mb: 6,
                    fontWeight: '400',
                    fontSize: { xs: '1.1rem', md: '1.3rem' },
                    lineHeight: 1.6,
                    maxWidth: '600px',
                    mx: 'auto'
                  }}
                >
                  Search for a specific digital twin by providing its Asset Administration Shell (AAS) ID
                </Typography>

                {/* Centered Search Card */}
                <Card 
                  sx={{ 
                    p: 5,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 25px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 25px 70px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <Box display="flex" flexDirection="column" gap={4}>
                    <Autocomplete
                      freeSolo
                      options={availablePartners}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return `${option.name} - ${option.bpnl}`;
                      }}
                      value={bpnl}
                      onChange={(_, newValue) => {
                        if (typeof newValue === 'string') {
                          // Custom BPNL entered
                          setBpnl(newValue);
                          setSelectedPartner(null);
                        } else if (newValue) {
                          // Partner selected from dropdown
                          setBpnl(newValue.bpnl);
                          setSelectedPartner(newValue);
                        } else {
                          // Cleared
                          setBpnl('');
                          setSelectedPartner(null);
                        }
                      }}
                      onInputChange={(_, newInputValue) => {
                        setBpnl(newInputValue);
                        if (!availablePartners.find(p => p.bpnl === newInputValue)) {
                          setSelectedPartner(null);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Partner BPNL *"
                          placeholder="Select partner or enter custom BPNL (e.g., BPNL0000000093Q7)"
                          variant="outlined"
                          error={!!error && !bpnl.trim()}
                          helperText={
                            !!error && !bpnl.trim() 
                              ? 'BPNL is required' 
                              : 'Select from available partners or enter a custom Business Partner Number Legal Entity'
                          }
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isLoadingPartners ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              fontSize: '1.1rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)'
                              },
                              '&.Mui-focused': {
                                backgroundColor: 'white'
                              }
                            },
                            '& .MuiInputLabel-root': {
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.bpnl}
                          </Typography>
                        </Box>
                      )}
                      loading={isLoadingPartners}
                      loadingText="Loading partners..."
                      noOptionsText="No partners found. You can still enter a custom BPNL."
                      sx={{ width: '100%' }}
                    />

                    {/* AAS ID Field */}
                    <TextField
                      fullWidth
                      label="Asset Administration Shell ID *"
                      placeholder="Enter AAS ID (e.g., urn:uuid:35bb3960-70f8-4ff4-bd9f-0670f3beb39d)"
                      variant="outlined"
                      value={singleTwinAasId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSingleTwinAasId(e.target.value)}
                      error={!!error && !singleTwinAasId.trim()}
                      helperText={
                        !!error && !singleTwinAasId.trim() 
                          ? 'AAS ID is required' 
                          : 'Enter the unique identifier for the Asset Administration Shell'
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: '1.1rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1.1rem'
                        }
                      }}
                    />

                    
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleSingleTwinSearch}
                      disabled={isLoading || !bpnl.trim() || !singleTwinAasId.trim()}
                      startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
                      sx={{
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textTransform: 'none',
                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0 30%, #2196f3 90%)',
                          boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          background: '#e0e0e0',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {isLoading ? 'Searching...' : 'Search Digital Twin'}
                    </Button>
                  </Box>
                </Card>
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Box display="flex" justifyContent="center" mb={3} sx={{ width: '100%' }}>
                <Alert severity="error" onClose={() => setError(null)} sx={{ maxWidth: '600px' }}>
                  {error}
                </Alert>
              </Box>
            )}

            {/* Results Section - shown when search has been performed */}
            {hasSearched && (
              <Box sx={{ width: '100%' }}>
                {/* Results Summary - always shown when there's a response */}
                {currentResponse && (
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ px: 2 }}>
                    {/* Left Side - Part Type Indicator + Active Filters */}
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1.5} 
                      flexWrap="wrap"
                    >
                      {/* Part Type - Always shown */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 2,
                          py: 0.5,
                          borderRadius: '16px',
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: '600', 
                            color: '#4caf50', 
                            fontSize: '0.75rem',
                            letterSpacing: '0.02em'
                          }}
                        >
                          {partType === 'Part' ? 'Catalog Parts' : 'Part Instances'}
                        </Typography>
                      </Box>

                      {/* Active Filters - Only shown when there are filters */}
                      {getActiveFilterChips().length > 0 && (
                        <>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: '600', 
                              color: '#666', 
                              fontSize: '0.75rem',
                              letterSpacing: '0.02em'
                            }}
                          >
                            Active Filters:
                          </Typography>
                          {getActiveFilterChips()}
                        </>
                      )}
                    </Box>

                    {/* Results Count - Right Side - Generic number */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 2,
                        py: 0.5,
                        borderRadius: '16px',
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: '600', 
                          color: '#1976d2', 
                          fontSize: '0.8rem',
                          letterSpacing: '0.02em'
                        }}
                      >
                        {currentResponse.shellsFound}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Remove the duplicate simple results count section since we now handle both cases above */}

                {/* Results Display */}
                <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
                  {partType === 'Serialized' ? (
                    <>
                      {serializedParts.length > 0 ? (
                        <SerializedPartsTable parts={serializedParts} />
                      ) : !isLoading && currentResponse ? (
                        <Box textAlign="center" py={4}>
                          <Typography color="textSecondary">No serialized parts found</Typography>
                        </Box>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {partTypeCards.length > 0 ? (
                        <CatalogPartsDiscovery
                          onClick={handleCardClick}
                          onShare={handleCardShare}
                          onMore={handleCardMore}
                          onRegisterClick={handleRegisterClick}
                          items={partTypeCards.map(card => ({
                            id: card.id,
                            manufacturerId: card.manufacturerId,
                            manufacturerPartId: card.manufacturerPartId,
                            name: card.name,
                            category: card.category
                          }))}
                          isLoading={isLoading}
                        />
                      ) : !isLoading && currentResponse ? (
                        <Box textAlign="center" py={4}>
                          <Typography color="textSecondary">No catalog parts found</Typography>
                        </Box>
                      ) : null}
                    </>
                  )}
                </Box>

                {/* Pagination */}
                {currentResponse && !isLoading && pageLimit > 0 && (
                  <Box display="flex" justifyContent="center" alignItems="center" gap={2} mt={4} mb={3}>
                    {paginator?.hasPrevious() && (
                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange({} as React.ChangeEvent<unknown>, currentPage - 1)}
                        disabled={isLoading}
                        startIcon={<ArrowBackIcon />}
                        size="small"
                        sx={{ 
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white'
                          }
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={0.5}
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        backgroundColor: 'background.paper'
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: '500', fontSize: '0.8rem' }}>
                        Page {currentPage}
                      </Typography>
                      {totalPages > 1 && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          of {totalPages}
                        </Typography>
                      )}
                    </Box>
                    
                    {paginator?.hasNext() && (
                      <Button
                        variant="contained"
                        onClick={() => handlePageChange({} as React.ChangeEvent<unknown>, currentPage + 1)}
                        disabled={isLoading}
                        endIcon={<ArrowForwardIcon />}
                        size="small"
                        sx={{ 
                          backgroundColor: 'primary.main',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'primary.dark'
                          },
                          '&:disabled': {
                            backgroundColor: 'action.disabled'
                          }
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
};

// Component for displaying serialized parts in a table
const SerializedPartsTable = ({ parts }: { parts: SerializedPartData[] }) => {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Global Asset ID
            </th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Manufacturer ID
            </th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Manufacturer Part ID
            </th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Customer Part ID
            </th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Digital Twin Type
            </th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              Submodels
            </th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontSize: '12px' }}>
                {part.globalAssetId}
              </td>
              <td style={{ padding: '12px' }}>
                {part.manufacturerId}
              </td>
              <td style={{ padding: '12px' }}>
                {part.manufacturerPartId}
              </td>
              <td style={{ padding: '12px' }}>
                {part.customerPartId || '-'}
              </td>
              <td style={{ padding: '12px' }}>
                <Chip 
                  label={part.digitalTwinType} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </td>
              <td style={{ padding: '12px' }}>
                <Chip 
                  label={part.submodelCount} 
                  size="small" 
                  color="secondary" 
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default PartsDiscovery;
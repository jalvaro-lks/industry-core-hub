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

import { useState } from 'react';
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
  CardContent,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CatalogPartsDiscovery } from '../features/part-discovery/components/catalog-parts/CatalogPartsDiscovery';
import { 
  discoverPartTypeShells, 
  discoverPartInstanceShells,
  discoverShellsByCustomerPartId,
  ShellDiscoveryPaginator 
} from '../features/part-discovery/api';
import { 
  ShellDiscoveryResponse, 
  AASData,
  getAASDataSummary
} from '../features/part-discovery/utils';

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
  const [aasId, setAasId] = useState('');
  const [customerPartId, setCustomerPartId] = useState('');
  const [manufacturerPartId, setManufacturerPartId] = useState('');
  const [pageLimit, setPageLimit] = useState<number>(10);
  const [customLimit, setCustomLimit] = useState<string>('');
  const [isCustomLimit, setIsCustomLimit] = useState<boolean>(false);
  
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
      
      // Priority search: Customer Part ID > Manufacturer Part ID > Digital Twin Type
      if (customerPartId.trim()) {
        response = await discoverShellsByCustomerPartId(bpnl, customerPartId.trim(), limit);
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

      setCurrentPage(response.pagination.page);
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
      setError('Error searching for parts. Please try again.');
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
        setCurrentResponse(newResponse);
        setCurrentPage(newResponse.pagination.page);

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
      setError('Error loading page. Please try again.');
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
            <Grid2>
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
            <Grid2>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: '600', 
                  color: 'primary.main',
                  textAlign: 'center'
                }}
              >
                Parts Discovery
              </Typography>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={partType === 'Part' ? 'Catalog Parts' : 'Serialized Parts'} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
                <Typography variant="body2" color="textSecondary">
                  BPNL: {bpnl}
                </Typography>
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      )}

      {/* Main Content Container */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        <Grid2 container direction="row" sx={{ flex: 1 }}>
          {/* Sidebar - only shown when no search has been performed */}
          {!hasSearched && (
            <Grid2 size={{ lg: 2, md: 4, sm: 12 }} padding={4} className="parts-discovery-sidebar">
              <Typography variant="subtitle1" gutterBottom>Part Type</Typography>
              <RadioGroup value={partType} onChange={(e) => setPartType(e.target.value)}>
                <FormControlLabel value="Part" control={<Radio />} label="Part Type (Catalog)" />
                <FormControlLabel value="Serialized" control={<Radio />} label="Serialized Parts" />
              </RadioGroup>

              <Box mt={4}>
                <Typography variant="subtitle1" gutterBottom>Results per Page</Typography>
                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
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
                    />
                    
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ width: '100%', mb: 0.5 }}>
                        Quick select:
                      </Typography>
                      {[25, 75, 150, 200, 500].map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setCustomLimit(value.toString());
                            setPageLimit(value);
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>Advanced Options</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Part ID (Optional)"
                    placeholder="Enter Customer Part ID"
                    value={customerPartId}
                    onChange={(e) => setCustomerPartId(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Search by specific Customer Part identifier"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Manufacturer Part ID (Optional)"
                    placeholder="Enter Manufacturer Part ID"
                    value={manufacturerPartId}
                    onChange={(e) => setManufacturerPartId(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Search by specific Manufacturer Part identifier"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="AAS-ID (Optional)"
                    placeholder="Enter Asset Administration Shell ID"
                    value={aasId}
                    onChange={(e) => setAasId(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="Specific Asset Administration Shell identifier"
                  />
                </Box>
              </Box>
            </Grid2>
          )}

          {/* Main Content */}
          <Grid2 
            size={hasSearched ? 12 : { lg: 10, md: 8, sm: 12 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: hasSearched ? 'flex-start' : 'center',
              alignItems: 'center',
              minHeight: hasSearched ? 'auto' : '100vh',
              p: hasSearched ? 3 : 4
            }}
          >
            {/* Centered Welcome Screen - only shown when no search has been performed */}
            {!hasSearched && (
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
                  Parts Discovery
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
                    <TextField
                      fullWidth
                      label="Partner BPNL *"
                      placeholder="Enter partner BPNL (e.g., BPNL0000000093Q7)"
                      variant="outlined"
                      value={bpnl}
                      onChange={(e) => setBpnl(e.target.value)}
                      error={!!error && !bpnl.trim()}
                      helperText={!!error && !bpnl.trim() ? 'BPNL is required' : 'Business Partner Number Legal Entity'}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={handleSearch} disabled={isLoading}>
                                <SearchIcon />
                              </IconButton>
                            </InputAdornment>
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
                {/* Results Summary */}
                {currentResponse && (
                  <Box display="flex" justifyContent="center" mb={3}>
                    <Card sx={{ 
                      maxWidth: '800px', 
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <CardContent sx={{ py: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                          <Typography variant="h6" sx={{ fontWeight: '600', color: '#1976d2' }}>
                            Found {currentResponse.shellsFound} {partType === 'Part' ? 'catalog parts' : 'serialized parts'}
                          </Typography>
                          <Box display="flex" gap={1}>
                            <Chip 
                              label={`Page ${currentPage}`} 
                              size="medium" 
                              color="primary" 
                              variant="filled"
                              sx={{ fontWeight: '600' }}
                            />
                            <Chip 
                              label={`${currentResponse.shellDescriptors.length} shown`} 
                              size="medium" 
                              color="secondary" 
                              variant="outlined"
                              sx={{ fontWeight: '600' }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}

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
                  <Box display="flex" justifyContent="center" alignItems="center" gap={3} mt={6} mb={4}>
                    {paginator?.hasPrevious() && (
                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange({} as React.ChangeEvent<unknown>, currentPage - 1)}
                        disabled={isLoading}
                        startIcon={<ArrowBackIcon />}
                        sx={{ 
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          px: 3,
                          py: 1.5,
                          fontWeight: '600',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)'
                          }
                        }}
                      >
                        Previous
                      </Button>
                    )}
                    
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={1}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        px: 4,
                        py: 2,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.2)'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        Page {currentPage}
                      </Typography>
                      {totalPages > 1 && (
                        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
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
                        sx={{ 
                          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                          borderRadius: 3,
                          px: 3,
                          py: 1.5,
                          fontWeight: '600',
                          boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1565c0 30%, #2196f3 90%)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)'
                          },
                          '&:disabled': {
                            background: '#e0e0e0',
                            boxShadow: 'none'
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
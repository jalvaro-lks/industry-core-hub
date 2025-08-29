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
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Backdrop,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';

// Feature imports
import {
  PaginationControls,
  SearchModeToggle,
  PartnerSearch,
  SingleTwinSearch,
  SearchHeader,
  FilterChips,
  PartsDiscoverySidebar,
  usePartsDiscoverySearch,
  PartType,
  SearchFilters,
  PartCard,
  SerializedPart
} from './index';

// Import catalog parts components (these need to stay)
import CatalogPartsDiscovery from './components/catalog-parts/CatalogPartsDiscovery';

const PartsDiscovery: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [searchMode, setSearchMode] = useState<'partner' | 'single'>('partner');
  const [isFiltersOpen, setIsFiltersOpen] = useState(!isMobile);
  const [selectedPartType, setSelectedPartType] = useState<PartType>('asBuilt');
  const [searchResults, setSearchResults] = useState<PartCard[]>([]);
  const [serializedParts, setSerializedParts] = useState<SerializedPart[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // Pagination states
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Use the custom hook for search logic
  const {
    handleSearch,
    handleFilterChange,
    resetFilters,
    currentPage,
    hasMoreNext,
    hasMorePrevious,
    handlePageChange,
    paginator
  } = usePartsDiscoverySearch({
    partType: selectedPartType,
    onSearchStart: () => setIsLoading(true),
    onSearchComplete: (results, serialized, count, time) => {
      setSearchResults(results);
      setSerializedParts(serialized);
      setTotalCount(count);
      setSearchTime(time);
      setIsLoading(false);
      setError(null);
    },
    onSearchError: (errorMessage) => {
      setError(errorMessage);
      setIsLoading(false);
    }
  });

  // Handle sidebar toggle
  const handleToggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  // Handle pagination with loading states
  const handleNextPage = async () => {
    setIsLoadingNext(true);
    try {
      await handlePageChange(currentPage + 1);
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handlePreviousPage = async () => {
    setIsLoadingPrevious(true);
    try {
      await handlePageChange(currentPage - 1);
    } finally {
      setIsLoadingPrevious(false);
    }
  };

  // Handle search mode change
  const handleSearchModeChange = (mode: 'partner' | 'single') => {
    setSearchMode(mode);
    // Clear results when switching modes
    setSearchResults([]);
    setSerializedParts([]);
    setTotalCount(0);
    setSearchTime(null);
    setError(null);
    resetFilters();
  };

  // Handle part type change
  const handlePartTypeChange = (partType: PartType) => {
    setSelectedPartType(partType);
    // Clear results when switching part types
    setSearchResults([]);
    setSerializedParts([]);
    setTotalCount(0);
    setSearchTime(null);
    setError(null);
    resetFilters();
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Handle filter updates
  const onFilterChange = (newFilters: SearchFilters) => {
    setSearchFilters(newFilters);
    handleFilterChange(newFilters);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={isFiltersOpen}
        onClose={handleToggleFilters}
        sx={{
          width: isFiltersOpen ? 300 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%'
          }
        }}
      >
        <PartsDiscoverySidebar
          partType={selectedPartType}
          searchMode={searchMode}
          filters={searchFilters}
          onFiltersChange={onFilterChange}
          onPartTypeChange={handlePartTypeChange}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : (isFiltersOpen ? 0 : '-300px'),
        }}
      >
        {/* Search Mode Toggle */}
        <SearchModeToggle
          currentMode={searchMode}
          onModeChange={handleSearchModeChange}
          isVisible={true}
          onDisplayFilters={() => setIsFiltersOpen(true)}
          onHideFilters={() => setIsFiltersOpen(false)}
        />

        <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
          {/* Search Header */}
          <SearchHeader
            searchMode={searchMode}
            partType={selectedPartType}
            onSearch={handleSearch}
            isLoading={isLoading}
            totalResults={totalCount}
            searchTime={searchTime}
          />

          {/* Search Components */}
          {searchMode === 'partner' && (
            <PartnerSearch
              onSearch={handleSearch}
              isLoading={isLoading}
              partType={selectedPartType}
            />
          )}

          {searchMode === 'single' && (
            <SingleTwinSearch
              onSearch={handleSearch}
              isLoading={isLoading}
              partType={selectedPartType}
            />
          )}

          {/* Filter Chips */}
          {Object.keys(searchFilters).length > 0 && (
            <FilterChips
              filters={searchFilters}
              partType={selectedPartType}
            />
          )}

          {/* Error Display */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          )}

          {/* Results Section */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {searchResults.length > 0 && (
              <Grid2 container spacing={2} sx={{ mb: 2 }}>
                <Grid2 xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Search Results ({totalCount} found{searchTime ? ` in ${searchTime}s` : ''})
                  </Typography>
                </Grid2>
              </Grid2>
            )}

            {/* Catalog Parts Discovery Component */}
            {searchResults.length > 0 && (
              <CatalogPartsDiscovery
                cards={searchResults}
                serializedParts={serializedParts}
                partType={selectedPartType}
              />
            )}

            {/* Empty State */}
            {!isLoading && searchResults.length === 0 && !error && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '60%',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h5" color="textSecondary" gutterBottom>
                  {searchMode === 'partner' ? 'Search for parts by partner' : 'Search for a specific part'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {searchMode === 'partner' 
                    ? 'Select a business partner and configure filters to discover parts'
                    : 'Enter a specific twin ID to find detailed part information'
                  }
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {(searchResults.length > 0 || currentPage > 1) && (
              <PaginationControls
                currentPage={currentPage}
                totalCount={totalCount}
                hasMoreNext={hasMoreNext}
                hasMorePrevious={hasMorePrevious}
                onNext={handleNextPage}
                onPrevious={handlePreviousPage}
                isLoadingNext={isLoadingNext}
                isLoadingPrevious={isLoadingPrevious}
                isLoading={isLoading}
                paginator={paginator}
                pageLimit={20} // or get this from filters
                onPageChange={handlePageChange}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress color="inherit" />
          <Typography variant="body2" sx={{ mt: 2 }}>
            {searchMode === 'partner' ? 'Searching partner catalog...' : 'Fetching part details...'}
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default PartsDiscovery;

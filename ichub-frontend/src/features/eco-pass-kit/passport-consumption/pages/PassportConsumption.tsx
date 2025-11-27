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
  TextField,
  Button,
  Paper,
  Container,
  Card,
  CardContent,
  Grid2,
  Alert
} from '@mui/material';
import { QrCodeScanner, Search } from '@mui/icons-material';

const PassportConsumption: React.FC = () => {
  const [passportId, setPassportId] = useState('');
  const [searchInitiated, setSearchInitiated] = useState(false);

  const handleSearch = () => {
    if (passportId.trim()) {
      setSearchInitiated(true);
    }
  };

  const handleQRScan = () => {
    // TODO: Implement QR code scanner
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, color: '#ffffff', fontWeight: 600 }}>
          Passport Consumption & Visualization
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Retrieve and display digital product passports from dataspace participants via QR code or ID.
        </Typography>
      </Box>

      <Grid2 container spacing={3}>
        {/* Search Section */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              backgroundColor: 'rgba(0, 42, 126, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
                Search by Passport ID
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Passport ID"
                  variant="outlined"
                  value={passportId}
                  onChange={(e) => setPassportId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#42a5f5'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<Search />}
                  sx={{
                    backgroundColor: '#42a5f5',
                    '&:hover': {
                      backgroundColor: '#1976d2'
                    }
                  }}
                >
                  Search
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* QR Code Scanner Section */}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              backgroundColor: 'rgba(0, 42, 126, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
                Scan QR Code
              </Typography>
              
              <Button
                variant="outlined"
                fullWidth
                onClick={handleQRScan}
                startIcon={<QrCodeScanner />}
                sx={{
                  py: 2,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  '&:hover': {
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)'
                  }
                }}
              >
                Open QR Scanner
              </Button>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Results Section */}
      {searchInitiated && (
        <Box sx={{ mt: 4 }}>
          <Paper
            sx={{
              p: 4,
              backgroundColor: 'rgba(0, 42, 126, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Alert severity="info" sx={{ mb: 3 }}>
              Passport retrieval functionality is under development. This feature will connect to the dataspace to retrieve and display digital product passports.
            </Alert>
            
            <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
              Passport Details
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Searched ID: {passportId}
            </Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default PassportConsumption;

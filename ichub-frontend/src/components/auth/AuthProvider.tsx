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

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import authService from '../../services/AuthService';
import environmentService from '../../services/EnvironmentService';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Component that initializes authentication and provides auth context to the entire app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🏁 AuthProvider: Starting authentication initialization...');
        
        // Check if authentication is enabled
        console.log('🔍 AuthProvider: Checking if auth is enabled...');
        const authEnabled = environmentService.isAuthEnabled();
        console.log('🔍 AuthProvider: Auth enabled =', authEnabled);
        
        if (!authEnabled) {
          console.log('❌ AuthProvider: Authentication is disabled, skipping initialization');
          setIsInitialized(true);
          return;
        }

        console.log('✅ AuthProvider: Authentication is enabled, initializing AuthService...');
        console.log('🔍 AuthProvider: Keycloak config:', {
          enabled: environmentService.isKeycloakEnabled(),
          url: environmentService.getKeycloakUrl(),
          realm: environmentService.getKeycloakRealm(),
          clientId: environmentService.getKeycloakClientId()
        });

        console.log('🔄 AuthProvider: Calling authService.initialize()...');
        await authService.initialize();
        console.log('✅ AuthProvider: Authentication initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ AuthProvider: Failed to initialize authentication:', error);
        setInitError(error instanceof Error ? error.message : 'Authentication initialization failed');
        setIsInitialized(true); // Still mark as initialized to prevent infinite loading
      }
    };

    console.log('🚀 AuthProvider: useEffect triggered, calling initializeAuth...');
    initializeAuth();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={3}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <CircularProgress size={80} sx={{ color: 'white' }} />
        <Typography variant="h4" fontWeight="bold">
          Industry Core Hub
        </Typography>
        <Typography variant="h6">
          Initializing authentication...
        </Typography>
      </Box>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={3}
        sx={{ 
          background: 'linear-gradient(135deg, #ff7b7b 0%, #d63031 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Authentication Error
        </Typography>
        <Typography variant="h6" textAlign="center" maxWidth="600px">
          {initError}
        </Typography>
        <Typography variant="body1" textAlign="center" maxWidth="600px">
          Please check your Keycloak configuration and try refreshing the page.
        </Typography>
      </Box>
    );
  }

  // Authentication initialized successfully, render the app
  return <>{children}</>;
}

export default AuthProvider;
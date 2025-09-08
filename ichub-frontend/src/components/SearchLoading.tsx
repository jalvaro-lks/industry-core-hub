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

import { Box, Typography, LinearProgress, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CloudIcon from '@mui/icons-material/Cloud';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SearchLoadingProps {
  currentStep: number;
  currentStatus: string;
  bpnl: string;
  isCompleted?: boolean;
}

const SearchLoading = ({ currentStep, currentStatus, bpnl, isCompleted = false }: SearchLoadingProps) => {
  const steps = [
    { 
      label: 'Looking for known Digital Twin Registries in the Cache', 
      description: 'Checking cached registry information...',
      icon: <StorageIcon />
    },
    { 
      label: 'Searching for Connectors for BPN', 
      description: 'Finding available data connectors...',
      icon: <SearchIcon />
    },
    { 
      label: 'Searching Digital Twin Registries', 
      description: 'Locating digital twin registries...',
      icon: <CloudIcon />
    },
    { 
      label: 'Negotiating Contracts', 
      description: 'Establishing secure connections...',
      icon: <HandshakeIcon />
    },
    { 
      label: 'Looking for Shell Descriptors', 
      description: 'Retrieving shell descriptors...',
      icon: <DescriptionIcon />
    }
  ];  // Calculate progress - force 100% when completed or when currentStep reaches max
  const isSearchCompleted = isCompleted || currentStatus.includes('completed') || currentStep >= steps.length;
  const progressValue = isSearchCompleted ? 100 : (currentStep / steps.length) * 100;

  // Debug logging
  console.log('🔄 SearchLoading render:', {
    isCompleted,
    currentStatus,
    currentStep,
    isSearchCompleted,
    progressValue
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold',
            background: isSearchCompleted 
              ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
              : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            transition: 'all 0.3s ease'
          }}
        >
          {isSearchCompleted ? 'Search Complete!' : 'Searching Digital Twins'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isSearchCompleted 
            ? 'Data has been successfully retrieved and is ready to display'
            : 'This process may take up to 10 seconds while we negotiate contracts and search the dataspace'
          }
        </Typography>
      </Box>

      <LinearProgress 
        variant="determinate" 
        value={progressValue} 
        sx={{ 
          mb: 4, 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          '& .MuiLinearProgress-bar': {
            background: isSearchCompleted 
              ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'  // Green when completed
              : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)', // Blue when loading
            borderRadius: 4,
            transition: 'transform 0.4s ease-in-out' // Smooth transition when progress jumps
          }
        }} 
      />

      <Stepper activeStep={isSearchCompleted ? steps.length : currentStep - 1} orientation="vertical">
        {steps.map((step, index) => {
          const isStepCompleted = isSearchCompleted || index < currentStep;
          const isCurrentStep = !isSearchCompleted && index === currentStep - 1;
          
          return (
            <Step key={index}>
              <StepLabel 
                icon={step.icon}
                sx={{
                  '& .MuiStepIcon-root': {
                    color: isStepCompleted ? '#4caf50' : isCurrentStep ? '#1976d2' : '#e0e0e0',
                    fontSize: '1.5rem'
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: isCurrentStep ? 'bold' : 'normal',
                    color: isCurrentStep ? '#1976d2' : isStepCompleted ? '#4caf50' : 'inherit'
                  }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {currentStatus && (
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            backgroundColor: currentStatus.includes('completed') ? 'rgba(76, 175, 80, 0.1)' : 'rgba(25, 118, 210, 0.1)', 
            borderRadius: 2,
            border: currentStatus.includes('completed') ? '1px solid rgba(76, 175, 80, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          {currentStatus.includes('completed') && (
            <CheckCircleIcon 
              sx={{ 
                color: '#4caf50', 
                fontSize: '1.2rem' 
              }} 
            />
          )}
          <Typography 
            variant="body2" 
            sx={{ 
              color: currentStatus.includes('completed') ? '#4caf50' : '#1976d2',
              fontWeight: 'medium',
              textAlign: 'center'
            }}
          >
            {currentStatus}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchLoading;

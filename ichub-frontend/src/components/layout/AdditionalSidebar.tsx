import React from 'react';
import { Box } from '@mui/material';
import { useAdditionalSidebar } from '../../hooks/useAdditionalSidebar';

const AdditionalSidebar: React.FC = () => {
  const { isVisible, content } = useAdditionalSidebar();

  return (
    <Box
      sx={{
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        height: '100%',
        borderRight: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '4px 0 16px rgba(30, 58, 138, 0.1)',
        width: '320px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease-out',
      }}
    >
      {content}
    </Box>
  );
};

export default AdditionalSidebar;

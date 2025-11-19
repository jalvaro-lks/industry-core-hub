import React, { useState } from 'react';
import { Chip } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';

interface CopyableUrnChipProps {
  urn: string;
  onCopySuccess?: (urn: string) => void;
}


const CopyableUrnChip: React.FC<CopyableUrnChipProps> = ({ urn, onCopySuccess }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(urn);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      if (onCopySuccess) {
        onCopySuccess(urn);
      }
    } catch {}
  };

  return (
    <Chip
      icon={<FingerprintIcon sx={{ color: '#fff', fontSize: 16 }} />}
      label={
        <span
          style={{
            fontWeight: 500,
            fontSize: '12px',
            wordBreak: 'break-all',
            whiteSpace: 'pre-line',
            display: 'inline-block',
            maxWidth: 320,
            lineHeight: 1.3,
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {urn}
        </span>
      }
      variant="outlined"
      size="small"
      onClick={handleCopy}
      sx={{
        mt: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.3)',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 500,
        px: 1.2,
        minHeight: 38,
        cursor: 'pointer',
        '& .MuiChip-icon': {
          color: '#fff',
          fontSize: 16
        },
        '& .MuiChip-label': {
          color: '#fff',
          fontSize: '12px',
          fontWeight: 500,
          px: 1,
          wordBreak: 'break-all',
          whiteSpace: 'pre-line',
          display: 'inline-block',
          maxWidth: 320,
          lineHeight: 1.3,
          paddingTop: '4px',
          paddingBottom: '4px',
        }
      }}
    />
  );
};

export default CopyableUrnChip;
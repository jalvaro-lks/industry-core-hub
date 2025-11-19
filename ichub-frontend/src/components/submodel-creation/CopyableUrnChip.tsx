import React, { useState } from 'react';
import { Chip, Tooltip } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';

interface CopyableUrnChipProps {
  urn: string;
}

const CopyableUrnChip: React.FC<CopyableUrnChipProps> = ({ urn }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(urn);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <Tooltip 
      title={
        <span style={{ display: 'block', maxWidth: 340, wordBreak: 'break-all' }}>
          {copied ? 'Copied!' : 'Click to copy:'}
          <br />
          <span style={{ fontSize: 12, color: '#fff' }}>{urn}</span>
        </span>
      }
      placement="top"
      arrow
    >
      <Chip
        icon={<FingerprintIcon sx={{ color: '#fff', fontSize: 16 }} />}
  label={<span style={{ fontWeight: 500, fontSize: '12px' }}>{urn}</span>}
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
          cursor: 'pointer',
          '& .MuiChip-icon': {
            color: '#fff',
            fontSize: 16
          },
          '& .MuiChip-label': {
            color: '#fff',
            fontSize: '12px',
            fontWeight: 500,
            px: 1
          }
        }}
      />
    </Tooltip>
  );
};

export default CopyableUrnChip;
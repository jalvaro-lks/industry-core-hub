import CopyableUrnChip from './CopyableUrnChip';
import React, { useState, useRef } from 'react';
import { Box, Typography, Chip, Popper, Paper, ClickAwayListener } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';

interface CustomTooltipProps {
  title?: string;
  description?: string;
  urn?: string;
  children: React.ReactElement<any>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ title = 'Description', description, urn, children }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Color azul oscuro del tooltip personalizado
  const shadowColor = '#23272f';
  const shadowSize = 5;

  // Use a wrapper span for event handling
  return (
    <span
      ref={anchorRef}
      style={{ display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          boxShadow: open ? `0 0 0 ${shadowSize}px ${shadowColor}` : 'none',
          borderRadius: '50%',
          transition: 'box-shadow 0.15s',
          boxSizing: 'content-box',
        }}
      >
        {React.cloneElement(children, {
          style: { ...children.props.style, cursor: 'pointer' },
        })}
      </span>
  <Popper open={open} anchorEl={anchorRef.current} placement="top" style={{ zIndex: 1500, marginBottom: shadowSize }} modifiers={[{ name: 'offset', options: { offset: [0, shadowSize] } }]}>
        <ClickAwayListener onClickAway={handleClose}>
          <Paper elevation={4} sx={{ p: 2, minWidth: 180, maxWidth: 260, background: '#23272f', border: '1px solid #333', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5, fontSize: '13px' }}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" sx={{ color: 'text.primary', mb: urn ? 1 : 0, fontSize: '12px' }}>
                {description}
              </Typography>
            )}
            {urn && (
              <CopyableUrnChip urn={urn} />
            )}
          </Paper>
        </ClickAwayListener>
      </Popper>
    </span>
  );
};

export default CustomTooltip;

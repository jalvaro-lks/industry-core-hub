import React from 'react';
import { Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ScrollToTopFabProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const ScrollToTopFab: React.FC<ScrollToTopFabProps> = ({ containerRef }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setVisible(container.scrollTop > 200);
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef]);

  const handleClick = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // The parent container must have position: relative for absolute to work
  return (
    <Zoom in={visible}>
      <Fab
        size="medium"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          right: 32,
          bottom: 32,
          zIndex: 2000,
          backgroundColor: '#111',
          color: '#fff',
          boxShadow: '0 2px 12px 2px rgba(255,255,255,0.18)',
          '&:hover': {
            backgroundColor: '#222',
            boxShadow: '0 4px 16px 4px rgba(255,255,255,0.22)'
          }
        }}
        aria-label="Scroll to top"
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
};

export default ScrollToTopFab;

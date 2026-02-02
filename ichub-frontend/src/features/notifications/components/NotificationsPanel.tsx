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

import React from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { Close, OpenInFull, CloseFullscreen, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import ChatList from './ChatList';
import ChatView from './ChatView';

/**
 * Main notifications panel component
 * Displays as a floating panel on the right side of the screen
 * Can be quarter-width or expanded to take most of the screen
 */
const NotificationsPanel: React.FC = () => {
  const {
    isPanelOpen,
    panelSize,
    closePanel,
    expandPanel,
    collapsePanel,
    activeChat,
    unreadCount,
  } = useNotifications();

  if (!isPanelOpen) return null;

  const isExpanded = panelSize === 'expanded';

  return (
    <>
      {/* Overlay background */}
      <Box
        onClick={closePanel}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1199,
          opacity: isPanelOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <Box
        sx={{
          position: 'fixed',
          top: '64px', // Below header
          right: 0,
          bottom: 0,
          width: isExpanded ? 'calc(100% - 140px)' : '380px',
          maxWidth: isExpanded ? 'calc(100% - 140px)' : '380px',
          backgroundColor: 'rgba(0, 42, 126, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          animation: 'slideInFromRight 0.3s ease-out',
          transition: 'width 0.3s ease-out, max-width 0.3s ease-out',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          '@keyframes slideInFromRight': {
            from: {
              opacity: 0,
              transform: 'translateX(100%)',
            },
            to: {
              opacity: 1,
              transform: 'translateX(0)',
            },
          },
        }}
      >
        {/* Left Collapse/Expand Toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            minWidth: '28px',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          onClick={isExpanded ? collapsePanel : expandPanel}
        >
          <Tooltip title={isExpanded ? 'Collapse panel' : 'Expand panel'} placement="right" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: 'white',
                },
              }}
            >
              {isExpanded ? <ChevronRight /> : <ChevronLeft />}
            </Box>
          </Tooltip>
        </Box>

        {/* Main Panel Content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.2) 0%, rgba(25, 118, 210, 0.2) 100%)',
            minHeight: '64px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              Messages
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isExpanded ? 'Collapse panel' : 'Expand panel'} arrow>
              <IconButton
                onClick={isExpanded ? collapsePanel : expandPanel}
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {isExpanded ? <CloseFullscreen /> : <OpenInFull />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Close" arrow>
              <IconButton
                onClick={closePanel}
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* Chat List - Always visible, narrower when expanded with active chat */}
          <Box
            sx={{
              width: isExpanded && activeChat ? '320px' : '100%',
              minWidth: isExpanded && activeChat ? '320px' : 'auto',
              borderRight: isExpanded && activeChat ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              display: isExpanded || !activeChat ? 'flex' : 'none',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'width 0.3s ease-out',
            }}
          >
            <ChatList />
          </Box>

          {/* Chat View - Only visible when a chat is selected */}
          {activeChat && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'fadeIn 0.2s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0 },
                  to: { opacity: 1 },
                },
              }}
            >
              <ChatView />
            </Box>
          )}
        </Box>
        </Box>
      </Box>
    </>
  );
};

export default NotificationsPanel;

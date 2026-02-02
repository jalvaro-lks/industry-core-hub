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
import { Box, Typography, Avatar, Badge, Chip, Tooltip } from '@mui/material';
import {
  PersonAdd,
  Schedule,
  Forum,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { Chat } from '../types';

/**
 * ChatListItem component for displaying a single chat in the list
 */
const ChatListItem: React.FC<{
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}> = ({ chat, isActive, onClick }) => {
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string): string => {
    if (name.startsWith('BPN')) return name.slice(-2).toUpperCase();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (bpn: string): string => {
    // Generate consistent color based on BPN
    const hash = bpn.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
      '#c2185b', '#00796b', '#5d4037', '#455a64',
    ];
    return colors[hash % colors.length];
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        cursor: 'pointer',
        borderRadius: '8px',
        margin: '4px 8px',
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transform: 'translateX(4px)',
        },
      }}
    >
      {/* Avatar with badge */}
      <Badge
        badgeContent={chat.unreadCount}
        color="error"
        max={99}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.65rem',
            minWidth: '18px',
            height: '18px',
          },
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            backgroundColor: getAvatarColor(chat.participantBpn),
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {getInitials(chat.participantName)}
        </Avatar>
      </Badge>

      {/* Chat info */}
      <Box sx={{ flex: 1, ml: 1.5, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: chat.unreadCount > 0 ? 700 : 500,
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {chat.participantName}
            </Typography>
            {!chat.isKnownContact && (
              <Tooltip title="Unknown contact - Click to add" arrow>
                <PersonAdd
                  sx={{
                    fontSize: '0.9rem',
                    color: '#ffa726',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.7rem',
              flexShrink: 0,
              ml: 1,
            }}
          >
            {formatTime(chat.lastActivity)}
          </Typography>
        </Box>

        {/* BPN */}
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 0.5,
          }}
        >
          {chat.participantBpn}
        </Typography>

        {/* Last message preview */}
        {chat.lastMessage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                color: chat.unreadCount > 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontWeight: chat.unreadCount > 0 ? 500 : 400,
              }}
            >
              {chat.lastMessage.isOwn && 'You: '}
              {chat.lastMessage.content.slice(0, 50)}
              {chat.lastMessage.content.length > 50 && '...'}
            </Typography>
            {chat.lastMessage.expectedResponseBy && (
              <Tooltip title={`Response expected by ${chat.lastMessage.expectedResponseBy.toLocaleString()}`} arrow>
                <Schedule
                  sx={{
                    fontSize: '0.85rem',
                    color: new Date() > chat.lastMessage.expectedResponseBy ? '#f44336' : '#ffa726',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * ChatList component displaying all conversations
 */
const ChatList: React.FC = () => {
  const { chats, selectChat, activeChat } = useNotifications();

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      }}
    >
      {chats.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <Forum
            sx={{
              fontSize: '4rem',
              color: 'rgba(255, 255, 255, 0.2)',
              mb: 2,
            }}
          />
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
              fontWeight: 500,
              mb: 1,
            }}
          >
            No messages yet
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem',
            }}
          >
            Messages from dataspace participants will appear here
          </Typography>
        </Box>
      ) : (
        <Box sx={{ py: 1 }}>
          {/* Unread section */}
          {chats.filter(c => c.unreadCount > 0).length > 0 && (
            <>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  px: 2,
                  py: 1,
                }}
              >
                Unread
              </Typography>
              {chats
                .filter(c => c.unreadCount > 0)
                .map(chat => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChat?.id === chat.id}
                    onClick={() => selectChat(chat.id)}
                  />
                ))}
            </>
          )}

          {/* All chats section */}
          {chats.filter(c => c.unreadCount === 0).length > 0 && (
            <>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  px: 2,
                  py: 1,
                  mt: chats.filter(c => c.unreadCount > 0).length > 0 ? 1 : 0,
                }}
              >
                All Conversations
              </Typography>
              {chats
                .filter(c => c.unreadCount === 0)
                .map(chat => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChat?.id === chat.id}
                    onClick={() => selectChat(chat.id)}
                  />
                ))}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatList;

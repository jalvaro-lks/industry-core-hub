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
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from '@mui/material';
import {
  Reply,
  Info,
  Schedule,
  ContentCopy,
  DeviceHub,
  DoneAll,
  Done,
} from '@mui/icons-material';
import { ChatMessage } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
  onReply: () => void;
  onScrollToMessage?: (messageId: string) => void;
  onShowInfo?: (message: ChatMessage) => void;
  showDateSeparator?: boolean;
}

/**
 * Component for displaying a single chat message
 * Supports reply preview, affected items display, and message info
 */
const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  onReply,
  onScrollToMessage,
  onShowInfo,
  showDateSeparator = false,
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const hasAffectedItems = message.affectedItems && message.affectedItems.length > 0;
  const hasExpectedResponse = message.expectedResponseBy;
  const isOverdue = hasExpectedResponse && new Date() > message.expectedResponseBy!;

  return (
    <>
      {/* Date Separator */}
      {showDateSeparator && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            my: 2,
          }}
        >
          <Divider
            sx={{
              flex: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <Chip
            label={formatDate(message.timestamp)}
            size="small"
            sx={{
              mx: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.7rem',
              height: '24px',
            }}
          />
          <Divider
            sx={{
              flex: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </Box>
      )}

      {/* Message Container */}
      <Box
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
          position: 'relative',
          mb: 0.5,
          width: '100%',
        }}
      >
        {/* Action Buttons - Left side (only for own messages) */}
        {message.isOwn && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 0.25,
              mr: 1,
              opacity: showActions ? 1 : 0,
              transition: 'opacity 0.15s ease-out',
              visibility: showActions ? 'visible' : 'hidden',
            }}
          >
            <Tooltip title="Reply" arrow>
              <IconButton
                size="small"
                onClick={onReply}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Reply sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy message" arrow>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(message.content)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ContentCopy sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Message info" arrow>
              <IconButton
                size="small"
                onClick={() => onShowInfo?.(message)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Info sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Message Content Column */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: message.isOwn ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
          }}
        >
        {/* Reply Preview */}
        {message.replyToContent && (
          <Box
            onClick={() => message.replyToId && onScrollToMessage?.(message.replyToId)}
            sx={{
              maxWidth: '100%',
              mb: 0.5,
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              borderLeft: '3px solid #1976d2',
              cursor: message.replyToId && onScrollToMessage ? 'pointer' : 'default',
              transition: 'background-color 0.2s ease',
              '&:hover': message.replyToId && onScrollToMessage ? {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              } : undefined,
            }}
          >
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.7rem',
              }}
            >
              <Reply sx={{ fontSize: '0.75rem', mr: 0.5, verticalAlign: 'middle' }} />
              Replying to
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {message.replyToContent}
            </Typography>
          </Box>
        )}

        {/* Message Bubble */}
        <Box
          sx={{
            maxWidth: '100%',
            padding: '10px 14px',
            borderRadius: message.isOwn
              ? '16px 16px 4px 16px'
              : '16px 16px 16px 4px',
            backgroundColor: message.isOwn
              ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            background: message.isOwn
              ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
              : undefined,
            position: 'relative',
            animation: 'messageIn 0.2s ease-out',
            '@keyframes messageIn': {
              from: {
                opacity: 0,
                transform: message.isOwn ? 'translateX(20px)' : 'translateX(-20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateX(0)',
              },
            },
          }}
        >
          {/* Sender name for received messages */}
          {!message.isOwn && (
            <Typography
              sx={{
                color: '#64b5f6',
                fontSize: '0.7rem',
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              {message.senderName}
            </Typography>
          )}

          {/* Message Content */}
          <Typography
            sx={{
              color: 'white',
              fontSize: '0.9rem',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>

          {/* Expected Response Indicator */}
          {hasExpectedResponse && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                pt: 1,
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Schedule
                sx={{
                  fontSize: '0.8rem',
                  mr: 0.5,
                  color: isOverdue ? '#f44336' : '#ffa726',
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: isOverdue ? '#f44336' : '#ffa726',
                }}
              >
                {isOverdue ? 'Response overdue' : 'Response expected by'}{' '}
                {message.expectedResponseBy!.toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}

          {/* Affected Items Preview */}
          {hasAffectedItems && (
            <Box sx={{ mt: 1 }}>
              <Chip
                icon={<DeviceHub sx={{ fontSize: '0.9rem !important' }} />}
                label={`${message.affectedItems!.length} Digital Twin${message.affectedItems!.length > 1 ? 's' : ''} attached`}
                size="small"
                onClick={() => onShowInfo?.(message)}
                sx={{
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  color: '#81c784',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  fontSize: '0.7rem',
                  height: '24px',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                  },
                }}
              />
            </Box>
          )}

          {/* Timestamp and Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              mt: 0.5,
              gap: 0.5,
            }}
          >
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.65rem',
              }}
            >
              {formatTime(message.timestamp)}
            </Typography>
            {message.isOwn && (
              message.read ? (
                <DoneAll sx={{ fontSize: '0.85rem', color: '#64b5f6' }} />
              ) : (
                <Done sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }} />
              )
            )}
          </Box>
        </Box>
        {/* End of Message Content Column */}
        </Box>

        {/* Action Buttons - Right side (only for received messages) */}
        {!message.isOwn && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 0.25,
              ml: 1,
              opacity: showActions ? 1 : 0,
              transition: 'opacity 0.15s ease-out',
              visibility: showActions ? 'visible' : 'hidden',
            }}
          >
            <Tooltip title="Reply" arrow>
              <IconButton
                size="small"
                onClick={onReply}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Reply sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy message" arrow>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(message.content)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ContentCopy sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Message info" arrow>
              <IconButton
                size="small"
                onClick={() => onShowInfo?.(message)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '4px',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Info sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </>
  );
};

export default ChatMessageComponent;

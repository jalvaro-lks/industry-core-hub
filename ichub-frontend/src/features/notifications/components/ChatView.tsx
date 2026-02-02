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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Tooltip,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Fab,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  PersonAdd,
  Close,
  AttachFile,
  Info,
  Reply,
  ContentCopy,
  Schedule,
  CheckCircle,
  KeyboardArrowDown,
  DeviceHub,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import ChatMessageComponent from './ChatMessage';
import { ChatMessage } from '../types';

/**
 * ChatView component for displaying and interacting with a single conversation
 */
const ChatView: React.FC = () => {
  const {
    activeChat,
    closeChat,
    sendMessage,
    replyingTo,
    cancelReply,
    replyToMessage,
    addContact,
    isKnownContact,
    panelSize,
  } = useNotifications();

  const [messageText, setMessageText] = useState('');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [contactName, setContactName] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0);
  const [selectedMessageForInfo, setSelectedMessageForInfo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = panelSize === 'expanded';

  // Check if user is at bottom of messages
  const checkIfAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom && activeChat) {
      setNewMessagesCount(0);
      setLastSeenMessageCount(activeChat.messages.length);
    }
  }, [checkIfAtBottom, activeChat]);

  // Track new messages when not at bottom
  useEffect(() => {
    if (!activeChat) return;
    
    if (isAtBottom) {
      setLastSeenMessageCount(activeChat.messages.length);
      setNewMessagesCount(0);
    } else {
      const newCount = activeChat.messages.length - lastSeenMessageCount;
      if (newCount > 0) {
        setNewMessagesCount(newCount);
      }
    }
  }, [activeChat?.messages.length, isAtBottom, lastSeenMessageCount, activeChat]);

  // Initialize last seen count on chat open
  useEffect(() => {
    if (activeChat) {
      setLastSeenMessageCount(activeChat.messages.length);
      setNewMessagesCount(0);
      setIsAtBottom(true);
      // Scroll to bottom on initial chat open
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 0);
    }
  }, [activeChat?.id]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setNewMessagesCount(0);
    if (activeChat) {
      setLastSeenMessageCount(activeChat.messages.length);
    }
  }, [activeChat]);

  // Scroll to specific message
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.style.transition = 'background-color 0.3s ease';
      messageElement.style.backgroundColor = 'rgba(25, 118, 210, 0.3)';
      setTimeout(() => {
        messageElement.style.backgroundColor = 'transparent';
      }, 1500);
    }
  }, []);

  // Focus input when chat opens
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChat?.id]);

  if (!activeChat) return null;

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessage({
      receiverBpn: activeChat.participantBpn,
      content: messageText.trim(),
      replyToId: replyingTo?.id,
    });

    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddContact = () => {
    if (contactName.trim()) {
      addContact(activeChat.participantBpn, contactName.trim());
      setShowAddContactDialog(false);
      setContactName('');
    }
  };

  const getAvatarColor = (bpn: string): string => {
    const hash = bpn.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
      '#c2185b', '#00796b', '#5d4037', '#455a64',
    ];
    return colors[hash % colors.length];
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        {!isExpanded && (
          <IconButton
            onClick={closeChat}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mr: 1,
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
        )}

        <Avatar
          sx={{
            width: 40,
            height: 40,
            backgroundColor: getAvatarColor(activeChat.participantBpn),
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          {getInitials(activeChat.participantName)}
        </Avatar>

        <Box sx={{ flex: 1, ml: 1.5, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.95rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeChat.participantName}
            </Typography>
            {!activeChat.isKnownContact && (
              <Tooltip title="Add to contacts" arrow>
                <IconButton
                  size="small"
                  onClick={() => setShowAddContactDialog(true)}
                  sx={{
                    color: '#ffa726',
                    padding: '4px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    },
                  }}
                >
                  <PersonAdd sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            )}
            {activeChat.isKnownContact && (
              <Tooltip title="Contact saved" arrow>
                <CheckCircle
                  sx={{
                    fontSize: '0.9rem',
                    color: '#4caf50',
                  }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activeChat.participantBpn}
          </Typography>
        </Box>

        <Tooltip title="Copy BPN" arrow>
          <IconButton
            size="small"
            onClick={() => navigator.clipboard.writeText(activeChat.participantBpn)}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ContentCopy sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Message Info Panel - Full screen in messages area */}
        {selectedMessageForInfo ? (
          <Box
            sx={{
              height: '100%',
              overflow: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
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
            {/* Info Panel Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
                pb: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info sx={{ color: '#64b5f6', fontSize: '1.2rem' }} />
                <Typography
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  Message Details
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setSelectedMessageForInfo(null)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Message Preview */}
            <Box
              sx={{
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  color: '#64b5f6',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {selectedMessageForInfo.isOwn ? 'You' : selectedMessageForInfo.senderName}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {selectedMessageForInfo.content}
              </Typography>
            </Box>

            {/* Message Metadata */}
            <Typography
              sx={{
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              Message Information
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                padding: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                mb: 3,
              }}
            >
              <InfoRow label="Message ID" value={selectedMessageForInfo.id} />
              <InfoRow label="Sender BPN" value={selectedMessageForInfo.senderId} />
              <InfoRow label="Context" value={selectedMessageForInfo.context || 'N/A'} />
              <InfoRow label="Version" value={selectedMessageForInfo.version || 'N/A'} />
              <InfoRow label="Sent" value={selectedMessageForInfo.timestamp.toLocaleString()} />
              {selectedMessageForInfo.expectedResponseBy && (
                <InfoRow
                  label="Response By"
                  value={selectedMessageForInfo.expectedResponseBy.toLocaleString()}
                />
              )}
            </Box>

            {/* Affected Items / Digital Twins */}
            {selectedMessageForInfo.affectedItems && selectedMessageForInfo.affectedItems.length > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <DeviceHub sx={{ color: '#81c784', fontSize: '1rem' }} />
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Attached Digital Twins ({selectedMessageForInfo.affectedItems.length})
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {selectedMessageForInfo.affectedItems.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        padding: '12px',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#81c784',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        {item.name || 'Digital Twin'}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {item.digitalTwinId}
                      </Typography>
                      {item.specificAssetIds && item.specificAssetIds.length > 0 && (
                        <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid rgba(76, 175, 80, 0.3)' }}>
                          {item.specificAssetIds.map((asset, assetIndex) => (
                            <Typography
                              key={assetIndex}
                              sx={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.7rem',
                              }}
                            >
                              {asset.name}: {asset.value}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Back to chat button */}
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => setSelectedMessageForInfo(null)}
              sx={{
                mt: 'auto',
                pt: 2,
                color: '#64b5f6',
                borderColor: 'rgba(100, 181, 246, 0.5)',
                '&:hover': {
                  borderColor: '#64b5f6',
                  backgroundColor: 'rgba(100, 181, 246, 0.1)',
                },
              }}
            >
              Back to Chat
            </Button>
          </Box>
        ) : (
          /* Messages List */
          <>
            <Box
              ref={messagesContainerRef}
              onScroll={handleScroll}
              sx={{
                height: '100%',
                overflow: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
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
              {activeChat.messages.map((message, index) => (
                <Box
                  key={message.id}
                  ref={(el: HTMLDivElement | null) => {
                    if (el) {
                      messageRefs.current.set(message.id, el);
                    }
                  }}
                >
                  <ChatMessageComponent
                    message={message}
                    onReply={() => replyToMessage(activeChat.id, message.id)}
                    onScrollToMessage={scrollToMessage}
                    onShowInfo={setSelectedMessageForInfo}
                    showDateSeparator={
                      index === 0 ||
                      new Date(activeChat.messages[index - 1].timestamp).toDateString() !==
                        new Date(message.timestamp).toDateString()
                    }
                  />
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Scroll to bottom button */}
            {!isAtBottom && (
              <Tooltip title="Scroll to latest" arrow>
                <Badge
                  badgeContent={newMessagesCount > 0 ? newMessagesCount : undefined}
                  color="primary"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    '& .MuiBadge-badge': {
                      backgroundColor: '#1976d2',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px',
                    },
                  }}
                >
                  <Fab
                    size="small"
                    onClick={scrollToBottom}
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.9)',
                      color: 'white',
                      width: 36,
                      height: 36,
                      minHeight: 36,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      '&:hover': {
                        backgroundColor: '#1976d2',
                      },
                    }}
                  >
                    <KeyboardArrowDown />
                  </Fab>
                </Badge>
              </Tooltip>
            )}
          </>
        )}
      </Box>

      {/* Reply Preview */}
      {replyingTo && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            borderTop: '1px solid rgba(25, 118, 210, 0.3)',
            borderLeft: '3px solid #1976d2',
          }}
        >
          <Reply sx={{ color: '#64b5f6', mr: 1, fontSize: '1rem' }} />
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              sx={{
                color: '#64b5f6',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              Replying to {replyingTo.senderName}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {replyingTo.content}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={cancelReply}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                color: 'white',
              },
            }}
          >
            <Close sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      )}

      {/* Message Input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          gap: 1,
        }}
      >
        <Tooltip title="Attach asset (coming soon)" arrow>
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              color: 'white',
              fontSize: '0.9rem',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255, 255, 255, 0.5)',
              opacity: 1,
            },
          }}
        />

        <IconButton
          onClick={handleSend}
          disabled={!messageText.trim()}
          sx={{
            backgroundColor: messageText.trim() ? '#1976d2' : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            '&:hover': {
              backgroundColor: messageText.trim() ? '#1565c0' : 'rgba(255, 255, 255, 0.15)',
            },
            '&.Mui-disabled': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Send />
        </IconButton>
      </Box>

      {/* Add Contact Dialog */}
      <Dialog
        open={showAddContactDialog}
        onClose={() => setShowAddContactDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 42, 126, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            minWidth: '320px',
          },
        }}
      >
        <DialogTitle
          sx={{
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          Add to Contacts
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              mb: 2,
            }}
          >
            Add <strong>{activeChat.participantBpn}</strong> to your contact list
          </Typography>
          <TextField
            fullWidth
            label="Contact Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ padding: '16px' }}>
          <Button
            onClick={() => setShowAddContactDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddContact}
            variant="contained"
            disabled={!contactName.trim()}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#388e3c',
              },
            }}
          >
            Add Contact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Helper component for displaying info rows
 */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Typography
      sx={{
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.8rem',
        minWidth: '100px',
        flexShrink: 0,
      }}
    >
      {label}:
    </Typography>
    <Typography
      sx={{
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '0.8rem',
        flex: 1,
        wordBreak: 'break-all',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default ChatView;

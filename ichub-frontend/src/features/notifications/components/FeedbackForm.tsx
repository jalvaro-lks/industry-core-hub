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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Send,
  Close,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Error,
  DeviceHub,
  ReplyAll,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import {
  InboxNotification,
  FeedbackPayload,
  ItemFeedback,
  FeedbackStatus,
} from '../types';

interface FeedbackFormProps {
  notification: InboxNotification;
  onCancel: () => void;
}

/**
 * FeedbackForm component - Professional feedback composition interface
 */
const FeedbackForm: React.FC<FeedbackFormProps> = ({ notification, onCancel }) => {
  const { sendFeedback, panelSize } = useNotifications();

  const [overallStatus, setOverallStatus] = useState<FeedbackStatus>('OK');
  const [overallMessage, setOverallMessage] = useState('');
  const [itemFeedbacks, setItemFeedbacks] = useState<ItemFeedback[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const isCompact = panelSize === 'normal';

  // Initialize item feedbacks from verified items
  useEffect(() => {
    const initialFeedbacks: ItemFeedback[] = notification.verifiedItems.map((vi) => ({
      catenaXId: vi.item.catenaXId,
      status: vi.verificationStatus === 'accessible' ? 'OK' : 'ERROR',
      statusMessage:
        vi.verificationStatus === 'accessible'
          ? 'Digital Twin accessible and processed successfully'
          : vi.verificationError || 'Digital Twin not accessible',
    }));
    setItemFeedbacks(initialFeedbacks);

    // Set overall status based on items
    const hasErrors = notification.verifiedItems.some(
      (vi) => vi.verificationStatus !== 'accessible'
    );
    setOverallStatus(hasErrors ? 'ERROR' : 'OK');
    setOverallMessage(
      hasErrors
        ? 'Some Digital Twins could not be processed'
        : 'All Digital Twins processed successfully'
    );
  }, [notification]);

  const toggleItemExpanded = (catenaXId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(catenaXId)) {
        next.delete(catenaXId);
      } else {
        next.add(catenaXId);
      }
      return next;
    });
  };

  const updateItemFeedback = (catenaXId: string, field: keyof ItemFeedback, value: string) => {
    setItemFeedbacks((prev) =>
      prev.map((f) => (f.catenaXId === catenaXId ? { ...f, [field]: value } : f))
    );
  };

  const getItemInfo = (catenaXId: string) => {
    const verified = notification.verifiedItems.find((vi) => vi.item.catenaXId === catenaXId);
    return verified?.item;
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const feedbackContent: FeedbackPayload = {
        status: overallStatus,
        statusMessage: overallMessage || undefined,
        listOfItems: itemFeedbacks,
      };
      await sendFeedback(notification.id, feedbackContent);
      onCancel();
    } catch (error) {
      console.error('Failed to send feedback:', error);
    } finally {
      setSending(false);
    }
  };

  const okCount = itemFeedbacks.filter((f) => f.status === 'OK').length;
  const errorCount = itemFeedbacks.filter((f) => f.status === 'ERROR').length;

  return (
    <Box
      sx={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid rgba(66, 165, 245, 0.3)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isCompact ? '10px 12px' : '12px 16px',
          background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.15) 0%, rgba(25, 118, 210, 0.1) 100%)',
          borderBottom: '1px solid rgba(66, 165, 245, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReplyAll sx={{ color: '#42a5f5', fontSize: isCompact ? '1rem' : '1.2rem' }} />
          <Typography
            sx={{
              color: '#ffffff',
              fontWeight: 600,
              fontSize: isCompact ? '0.8rem' : '0.9rem',
            }}
          >
            Compose Feedback
          </Typography>
        </Box>
        <Tooltip title="Cancel" arrow>
          <IconButton
            size="small"
            onClick={onCancel}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&:hover': { 
                color: '#ef5350',
                backgroundColor: 'rgba(244, 67, 54, 0.15)',
              },
            }}
          >
            <Close sx={{ fontSize: isCompact ? '0.9rem' : '1rem' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ padding: isCompact ? '12px' : '16px' }}>
        {/* Overall Status Row */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              color: '#64b5f6',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.75,
            }}
          >
            Response Status
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
            <FormControl size="small" sx={{ minWidth: isCompact ? 90 : 110 }}>
              <Select
                value={overallStatus}
                onChange={(e) => setOverallStatus(e.target.value as FeedbackStatus)}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  height: '32px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#42a5f5',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2a2a2a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '& .MuiMenuItem-root': {
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        '&:hover': { backgroundColor: 'rgba(66, 165, 245, 0.15)' },
                        '&.Mui-selected': { backgroundColor: 'rgba(66, 165, 245, 0.25)' },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="OK">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircle sx={{ color: '#81c784', fontSize: '0.9rem' }} />
                    <span>OK</span>
                  </Box>
                </MenuItem>
                <MenuItem value="ERROR">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Error sx={{ color: '#ef5350', fontSize: '0.9rem' }} />
                    <span>ERROR</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              placeholder="Add a message..."
              value={overallMessage}
              onChange={(e) => setOverallMessage(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  height: '32px',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#42a5f5' },
                },
                '& .MuiInputBase-input': { padding: '6px 10px' },
                '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.35)', opacity: 1 },
              }}
            />
          </Box>
        </Box>

        {/* Summary Chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={<CheckCircle sx={{ fontSize: '0.8rem !important' }} />}
            label={`${okCount} OK`}
            size="small"
            sx={{
              backgroundColor: 'rgba(129, 199, 132, 0.15)',
              color: '#81c784',
              fontSize: '0.65rem',
              height: '22px',
              '& .MuiChip-icon': { color: '#81c784' },
            }}
          />
          {errorCount > 0 && (
            <Chip
              icon={<Error sx={{ fontSize: '0.8rem !important' }} />}
              label={`${errorCount} Error`}
              size="small"
              sx={{
                backgroundColor: 'rgba(239, 83, 80, 0.15)',
                color: '#ef5350',
                fontSize: '0.65rem',
                height: '22px',
                '& .MuiChip-icon': { color: '#ef5350' },
              }}
            />
          )}
        </Box>

        {/* Per-Item Feedback */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              color: '#64b5f6',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.75,
            }}
          >
            Item Details ({itemFeedbacks.length})
          </Typography>

          <Box 
            sx={{ 
              maxHeight: isCompact ? '120px' : '160px', 
              overflow: 'auto',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '2px' },
            }}
          >
            {itemFeedbacks.map((feedback) => {
              const item = getItemInfo(feedback.catenaXId);
              const isExpanded = expandedItems.has(feedback.catenaXId);

              return (
                <Box
                  key={feedback.catenaXId}
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '6px',
                    mb: 0.75,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Item Header */}
                  <Box
                    onClick={() => toggleItemExpanded(feedback.catenaXId)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                    }}
                  >
                    <DeviceHub sx={{ color: '#81c784', fontSize: '0.85rem', mr: 0.75 }} />
                    <Typography
                      sx={{
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item?.manufacturerPartId || 'Unknown Item'}
                    </Typography>
                    <Chip
                      label={feedback.status}
                      size="small"
                      sx={{
                        backgroundColor: feedback.status === 'OK' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(239, 83, 80, 0.2)',
                        color: feedback.status === 'OK' ? '#81c784' : '#ef5350',
                        fontSize: '0.55rem',
                        height: '16px',
                        mr: 0.5,
                      }}
                    />
                    {isExpanded ? (
                      <ExpandLess sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem' }} />
                    ) : (
                      <ExpandMore sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.95rem' }} />
                    )}
                  </Box>

                  {/* Expanded Edit */}
                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        padding: '8px 10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Status selector row */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.65rem', minWidth: '40px' }}>
                            Status:
                          </Typography>
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={feedback.status}
                              onChange={(e) => updateItemFeedback(feedback.catenaXId, 'status', e.target.value as FeedbackStatus)}
                              sx={{
                                backgroundColor: feedback.status === 'OK' 
                                  ? 'rgba(129, 199, 132, 0.15)' 
                                  : 'rgba(239, 83, 80, 0.15)',
                                color: feedback.status === 'OK' ? '#81c784' : '#ef5350',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                height: '28px',
                                '& .MuiOutlinedInput-notchedOutline': { 
                                  borderColor: feedback.status === 'OK' 
                                    ? 'rgba(129, 199, 132, 0.4)' 
                                    : 'rgba(239, 83, 80, 0.4)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': { 
                                  borderColor: feedback.status === 'OK' ? '#81c784' : '#ef5350',
                                },
                                '& .MuiSelect-icon': { 
                                  color: feedback.status === 'OK' ? '#81c784' : '#ef5350',
                                },
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    backgroundColor: '#1e1e1e',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                                    '& .MuiMenuItem-root': { 
                                      color: '#ffffff', 
                                      fontSize: '0.75rem',
                                      padding: '8px 12px',
                                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                                      '&.Mui-selected': { backgroundColor: 'rgba(66, 165, 245, 0.2)' },
                                    },
                                  },
                                },
                              }}
                            >
                              <MenuItem value="OK">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircle sx={{ color: '#81c784', fontSize: '1rem' }} />
                                  <span style={{ fontWeight: 600 }}>OK</span>
                                </Box>
                              </MenuItem>
                              <MenuItem value="ERROR">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Error sx={{ color: '#ef5350', fontSize: '1rem' }} />
                                  <span style={{ fontWeight: 600 }}>ERROR</span>
                                </Box>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>

                        {/* Message input */}
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Enter status message..."
                          value={feedback.statusMessage || ''}
                          onChange={(e) => updateItemFeedback(feedback.catenaXId, 'statusMessage', e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(0, 0, 0, 0.25)',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              textAlign: 'center',
                              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                              '&.Mui-focused fieldset': { borderColor: '#42a5f5' },
                            },
                            '& .MuiInputBase-input': { textAlign: 'center' },
                            '& .MuiInputBase-input::placeholder': { 
                              color: 'rgba(255, 255, 255, 0.3)', 
                              opacity: 1,
                              textAlign: 'center',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Actions - Compact buttons aligned right */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            size="small"
            onClick={onCancel}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.7rem',
              padding: '4px 12px',
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSend}
            disabled={sending}
            startIcon={sending ? <CircularProgress size={12} color="inherit" /> : <Send sx={{ fontSize: '0.85rem' }} />}
            sx={{
              backgroundColor: '#42a5f5',
              color: '#ffffff',
              fontSize: '0.7rem',
              padding: '4px 14px',
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(66, 165, 245, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FeedbackForm;

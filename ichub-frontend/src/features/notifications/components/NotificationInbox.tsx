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
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Chip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Search,
  DoneAll,
  ViewList,
  People,
  FiberManualRecord,
  Schedule,
  CheckCircle,
  DeviceHub,
  KeyboardArrowRight,
  Warning,
  PriorityHigh,
  PersonAdd,
  SortByAlpha,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import { InboxNotification, SenderGroup, NotificationSortBy } from '../types';

/**
 * NotificationInbox component - displays notifications in list or grouped view
 * Supports responsive design: compact (mobile) vs full (desktop) layout
 */
const NotificationInbox: React.FC = () => {
  const {
    panelSize,
    viewMode,
    setViewMode,
    filteredNotifications,
    senderGroups,
    filters,
    setFilters,
    stats,
    sortBy,
    setSortBy,
    markAllAsRead,
    selectNotification,
    getContactName,
    isKnownContact,
    getPriority,
  } = useNotifications();

  // Determine if we're in compact (mobile) mode
  const isCompact = panelSize === 'normal';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatResponseTime = (dateStr?: string): string | null => {
    if (!dateStr) return null;
    const responseBy = new Date(dateStr);
    const now = new Date();
    const diffMs = responseBy.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h left`;
    return `${diffDays}d left`;
  };

  const getPriorityIcon = (notification: InboxNotification) => {
    const priority = getPriority(notification);
    switch (priority) {
      case 'urgent':
        return <PriorityHigh sx={{ fontSize: '1rem', color: '#f44336' }} />;
      case 'high':
        return <Warning sx={{ fontSize: '0.9rem', color: '#ff9800' }} />;
      default:
        return null;
    }
  };

  const getPriorityChip = (notification: InboxNotification) => {
    const priority = getPriority(notification);
    const colors = {
      urgent: { bg: 'rgba(244, 67, 54, 0.2)', text: '#ef5350' },
      high: { bg: 'rgba(255, 152, 0, 0.2)', text: '#ffb74d' },
      normal: { bg: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.6)' },
      low: { bg: 'rgba(255, 255, 255, 0.05)', text: 'rgba(255, 255, 255, 0.4)' },
    };
    const responseTime = formatResponseTime(notification.header.expectedResponseBy);
    if (!responseTime) return null;

    return (
      <Chip
        icon={getPriorityIcon(notification) || undefined}
        label={responseTime}
        size="small"
        sx={{
          backgroundColor: colors[priority].bg,
          color: colors[priority].text,
          fontSize: '0.6rem',
          height: '18px',
          '& .MuiChip-icon': { color: colors[priority].text, marginLeft: '4px' },
        }}
      />
    );
  };

  const getStatusIcon = (notification: InboxNotification) => {
    switch (notification.status) {
      case 'unread':
        return <FiberManualRecord sx={{ fontSize: '0.6rem', color: '#42a5f5' }} />;
      case 'pending-feedback':
        return <Schedule sx={{ fontSize: '0.8rem', color: '#ffb74d' }} />;
      case 'feedback-sent':
        return <CheckCircle sx={{ fontSize: '0.8rem', color: '#81c784' }} />;
      default:
        return null;
    }
  };

  const getAvatarColor = (bpn: string): string => {
    const hash = bpn.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#00796b', '#5d4037'];
    return colors[hash % colors.length];
  };

  const getInitials = (name: string): string => {
    if (name.startsWith('BPNL')) return name.slice(-2).toUpperCase();
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compact (mobile) notification item
  const renderCompactNotificationItem = (notification: InboxNotification) => {
    const senderBpn = notification.header.senderBpn;
    const senderName = getContactName(senderBpn);
    const isKnown = isKnownContact(senderBpn);

    return (
      <Box
        key={notification.id}
        onClick={() => selectNotification(notification)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          cursor: 'pointer',
          backgroundColor:
            notification.status === 'unread' ? 'rgba(66, 165, 245, 0.08)' : 'transparent',
          borderLeft: notification.status === 'unread' ? '3px solid #42a5f5' : '3px solid transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 36,
            height: 36,
            backgroundColor: getAvatarColor(senderBpn),
            fontSize: '0.75rem',
            fontWeight: 600,
            mr: 1,
          }}
        >
          {getInitials(senderName)}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
            <Typography
              sx={{
                color: '#ffffff',
                fontWeight: notification.status === 'unread' ? 600 : 400,
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {senderName}
            </Typography>
            {!isKnown && (
              <Tooltip title="Unknown contact" arrow>
                <PersonAdd sx={{ fontSize: '0.85rem', color: '#ffb74d' }} />
              </Tooltip>
            )}
            {getStatusIcon(notification)}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={`${notification.content.listOfItems.length} DT`}
              size="small"
              sx={{
                backgroundColor: 'rgba(129, 199, 132, 0.15)',
                color: '#81c784',
                fontSize: '0.6rem',
                height: '16px',
              }}
            />
            {getPriorityChip(notification)}
          </Box>
        </Box>

        {/* Time */}
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.65rem', ml: 0.5 }}>
          {formatDate(notification.receivedAt)}
        </Typography>
      </Box>
    );
  };

  // Full (desktop) notification item
  const renderFullNotificationItem = (notification: InboxNotification) => {
    const senderBpn = notification.header.senderBpn;
    const senderName = getContactName(senderBpn);
    const isKnown = isKnownContact(senderBpn);

    return (
      <Box
        key={notification.id}
        onClick={() => selectNotification(notification)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '14px 20px',
          cursor: 'pointer',
          backgroundColor:
            notification.status === 'unread' ? 'rgba(66, 165, 245, 0.08)' : 'transparent',
          borderLeft: notification.status === 'unread' ? '4px solid #42a5f5' : '4px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 44,
            height: 44,
            backgroundColor: getAvatarColor(senderBpn),
            fontSize: '0.9rem',
            fontWeight: 600,
            mr: 2,
          }}
        >
          {getInitials(senderName)}
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: '#ffffff',
                  fontWeight: notification.status === 'unread' ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                {senderName}
              </Typography>
              {isKnown ? (
                <Tooltip title="Known contact" arrow>
                  <CheckCircle sx={{ fontSize: '0.85rem', color: '#81c784' }} />
                </Tooltip>
              ) : (
                <Tooltip title="Unknown contact - Click to add" arrow>
                  <PersonAdd sx={{ fontSize: '0.9rem', color: '#ffb74d' }} />
                </Tooltip>
              )}
              {getStatusIcon(notification)}
            </Box>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
              {formatDate(notification.receivedAt)}
            </Typography>
          </Box>

          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 1,
            }}
          >
            {notification.content.information || 'Digital Twin notification received'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<DeviceHub sx={{ fontSize: '0.8rem !important' }} />}
              label={`${notification.content.listOfItems.length} Digital Twin${notification.content.listOfItems.length > 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(129, 199, 132, 0.15)',
                color: '#81c784',
                fontSize: '0.65rem',
                height: '22px',
                '& .MuiChip-icon': { color: '#81c784' },
              }}
            />
            <Chip
              label={notification.content.digitalTwinType}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.65rem',
                height: '22px',
              }}
            />
            {getPriorityChip(notification)}
          </Box>
        </Box>

        <KeyboardArrowRight sx={{ color: 'rgba(255, 255, 255, 0.3)', ml: 1, mt: 1 }} />
      </Box>
    );
  };

  const renderSenderGroup = (group: SenderGroup) => {
    const isKnown = isKnownContact(group.sender.bpnl);

    const handleGroupClick = () => {
      // Switch to list view and apply filter
      setViewMode('list');
      setFilters({ ...filters, senderBpn: group.sender.bpnl });
    };

    return (
      <Box key={group.sender.bpnl}>
        <Box
          onClick={handleGroupClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            padding: isCompact ? '10px 12px' : '14px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
            },
          }}
        >
          <Badge
            badgeContent={group.unreadCount}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                minWidth: '16px',
                height: '16px',
                backgroundColor: '#42a5f5',
              },
            }}
          >
            <Avatar
              sx={{
                width: isCompact ? 40 : 48,
                height: isCompact ? 40 : 48,
                backgroundColor: getAvatarColor(group.sender.bpnl),
                fontSize: isCompact ? '0.85rem' : '1rem',
                fontWeight: 600,
              }}
            >
              {getInitials(group.sender.name)}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1, ml: 1.5, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  color: '#ffffff',
                  fontWeight: group.unreadCount > 0 ? 600 : 400,
                  fontSize: isCompact ? '0.85rem' : '0.95rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.sender.name}
              </Typography>
              {isKnown ? (
                <CheckCircle sx={{ fontSize: '0.8rem', color: '#81c784' }} />
              ) : (
                <PersonAdd sx={{ fontSize: '0.85rem', color: '#ffb74d' }} />
              )}
            </Box>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isCompact ? '0.7rem' : '0.75rem',
              }}
            >
              {group.notifications.length} notification{group.notifications.length > 1 ? 's' : ''}
            </Typography>
          </Box>

          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.7rem',
            }}
          >
            {formatDate(group.lastActivity)}
          </Typography>
          <KeyboardArrowRight sx={{ color: 'rgba(255, 255, 255, 0.3)', ml: 1 }} />
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          padding: isCompact ? '10px 12px' : '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Title row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: isCompact ? '0.95rem' : '1.1rem' }}>
              Inbox
            </Typography>
            {stats.unread > 0 && (
              <Chip
                label={stats.unread}
                size="small"
                sx={{
                  backgroundColor: '#42a5f5',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  height: '18px',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Mark all as read" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={markAllAsRead}
                  disabled={stats.unread === 0}
                  sx={{
                    color: stats.unread > 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.25)',
                    '&:hover': { 
                      backgroundColor: stats.unread > 0 ? 'rgba(66, 165, 245, 0.15)' : 'transparent',
                      color: stats.unread > 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
                    },
                    '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.25)' },
                  }}
                >
                  <DoneAll sx={{ fontSize: '1rem' }} />
                </IconButton>
              </span>
            </Tooltip>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 6px',
                  '&.Mui-selected': {
                    color: '#ffffff',
                    backgroundColor: 'rgba(66, 165, 245, 0.25)',
                    '&:hover': { backgroundColor: 'rgba(66, 165, 245, 0.35)' },
                  },
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                },
              }}
            >
              <ToggleButton value="list">
                <Tooltip title="List view" arrow>
                  <ViewList sx={{ fontSize: '0.95rem' }} />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="grouped">
                <Tooltip title="Group by sender" arrow>
                  <People sx={{ fontSize: '0.95rem' }} />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Search and Sort row */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search..."
            value={filters.search}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '1rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '0.8rem',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                '&.Mui-focused fieldset': { borderColor: '#42a5f5' },
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.35)', opacity: 1 },
            }}
          />

          {!isCompact && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as NotificationSortBy)}
                displayEmpty
                renderValue={(value) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <SortByAlpha sx={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.6)' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#ffffff' }}>
                      {value === 'receivedAt' && 'Date received'}
                      {value === 'expectedResponseBy' && 'Deadline'}
                      {value === 'priority' && 'Priority'}
                    </Typography>
                  </Box>
                )}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  height: '36px',
                  '& .MuiSelect-select': {
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    paddingLeft: '10px',
                    paddingRight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5', borderWidth: '2px' },
                  '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.6)' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#2a2a2a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      mt: 0.5,
                      '& .MuiMenuItem-root': {
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        padding: '10px 16px',
                        '&:hover': {
                          backgroundColor: 'rgba(66, 165, 245, 0.15)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(66, 165, 245, 0.25)',
                          '&:hover': {
                            backgroundColor: 'rgba(66, 165, 245, 0.35)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="receivedAt">Date received</MenuItem>
                <MenuItem value="expectedResponseBy">Response deadline</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Active filter chip */}
      {filters.senderBpn && (
        <Box sx={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Chip
            label={`From: ${getContactName(filters.senderBpn)}`}
            onDelete={() => setFilters({ ...filters, senderBpn: undefined })}
            size="small"
            sx={{
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              color: '#90caf9',
              fontSize: '0.7rem',
              '& .MuiChip-deleteIcon': { color: 'rgba(144, 202, 249, 0.7)', '&:hover': { color: '#90caf9' } },
            }}
          />
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: '5px' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '3px',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
          },
        }}
      >
        {viewMode === 'list' ? (
          filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <React.Fragment key={notification.id}>
                {isCompact
                  ? renderCompactNotificationItem(notification)
                  : renderFullNotificationItem(notification)}
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
              </React.Fragment>
            ))
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '180px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <DeviceHub sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.5 }} />
              <Typography sx={{ fontSize: '0.85rem' }}>No notifications found</Typography>
            </Box>
          )
        ) : senderGroups.length > 0 ? (
          senderGroups.map(renderSenderGroup)
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <People sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.5 }} />
            <Typography sx={{ fontSize: '0.85rem' }}>No contacts with notifications</Typography>
          </Box>
        )}
      </Box>

      {/* Stats footer */}
      <Box
        sx={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'center',
          gap: isCompact ? 1.5 : 2.5,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.65rem' }}>
          {stats.total} total
        </Typography>
        <Typography sx={{ color: '#42a5f5', fontSize: '0.65rem', fontWeight: 500 }}>
          {stats.unread} unread
        </Typography>
        <Typography sx={{ color: '#ffb74d', fontSize: '0.65rem' }}>{stats.pendingFeedback} pending</Typography>
        <Typography sx={{ color: '#81c784', fontSize: '0.65rem' }}>{stats.feedbackSent} sent</Typography>
      </Box>
    </Box>
  );
};

export default NotificationInbox;

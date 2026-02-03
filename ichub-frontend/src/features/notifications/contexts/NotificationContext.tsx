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

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  InboxNotification,
  NotificationPanelSize,
  InboxViewMode,
  NotificationFilters,
  NotificationStats,
  Contact,
  SenderGroup,
  FeedbackPayload,
  DigitalTwinVerificationStatus,
  NotificationSortBy,
} from '../types';
import { mockNotificationService } from '../services/mockNotificationService';
import { fetchPartners } from '@/features/business-partner-kit/partner-management/api';
import { PartnerInstance } from '@/features/business-partner-kit/partner-management/types/types';

interface NotificationContextType {
  // Panel state
  isPanelOpen: boolean;
  panelSize: NotificationPanelSize;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;
  setPanelSize: (size: NotificationPanelSize) => void;

  // View state
  viewMode: InboxViewMode;
  setViewMode: (mode: InboxViewMode) => void;
  selectedNotification: InboxNotification | null;
  selectNotification: (notification: InboxNotification | null) => void;

  // Sorting
  sortBy: NotificationSortBy;
  setSortBy: (sort: NotificationSortBy) => void;

  // Notifications
  notifications: InboxNotification[];
  filteredNotifications: InboxNotification[];
  senderGroups: SenderGroup[];
  stats: NotificationStats;

  // Filters
  filters: NotificationFilters;
  setFilters: (filters: NotificationFilters) => void;
  clearFilters: () => void;

  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  verifyDigitalTwin: (notificationId: string, catenaXId: string) => Promise<void>;
  verifyAllDigitalTwins: (notificationId: string) => Promise<void>;
  sendFeedback: (notificationId: string, feedback: FeedbackPayload) => Promise<void>;

  // Contacts integration
  contacts: Contact[];
  realPartners: PartnerInstance[];
  getContactName: (bpnl: string) => string;
  isKnownContact: (bpnl: string) => boolean;
  refreshPartners: () => Promise<void>;

  // Priority helper
  getPriority: (notification: InboxNotification) => 'urgent' | 'high' | 'normal' | 'low';

  // Stats helper
  getStats: () => NotificationStats;
}

const defaultFilters: NotificationFilters = {
  search: '',
  status: 'all',
  type: 'all',
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<NotificationPanelSize>('normal');

  // View state
  const [viewMode, setViewMode] = useState<InboxViewMode>('list');
  const [selectedNotification, setSelectedNotification] = useState<InboxNotification | null>(null);
  const [sortBy, setSortBy] = useState<NotificationSortBy>('receivedAt');

  // Data
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [realPartners, setRealPartners] = useState<PartnerInstance[]>([]);
  const [filters, setFilters] = useState<NotificationFilters>(defaultFilters);

  // Load partners from Contact List API
  const refreshPartners = useCallback(async () => {
    try {
      const partners = await fetchPartners();
      setRealPartners(partners);
      // Merge with mock contacts
      const partnerContacts: Contact[] = partners.map((p) => ({
        bpnl: p.bpnl,
        name: p.name,
        isKnown: true,
      }));
      setContacts((prevContacts) => {
        const merged = [...partnerContacts];
        // Add any mock contacts that aren't in real partners
        prevContacts.forEach((c) => {
          if (!merged.find((m) => m.bpnl === c.bpnl)) {
            merged.push(c);
          }
        });
        return merged;
      });
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const initialNotifications = mockNotificationService.getNotifications();
    setNotifications(initialNotifications);
    setContacts(mockNotificationService.getContacts());

    // Load real partners from API
    refreshPartners();

    // Subscribe to new notifications
    const unsubscribe = mockNotificationService.subscribe((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return unsubscribe;
  }, [refreshPartners]);

  // Panel controls
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => !prev);
    if (isPanelOpen) {
      setSelectedNotification(null);
    }
  }, [isPanelOpen]);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedNotification(null);
  }, []);

  const expandPanel = useCallback(() => {
    setPanelSize('expanded');
  }, []);

  const collapsePanel = useCallback(() => {
    setPanelSize('normal');
  }, []);

  // Select notification
  const selectNotification = useCallback((notification: InboxNotification | null) => {
    setSelectedNotification(notification);
    if (notification && notification.status === 'unread') {
      // Mark as read when selected
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, status: 'read', readAt: new Date() }
            : n
        )
      );
    }
  }, []);

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((notification) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          notification.header.senderBpn.toLowerCase().includes(searchLower) ||
          notification.content.information?.toLowerCase().includes(searchLower) ||
          notification.content.listOfItems.some(
            (item) =>
              item.catenaXId.toLowerCase().includes(searchLower) ||
              item.manufacturerPartId.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && notification.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }

      // Sender filter
      if (filters.senderBpn && notification.header.senderBpn !== filters.senderBpn) {
        return false;
      }

      return true;
    });
  }, [notifications, filters]);

  // Calculate priority based on expectedResponseBy
  const getPriority = useCallback(
    (notification: InboxNotification): 'urgent' | 'high' | 'normal' | 'low' => {
      if (!notification.header.expectedResponseBy) return 'normal';

      const now = new Date();
      const responseBy = new Date(notification.header.expectedResponseBy);
      const hoursRemaining = (responseBy.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursRemaining < 0) return 'urgent'; // Overdue
      if (hoursRemaining < 24) return 'urgent'; // Less than 24 hours
      if (hoursRemaining < 72) return 'high'; // Less than 3 days
      if (hoursRemaining < 168) return 'normal'; // Less than 7 days
      return 'low'; // More than 7 days
    },
    []
  );

  // Sort notifications
  const sortedFilteredNotifications = React.useMemo(() => {
    const sorted = [...filteredNotifications];

    switch (sortBy) {
      case 'expectedResponseBy':
        sorted.sort((a, b) => {
          const aDate = a.header.expectedResponseBy
            ? new Date(a.header.expectedResponseBy).getTime()
            : Infinity;
          const bDate = b.header.expectedResponseBy
            ? new Date(b.header.expectedResponseBy).getTime()
            : Infinity;
          return aDate - bDate; // Soonest first
        });
        break;
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        sorted.sort((a, b) => {
          return priorityOrder[getPriority(a)] - priorityOrder[getPriority(b)];
        });
        break;
      case 'receivedAt':
      default:
        sorted.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
        break;
    }

    return sorted;
  }, [filteredNotifications, sortBy, getPriority]);

  // Group notifications by sender
  const senderGroups = React.useMemo((): SenderGroup[] => {
    const groups = new Map<string, SenderGroup>();

    sortedFilteredNotifications.forEach((notification) => {
      const senderBpn = notification.header.senderBpn;
      const existingGroup = groups.get(senderBpn);

      if (existingGroup) {
        existingGroup.notifications.push(notification);
        if (notification.status === 'unread') {
          existingGroup.unreadCount++;
        }
        if (notification.receivedAt > existingGroup.lastActivity) {
          existingGroup.lastActivity = notification.receivedAt;
        }
      } else {
        // Check real partners first, then mock contacts
        const realPartner = realPartners.find((p) => p.bpnl === senderBpn);
        const mockContact = contacts.find((c) => c.bpnl === senderBpn);
        const contact: Contact = realPartner
          ? { bpnl: realPartner.bpnl, name: realPartner.name, isKnown: true }
          : mockContact || { bpnl: senderBpn, name: senderBpn, isKnown: false };

        groups.set(senderBpn, {
          sender: contact,
          notifications: [notification],
          unreadCount: notification.status === 'unread' ? 1 : 0,
          lastActivity: notification.receivedAt,
        });
      }
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  }, [sortedFilteredNotifications, contacts, realPartners]);

  // Statistics
  const stats = React.useMemo((): NotificationStats => {
    return {
      total: notifications.length,
      unread: notifications.filter((n) => n.status === 'unread').length,
      pendingFeedback: notifications.filter((n) => n.status === 'pending-feedback').length,
      feedbackSent: notifications.filter((n) => n.status === 'feedback-sent').length,
    };
  }, [notifications]);

  // Mark as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && n.status === 'unread'
          ? { ...n, status: 'read', readAt: new Date() }
          : n
      )
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === 'unread' ? { ...n, status: 'read', readAt: new Date() } : n
      )
    );
  }, []);

  // Verify a single digital twin
  const verifyDigitalTwin = useCallback(
    async (notificationId: string, catenaXId: string) => {
      // Set verifying status
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id !== notificationId) return n;
          return {
            ...n,
            verifiedItems: n.verifiedItems.map((vi) =>
              vi.item.catenaXId === catenaXId
                ? { ...vi, verificationStatus: 'verifying' as DigitalTwinVerificationStatus }
                : vi
            ),
          };
        })
      );

      // Simulate verification (would call real API)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Mock always succeeds - simulates successful Digital Twin access verification
      const isAccessible = true;

      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id !== notificationId) return n;
          return {
            ...n,
            verifiedItems: n.verifiedItems.map((vi) =>
              vi.item.catenaXId === catenaXId
                ? {
                    ...vi,
                    verificationStatus: isAccessible
                      ? ('accessible' as DigitalTwinVerificationStatus)
                      : ('not-accessible' as DigitalTwinVerificationStatus),
                    verifiedAt: new Date(),
                    verificationError: isAccessible ? undefined : 'Could not access digital twin',
                  }
                : vi
            ),
          };
        })
      );
    },
    []
  );

  // Verify all digital twins
  const verifyAllDigitalTwins = useCallback(
    async (notificationId: string) => {
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return;

      for (const verifiedItem of notification.verifiedItems) {
        if (verifiedItem.verificationStatus === 'not-verified') {
          await verifyDigitalTwin(notificationId, verifiedItem.item.catenaXId);
        }
      }
    },
    [notifications, verifyDigitalTwin]
  );

  // Send feedback
  const sendFeedback = useCallback(
    async (notificationId: string, feedback: FeedbackPayload) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: 'feedback-sent',
                feedbackSentAt: new Date(),
                feedbackResponse: feedback,
              }
            : n
        )
      );

      // Update selected notification if it's the one we just updated
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification((prev) =>
          prev
            ? {
                ...prev,
                status: 'feedback-sent',
                feedbackSentAt: new Date(),
                feedbackResponse: feedback,
              }
            : null
        );
      }
    },
    [selectedNotification]
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Get contact name (checks real partners first)
  const getContactName = useCallback(
    (bpnl: string): string => {
      const realPartner = realPartners.find((p) => p.bpnl === bpnl);
      if (realPartner) return realPartner.name;
      const contact = contacts.find((c) => c.bpnl === bpnl);
      return contact?.name || bpnl;
    },
    [contacts, realPartners]
  );

  // Check if BPN is in Contact List
  const isKnownContact = useCallback(
    (bpnl: string): boolean => {
      return realPartners.some((p) => p.bpnl === bpnl) || contacts.some((c) => c.bpnl === bpnl && c.isKnown);
    },
    [realPartners, contacts]
  );

  // Get stats helper
  const getStats = useCallback((): NotificationStats => stats, [stats]);

  const value: NotificationContextType = {
    isPanelOpen,
    panelSize,
    togglePanel,
    openPanel,
    closePanel,
    expandPanel,
    collapsePanel,
    setPanelSize,
    viewMode,
    setViewMode,
    selectedNotification,
    selectNotification,
    sortBy,
    setSortBy,
    notifications,
    filteredNotifications: sortedFilteredNotifications,
    senderGroups,
    stats,
    filters,
    setFilters,
    clearFilters,
    markAsRead,
    markAllAsRead,
    verifyDigitalTwin,
    verifyAllDigitalTwins,
    sendFeedback,
    contacts,
    realPartners,
    getContactName,
    isKnownContact,
    refreshPartners,
    getPriority,
    getStats,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

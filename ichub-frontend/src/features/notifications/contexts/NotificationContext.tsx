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

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Chat,
  ChatMessage,
  NotificationMessage,
  NotificationPanelSize,
  OutgoingMessage,
  Contact,
  ShareableAsset,
} from '../types';
import { getParticipantId } from '@/services/EnvironmentService';
import { fetchPartners } from '@/features/business-partner-kit/partner-management/api';
import { PartnerInstance } from '@/features/business-partner-kit/partner-management/types/types';
import { generateMockMessage } from '../services/mockNotificationService';

interface NotificationContextType {
  // Panel state
  isPanelOpen: boolean;
  panelSize: NotificationPanelSize;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  expandPanel: () => void;
  collapsePanel: () => void;

  // Chats
  chats: Chat[];
  activeChat: Chat | null;
  selectChat: (chatId: string) => void;
  closeChat: () => void;

  // Messages
  sendMessage: (message: OutgoingMessage) => void;
  markAsRead: (chatId: string, messageId?: string) => void;
  replyToMessage: (chatId: string, messageId: string) => void;
  cancelReply: () => void;
  replyingTo: ChatMessage | null;

  // Contacts
  contacts: Contact[];
  addContact: (bpn: string, name: string) => void;
  isKnownContact: (bpn: string) => boolean;
  getContactName: (bpn: string) => string;

  // Notifications count
  unreadCount: number;
  totalMessages: number;

  // Participant
  participantId: string;

  // Asset sharing
  shareAsset: (asset: ShareableAsset) => void;
  selectedAssets: ShareableAsset[];
  removeAsset: (assetId: string) => void;
  clearAssets: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<NotificationPanelSize>('quarter');
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [participantId, setParticipantId] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<ShareableAsset[]>([]);
  
  // Ref to track if mock messages have started
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load participant ID from environment
  useEffect(() => {
    const loadParticipantId = async () => {
      try {
        const id = await getParticipantId();
        if (id) {
          setParticipantId(id);
        }
      } catch (error) {
        console.warn('Could not fetch participant ID:', error);
      }
    };
    loadParticipantId();
  }, []);

  // Load contacts from backend
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const partners: PartnerInstance[] = await fetchPartners();
        setContacts(partners.map(p => ({ bpnl: p.bpnl, name: p.name })));
      } catch (error) {
        console.warn('Could not fetch contacts:', error);
      }
    };
    loadContacts();
  }, []);

  // Helper function to check if a BPN is a known contact
  const isKnownContact = useCallback((bpn: string): boolean => {
    return contacts.some(c => c.bpnl === bpn);
  }, [contacts]);

  // Helper function to get contact name by BPN
  const getContactName = useCallback((bpn: string): string => {
    const contact = contacts.find(c => c.bpnl === bpn);
    return contact?.name || bpn;
  }, [contacts]);

  // Process incoming notification message
  const processIncomingMessage = useCallback((notification: NotificationMessage) => {
    const { header, content } = notification;
    
    // Create internal chat message
    const chatMessage: ChatMessage = {
      id: header.messageId,
      senderId: header.senderBpn,
      senderName: getContactName(header.senderBpn),
      receiverId: header.receiverBpn,
      content: content.information || '',
      timestamp: new Date(header.sentDateTime),
      read: false,
      expectedResponseBy: header.expectedResponseBy ? new Date(header.expectedResponseBy) : undefined,
      affectedItems: content.listOfAffectedItems,
      context: header.context,
      version: header.version,
      isOwn: header.senderBpn === participantId,
    };

    setChats(prevChats => {
      // Find existing chat with this sender
      const existingChatIndex = prevChats.findIndex(
        c => c.participantBpn === header.senderBpn
      );

      if (existingChatIndex >= 0) {
        // Update existing chat
        const updatedChats = [...prevChats];
        const existingChat = updatedChats[existingChatIndex];
        
        updatedChats[existingChatIndex] = {
          ...existingChat,
          messages: [...existingChat.messages, chatMessage],
          unreadCount: existingChat.unreadCount + 1,
          lastMessage: chatMessage,
          lastActivity: chatMessage.timestamp,
          participantName: getContactName(header.senderBpn),
          isKnownContact: isKnownContact(header.senderBpn),
        };

        // Sort by last activity
        updatedChats.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        return updatedChats;
      } else {
        // Create new chat
        const newChat: Chat = {
          id: `chat-${header.senderBpn}`,
          participantBpn: header.senderBpn,
          participantName: getContactName(header.senderBpn),
          isKnownContact: isKnownContact(header.senderBpn),
          messages: [chatMessage],
          unreadCount: 1,
          lastMessage: chatMessage,
          lastActivity: chatMessage.timestamp,
        };

        const updatedChats = [newChat, ...prevChats];
        updatedChats.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        return updatedChats;
      }
    });

    // Update active chat if it's the same participant
    setActiveChat(prev => {
      if (prev && prev.participantBpn === header.senderBpn) {
        return {
          ...prev,
          messages: [...prev.messages, chatMessage],
          unreadCount: 0, // Mark as read since chat is active
          lastMessage: chatMessage,
          lastActivity: chatMessage.timestamp,
        };
      }
      return prev;
    });
  }, [participantId, getContactName, isKnownContact]);

  // Mock message generation every minute
  useEffect(() => {
    if (!participantId) return;

    // Clear existing interval
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
    }

    // Generate initial messages
    const generateInitialMessages = () => {
      // Generate 2 initial messages to populate the panel
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          const mockMessage = generateMockMessage(participantId);
          processIncomingMessage(mockMessage);
        }, i * 1000);
      }
    };

    generateInitialMessages();

    // Set up interval for new messages every minute
    mockIntervalRef.current = setInterval(() => {
      const mockMessage = generateMockMessage(participantId);
      processIncomingMessage(mockMessage);
    }, 60000); // Every minute

    return () => {
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
    };
  }, [participantId, processIncomingMessage]);

  // Panel controls
  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setActiveChat(null);
    setReplyingTo(null);
    setSelectedAssets([]);
  }, []);
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
    if (isPanelOpen) {
      setActiveChat(null);
      setReplyingTo(null);
      setSelectedAssets([]);
    }
  }, [isPanelOpen]);
  const expandPanel = useCallback(() => setPanelSize('expanded'), []);
  const collapsePanel = useCallback(() => setPanelSize('quarter'), []);

  // Chat operations
  const selectChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
      // Mark all messages as read
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({ ...m, read: true })) } : c
      ));
    }
  }, [chats]);

  const closeChat = useCallback(() => {
    setActiveChat(null);
    setReplyingTo(null);
    setSelectedAssets([]);
  }, []);

  // Message operations
  const sendMessage = useCallback((message: OutgoingMessage) => {
    if (!participantId) return;

    const now = new Date();
    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: participantId,
      senderName: 'You',
      receiverId: message.receiverBpn,
      content: message.content,
      timestamp: now,
      read: true,
      replyToId: message.replyToId,
      replyToContent: replyingTo?.content,
      isOwn: true,
    };

    setChats(prev => {
      const chatIndex = prev.findIndex(c => c.participantBpn === message.receiverBpn);
      
      if (chatIndex >= 0) {
        const updatedChats = [...prev];
        const existingChat = updatedChats[chatIndex];
        
        updatedChats[chatIndex] = {
          ...existingChat,
          messages: [...existingChat.messages, chatMessage],
          lastMessage: chatMessage,
          lastActivity: now,
        };

        updatedChats.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        return updatedChats;
      }
      
      return prev;
    });

    // Update active chat
    setActiveChat(prev => {
      if (prev && prev.participantBpn === message.receiverBpn) {
        return {
          ...prev,
          messages: [...prev.messages, chatMessage],
          lastMessage: chatMessage,
          lastActivity: now,
        };
      }
      return prev;
    });

    // Clear reply state
    setReplyingTo(null);
    setSelectedAssets([]);
  }, [participantId, replyingTo]);

  const markAsRead = useCallback((chatId: string, messageId?: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      
      if (messageId) {
        return {
          ...chat,
          messages: chat.messages.map(m => m.id === messageId ? { ...m, read: true } : m),
          unreadCount: Math.max(0, chat.unreadCount - 1),
        };
      }
      
      return {
        ...chat,
        messages: chat.messages.map(m => ({ ...m, read: true })),
        unreadCount: 0,
      };
    }));
  }, []);

  const replyToMessage = useCallback((chatId: string, messageId: string) => {
    const chat = chats.find(c => c.id === chatId);
    const message = chat?.messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo(message);
    }
  }, [chats]);

  const cancelReply = useCallback(() => setReplyingTo(null), []);

  // Contact operations
  const addContact = useCallback((bpn: string, name: string) => {
    setContacts(prev => {
      if (prev.some(c => c.bpnl === bpn)) return prev;
      return [...prev, { bpnl: bpn, name }];
    });
    
    // Update existing chat with new contact info
    setChats(prev => prev.map(chat => {
      if (chat.participantBpn === bpn) {
        return {
          ...chat,
          participantName: name,
          isKnownContact: true,
        };
      }
      return chat;
    }));
  }, []);

  // Asset sharing
  const shareAsset = useCallback((asset: ShareableAsset) => {
    setSelectedAssets(prev => {
      if (prev.some(a => a.id === asset.id)) return prev;
      return [...prev, asset];
    });
  }, []);

  const removeAsset = useCallback((assetId: string) => {
    setSelectedAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  const clearAssets = useCallback(() => setSelectedAssets([]), []);

  // Computed values
  const unreadCount = chats.reduce((acc, chat) => acc + chat.unreadCount, 0);
  const totalMessages = chats.reduce((acc, chat) => acc + chat.messages.length, 0);

  const value: NotificationContextType = {
    isPanelOpen,
    panelSize,
    openPanel,
    closePanel,
    togglePanel,
    expandPanel,
    collapsePanel,
    chats,
    activeChat,
    selectChat,
    closeChat,
    sendMessage,
    markAsRead,
    replyToMessage,
    cancelReply,
    replyingTo,
    contacts,
    addContact,
    isKnownContact,
    getContactName,
    unreadCount,
    totalMessages,
    participantId,
    shareAsset,
    selectedAssets,
    removeAsset,
    clearAssets,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

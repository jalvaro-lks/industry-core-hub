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

/**
 * Represents an affected item in a notification message (DTR assignment)
 */
export interface AffectedItem {
  digitalTwinId: string;
  assetId?: string;
  name?: string;
  submodelId?: string;
}

/**
 * Content structure of a notification message
 */
export interface NotificationContent {
  information: string;
  listOfAffectedItems?: AffectedItem[];
  [key: string]: unknown;
}

/**
 * Header structure of a notification message following the Industry Core standard
 */
export interface NotificationHeader {
  messageId: string;
  context: string;
  sentDateTime: string;
  senderBpn: string;
  receiverBpn: string;
  expectedResponseBy?: string;
  version: string;
}

/**
 * Complete notification message structure
 */
export interface NotificationMessage {
  header: NotificationHeader;
  content: NotificationContent;
}

/**
 * Internal chat message representation
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  expectedResponseBy?: Date;
  affectedItems?: AffectedItem[];
  context?: string;
  version?: string;
  replyToId?: string;
  replyToContent?: string;
  isOwn: boolean;
}

/**
 * Chat/Conversation with a contact
 */
export interface Chat {
  id: string;
  participantBpn: string;
  participantName: string;
  isKnownContact: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage?: ChatMessage;
  lastActivity: Date;
}

/**
 * Contact from the Contact List
 */
export interface Contact {
  bpnl: string;
  name: string;
}

/**
 * Notification panel state
 */
export type NotificationPanelSize = 'collapsed' | 'quarter' | 'expanded';

/**
 * Asset types that can be shared in chat
 */
export type ShareableAssetType = 'catalog-part' | 'serialized-part' | 'submodel' | 'digital-twin';

/**
 * Shareable asset structure
 */
export interface ShareableAsset {
  type: ShareableAssetType;
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message to send
 */
export interface OutgoingMessage {
  receiverBpn: string;
  content: string;
  replyToId?: string;
  sharedAssets?: ShareableAsset[];
}

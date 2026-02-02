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

import { NotificationMessage, AffectedItem } from '../types';

/**
 * Mock BPN senders for generating test messages
 * - 1 known contact (BPNL123456789102) that should be in the contact list
 * - 2 unknown contacts with random BPNs
 */
const MOCK_SENDERS = {
  known: {
    bpn: 'BPNL123456789102',
    name: 'Supplier Alpha', // This should match the contact list
  },
  unknown: [
    { bpn: 'BPNL999888777666', name: null },
    { bpn: 'BPNL555444333222', name: null },
  ],
};

/**
 * Sample messages that could be received in a dataspace context
 */
const SAMPLE_MESSAGES = [
  // Business messages
  'Hello, we would like to request access to your digital twin data for part verification.',
  'Thank you for the quality data. We have processed your last shipment successfully.',
  'Could you please share the latest PartAsPlanned submodel for the agreed parts?',
  'We noticed a discrepancy in the serial numbers. Please review and confirm.',
  'Your request for supply chain visibility has been approved.',
  'We need the updated BOM data for the assembly process.',
  'The PCF data looks good. We will proceed with the sustainability assessment.',
  'Can you provide the traceability information for batch #2024-Q4?',
  'Our quality team has approved the specifications. Ready for production.',
  'Please update the expected delivery date in your system.',
  
  // Technical messages
  'Digital Twin registration completed successfully.',
  'New submodel version available for your products.',
  'Data synchronization request received.',
  'EDC negotiation completed. Contract agreement established.',
  'Asset catalog updated with new entries.',
];

/**
 * Sample Digital Twin IDs for affected items
 */
const SAMPLE_DIGITAL_TWINS: AffectedItem[] = [
  {
    digitalTwinId: 'urn:uuid:f5efb5c5-3a2f-4a1e-b3d4-1234567890ab',
    assetId: 'urn:samm:io.catenax.part_as_planned:2.0.0',
    name: 'Brake Assembly v2.1',
  },
  {
    digitalTwinId: 'urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    assetId: 'urn:samm:io.catenax.serial_part:3.0.0',
    name: 'Electronic Control Unit',
  },
  {
    digitalTwinId: 'urn:uuid:12345678-90ab-cdef-1234-567890abcdef',
    assetId: 'urn:samm:io.catenax.batch:3.0.0',
    name: 'Lithium-Ion Battery Pack',
  },
];

/**
 * Context types for messages
 */
const CONTEXTS = [
  'IndustryCore-DigitalTwinEventAPI-ConnectToParent:3.0.0',
  'IndustryCore-DigitalTwinEventAPI-DataExchange:2.0.0',
  'IndustryCore-Notification-QualityAlert:1.0.0',
  'IndustryCore-Request-DataSync:1.0.0',
];

/**
 * Generates a random UUID
 */
const generateUUID = (): string => {
  return 'urn:uuid:' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Gets a random element from an array
 */
const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Generates a random date within the next 3-7 days for expected response
 */
const generateExpectedResponseDate = (): string => {
  const now = new Date();
  const daysToAdd = 3 + Math.floor(Math.random() * 5); // 3-7 days
  const futureDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return futureDate.toISOString();
};

/**
 * Counter to rotate through senders
 */
let senderIndex = 0;

/**
 * Generates a mock notification message
 * Rotates between the known contact and unknown contacts
 * 
 * @param receiverBpn - The BPN of the receiver (participant ID from index.html)
 * @returns A NotificationMessage object
 */
export const generateMockMessage = (receiverBpn: string): NotificationMessage => {
  // Rotate through senders: known, unknown1, unknown2, known, ...
  const senders = [MOCK_SENDERS.known, ...MOCK_SENDERS.unknown];
  const sender = senders[senderIndex % senders.length];
  senderIndex++;

  // Random message content
  const messageContent = getRandomElement(SAMPLE_MESSAGES);

  // 50% chance to include affected items
  const includeAffectedItems = Math.random() > 0.5;
  const affectedItems = includeAffectedItems
    ? [getRandomElement(SAMPLE_DIGITAL_TWINS)]
    : undefined;

  // 70% chance to include expected response
  const includeExpectedResponse = Math.random() > 0.3;

  const message: NotificationMessage = {
    header: {
      messageId: generateUUID(),
      context: getRandomElement(CONTEXTS),
      sentDateTime: new Date().toISOString(),
      senderBpn: sender.bpn,
      receiverBpn: receiverBpn,
      expectedResponseBy: includeExpectedResponse ? generateExpectedResponseDate() : undefined,
      version: '3.0.0',
    },
    content: {
      information: messageContent,
      listOfAffectedItems: affectedItems,
    },
  };

  return message;
};

/**
 * Generates multiple mock messages for initial population
 * 
 * @param receiverBpn - The BPN of the receiver
 * @param count - Number of messages to generate
 * @returns Array of NotificationMessage objects
 */
export const generateInitialMockMessages = (
  receiverBpn: string,
  count: number = 3
): NotificationMessage[] => {
  const messages: NotificationMessage[] = [];
  
  for (let i = 0; i < count; i++) {
    const message = generateMockMessage(receiverBpn);
    
    // Adjust timestamp to be in the past for initial messages
    const pastTime = new Date();
    pastTime.setMinutes(pastTime.getMinutes() - (count - i) * 15); // 15 min intervals
    message.header.sentDateTime = pastTime.toISOString();
    
    messages.push(message);
  }

  return messages;
};

export default {
  generateMockMessage,
  generateInitialMockMessages,
};

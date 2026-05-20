/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
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
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { useState, useCallback, useRef } from 'react';
import { NegotiationStatus } from '../../../types/types';
import {
  initiateNegotiation,
  checkNegotiationStatus,
  fetchTransferredCertificate,
} from '../../../api';

interface NegotiationState {
  status: NegotiationStatus;
  retrievedData: Record<string, unknown> | null;
  error: string | null;
}

interface UseNegotiationFlowResult {
  states: Record<string, NegotiationState>; // keyed by edcAssetId
  startNegotiation: (partnerBpn: string, edcAssetId: string) => Promise<void>;
}

/**
 * useNegotiationFlow — custom hook encapsulating the EDC contract negotiation
 * lifecycle for the Consumer tab.
 *
 * Flow per asset:
 *   1. initiateNegotiation  → gets negotiationId
 *   2. Poll checkNegotiationStatus every 2s (max 5 polls)
 *      → progresses: negotiating → transferring → completed | failed
 *   3. On 'completed', call fetchTransferredCertificate to get the payload
 *
 * Each asset (edcAssetId) has its own independent state entry so multiple
 * concurrent negotiations can be tracked without interference.
 */
export const useNegotiationFlow = (): UseNegotiationFlowResult => {
  const [states, setStates] = useState<Record<string, NegotiationState>>({});

  // Ref to avoid stale closures inside the polling interval
  const statesRef = useRef(states);
  statesRef.current = states;

  const updateState = useCallback((edcAssetId: string, update: Partial<NegotiationState>) => {
    setStates((prev) => ({
      ...prev,
      [edcAssetId]: {
        status: 'idle',
        retrievedData: null,
        error: null,
        ...prev[edcAssetId],
        ...update,
      },
    }));
  }, []);

  const startNegotiation = useCallback(
    async (partnerBpn: string, edcAssetId: string) => {
      updateState(edcAssetId, { status: 'negotiating', error: null, retrievedData: null });

      try {
        // Step 1: initiate the negotiation
        const { negotiationId } = await initiateNegotiation(partnerBpn, edcAssetId);

        // Step 2: poll for status updates
        let callCount = 0;
        const MAX_POLLS = 5;

        const poll = async (): Promise<void> => {
          if (callCount >= MAX_POLLS) {
            updateState(edcAssetId, { status: 'failed', error: 'Negotiation timed out.' });
            return;
          }

          callCount++;
          const { status, transferId } = await checkNegotiationStatus(negotiationId, callCount);

          updateState(edcAssetId, { status });

          if (status === 'failed') {
            updateState(edcAssetId, { error: 'EDC contract negotiation failed.' });
            return;
          }

          if (status === 'completed' && transferId) {
            // Step 3: fetch the actual certificate payload
            const data = await fetchTransferredCertificate(transferId);
            updateState(edcAssetId, { status: 'completed', retrievedData: data });
            return;
          }

          // Still in progress — wait 2s and poll again
          await new Promise<void>((resolve) => setTimeout(resolve, 2000));
          await poll();
        };

        await poll();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Negotiation failed unexpectedly.';
        updateState(edcAssetId, { status: 'failed', error: message });
      }
    },
    [updateState],
  );

  return { states, startNegotiation };
};

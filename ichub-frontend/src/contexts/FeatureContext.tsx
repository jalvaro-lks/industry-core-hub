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

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import { kits } from '@/features/main';
import { useTranslatedKits } from '@/hooks/useTranslatedKits';
import { FeatureConfig } from '@/types/routing';

interface FeatureState {
  [featureId: string]: boolean;
}

interface FeatureContextType {
  featureStates: FeatureState;
  toggleFeature: (kitId: string, featureId: string, enabled: boolean) => void;
  enabledFeatures: FeatureConfig[];
  featureOrder: string[];
  reorderFeatures: (newOrder: string[]) => void;
  // Kept for backwards compatibility — no longer used for ordering
  kitOrder: string[];
  featureOrderByKit: Record<string, string[]>;
  reorderKits: (newOrder: string[]) => void;
  reorderFeaturesInKit: (kitId: string, newOrder: string[]) => void;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

const FEATURE_STORAGE_KEY = 'ichub_feature_states';
const FEATURE_FLAT_ORDER_KEY = 'ichub_feature_flat_order';
// Legacy keys kept so existing localStorage data is not orphaned
const KIT_ORDER_STORAGE_KEY = 'ichub_kit_order';
const FEATURE_ORDER_STORAGE_KEY = 'ichub_feature_order_by_kit';

function initFeatureOrder(): string[] {
  const defaultOrder = kits.flatMap(k => k.features.map(f => f.id));
  const stored = localStorage.getItem(FEATURE_FLAT_ORDER_KEY);
  if (stored) {
    try {
      const parsed: string[] = JSON.parse(stored);
      const allIds = new Set(defaultOrder);
      const valid = parsed.filter(id => allIds.has(id));
      const added = defaultOrder.filter(id => !new Set(valid).has(id));
      return [...valid, ...added];
    } catch {
      // fall through
    }
  }
  return defaultOrder;
}

export const FeatureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const translatedKits = useTranslatedKits();

  const [featureStates, setFeatureStates] = useState<FeatureState>(() => {
    const stored = localStorage.getItem(FEATURE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored feature states:', error);
      }
    }
    const states: FeatureState = {};
    kits.forEach(kit => {
      kit.features.forEach(feature => {
        states[feature.id] = feature.enabled;
      });
    });
    return states;
  });

  const [featureOrder, setFeatureOrder] = useState<string[]>(initFeatureOrder);

  // Legacy order state — kept so nothing else breaks
  const [kitOrder, setKitOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem(KIT_ORDER_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    return kits.map(k => k.id);
  });

  const [featureOrderByKit, setFeatureOrderByKit] = useState<Record<string, string[]>>(() => {
    const stored = localStorage.getItem(FEATURE_ORDER_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    const order: Record<string, string[]> = {};
    kits.forEach(kit => { order[kit.id] = kit.features.map(f => f.id); });
    return order;
  });

  useEffect(() => {
    localStorage.setItem(FEATURE_STORAGE_KEY, JSON.stringify(featureStates));
  }, [featureStates]);

  useEffect(() => {
    localStorage.setItem(FEATURE_FLAT_ORDER_KEY, JSON.stringify(featureOrder));
  }, [featureOrder]);

  useEffect(() => {
    localStorage.setItem(KIT_ORDER_STORAGE_KEY, JSON.stringify(kitOrder));
  }, [kitOrder]);

  useEffect(() => {
    localStorage.setItem(FEATURE_ORDER_STORAGE_KEY, JSON.stringify(featureOrderByKit));
  }, [featureOrderByKit]);

  const toggleFeature = useCallback((kitId: string, featureId: string, enabled: boolean) => {
    const kit = translatedKits.find(k => k.id === kitId);
    const feature = kit?.features.find(f => f.id === featureId);
    if (feature?.default) return;
    setFeatureStates(prev => ({ ...prev, [featureId]: enabled }));
  }, [translatedKits]);

  const reorderFeatures = useCallback((newOrder: string[]) => {
    setFeatureOrder(newOrder);
  }, []);

  const reorderKits = useCallback((newOrder: string[]) => {
    setKitOrder(newOrder);
  }, []);

  const reorderFeaturesInKit = useCallback((kitId: string, newOrder: string[]) => {
    setFeatureOrderByKit(prev => ({ ...prev, [kitId]: newOrder }));
  }, []);

  // enabledFeatures now follows featureOrder (flat, cross-KIT)
  const enabledFeatures = useMemo(() => {
    type Entry = { id: string; name: string; icon?: React.ReactElement; module?: any };
    const featureMap = new Map<string, Entry>();
    translatedKits.forEach(kit => {
      kit.features.forEach(f => featureMap.set(f.id, f));
    });

    return featureOrder
      .map(id => featureMap.get(id))
      .filter((f): f is Entry => f != null && !!featureStates[f.id] && !!f.module)
      .map(f => ({
        ...f.module,
        name: f.name,
        icon: f.icon || f.module.icon,
      } as FeatureConfig));
  }, [featureStates, translatedKits, featureOrder]);

  return (
    <FeatureContext.Provider value={{
      featureStates,
      toggleFeature,
      enabledFeatures,
      featureOrder,
      reorderFeatures,
      kitOrder,
      featureOrderByKit,
      reorderKits,
      reorderFeaturesInKit,
    }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2026 LKS Next
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
 * License for the specific language govern in permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ********************************************************************************/

import { createContext, useContext, useState } from 'react';

interface PanelContextValue {
  showFeaturesPanel: boolean;
  showAllFeaturesPanel: boolean;
  setShowFeaturesPanel: (v: boolean) => void;
  setShowAllFeaturesPanel: (v: boolean) => void;
}

const PanelContext = createContext<PanelContextValue>({
  showFeaturesPanel: false,
  showAllFeaturesPanel: false,
  setShowFeaturesPanel: () => {},
  setShowAllFeaturesPanel: () => {},
});

export const PanelProvider = ({ children }: { children: React.ReactNode }) => {
  const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);
  const [showAllFeaturesPanel, setShowAllFeaturesPanel] = useState(false);

  return (
    <PanelContext.Provider value={{ showFeaturesPanel, showAllFeaturesPanel, setShowFeaturesPanel, setShowAllFeaturesPanel }}>
      {children}
    </PanelContext.Provider>
  );
};

export const usePanelContext = () => useContext(PanelContext);

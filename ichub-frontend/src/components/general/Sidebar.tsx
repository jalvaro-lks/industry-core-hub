/********************************************************************************
 * Eclipse Tractus-X - Industry Core Hub Frontend
 *
 * Copyright (c) 2026 Contributors to the Eclipse Foundation
 * Copyright (c) 2026 LKS Next
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

import { JSX, cloneElement, useRef, useEffect, useMemo } from "react";
import { Box } from "@mui/material";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Add, MoreHoriz } from '@mui/icons-material';
import { kitFeaturesConfig } from '../../features/main';
import FeaturesPanel from '../../features/kit-features/components/FeaturesPanel';
import AllFeaturesPanel from '../../features/kit-features/components/AllFeaturesPanel';
import SidebarTooltip from './SidebarTooltip';
import { useFeatures } from '../../contexts/FeatureContext';
import { usePanelContext } from '../../contexts/PanelContext';
import { NavigationItem } from '@/types/routing';

type SidebarItem = {
  icon: JSX.Element;
  path: string;
  disabled: boolean;
};

const Sidebar = ({ items: _items }: { items: SidebarItem[] }) => {
  const { t } = useTranslation('common');
  const { showFeaturesPanel, setShowFeaturesPanel, showAllFeaturesPanel, setShowAllFeaturesPanel } = usePanelContext();
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef<string>('/catalog');
  const isKitFeaturesActive = location.pathname === kitFeaturesConfig.navigationPath || location.pathname === '/';
  const { enabledFeatures } = useFeatures();
  
  // Convert enabled features to navigation items (no disabled placeholders — moved to utilityItems)
  const items: NavigationItem[] = useMemo(() => {
    return enabledFeatures
      .filter(feature => feature.icon)
      .map(feature => ({
        icon: feature.icon!,
        path: feature.navigationPath,
        disabled: feature.disabled
      }));
  }, [enabledFeatures]);
  
  // Guardar la ruta anterior cuando no estemos en KIT Features
  useEffect(() => {
    if (location.pathname !== kitFeaturesConfig.navigationPath && location.pathname !== '/') {
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);
  
  const handleKitFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isKitFeaturesActive) {
      // If we're already in KIT Features, go back to the previous page
      navigate(previousPath.current);
    } else {
      // If we're not in KIT Features, go to KIT Features
      navigate(kitFeaturesConfig.navigationPath);
    }
  };

  const handleAddFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFeaturesPanel(!showFeaturesPanel);
    setShowAllFeaturesPanel(false);
  };

  const handleAllFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAllFeaturesPanel(!showAllFeaturesPanel);
    setShowFeaturesPanel(false);
  };

  const handleCloseAllFeaturesPanel = () => {
    setShowAllFeaturesPanel(false);
  };

  const { toggleFeature } = useFeatures();
  
  const handleFeatureToggle = (kitId: string, featureId: string, enabled: boolean) => {
    toggleFeature(kitId, featureId, enabled);
  };

  const handleCloseFeaturesPanel = () => {
    setShowFeaturesPanel(false);
  };

  return (
    <Box className="sidebarContainer">
      <Box className="regularItems">
        {items.map((item, index) => {
          const isActive = location.pathname === item.path;
          const feature = enabledFeatures.find(f => f.navigationPath === item.path);
          const tooltipTitle = feature?.name || '';

          return (
            <SidebarTooltip key={index} title={tooltipTitle}>
              <NavLink
                to={item.path}
                className={`iconButton ${isActive ? "active" : ""}`}
                onClick={() => {}}
              >
                <Box className={`iconWrapper ${isActive ? 'active' : ''}`}>
                  {item.icon}
                </Box>
              </NavLink>
            </SidebarTooltip>
          );
        })}
      </Box>

      <Box className="utilityItems">
        <SidebarTooltip title={t('features.allFeatures')}>
          <Box
            className={`iconButton`}
            onClick={handleAllFeaturesClick}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <Box className={`iconWrapper all-features ${showAllFeaturesPanel ? 'active' : ''}`}>
              <MoreHoriz />
            </Box>
          </Box>
        </SidebarTooltip>

        <SidebarTooltip title={t('features.addFeatures')}>
          <Box
            className={`iconButton disabled`}
            onClick={handleAddFeatureClick}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <Box className={`iconWrapper disabled add-feature ${showFeaturesPanel ? 'active' : ''}`}>
              <Add />
            </Box>
          </Box>
        </SidebarTooltip>
      </Box>

      <Box className="fixedItems">
        <SidebarTooltip title={kitFeaturesConfig.name}>
          <Box
            className={`iconButton kitFeaturesButton ${isKitFeaturesActive ? 'active' : ''}`}
            onClick={handleKitFeaturesClick}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <Box className={`kitFeaturesIcon ${isKitFeaturesActive ? 'active' : ''}`}>
              {cloneElement(kitFeaturesConfig.icon as React.ReactElement<any>, { isActive: isKitFeaturesActive })}
            </Box>
          </Box>
        </SidebarTooltip>
      </Box>

      <FeaturesPanel
        isOpen={showFeaturesPanel}
        onClose={handleCloseFeaturesPanel}
        onFeatureToggle={handleFeatureToggle}
      />
      <AllFeaturesPanel
        isOpen={showAllFeaturesPanel}
        onClose={handleCloseAllFeaturesPanel}
      />
    </Box>
  );
};

export default Sidebar
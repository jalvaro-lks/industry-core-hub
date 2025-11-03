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

import { useState, JSX, cloneElement, useRef, useEffect } from "react";
import { Box } from "@mui/material";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { kitFeaturesConfig } from '../../features/main';

type SidebarItem = {
  icon: JSX.Element;
  path: string;
  disabled: boolean;
};

const Sidebar = ({ items }: { items: SidebarItem[] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const previousPath = useRef<string>('/catalog'); // Ruta por defecto
  const isKitFeaturesActive = location.pathname === kitFeaturesConfig.navigationPath;
  
  // Guardar la ruta anterior cuando no estemos en KIT Features
  useEffect(() => {
    if (location.pathname !== kitFeaturesConfig.navigationPath) {
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);
  
  const handleKitFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isKitFeaturesActive) {
      // Si ya estamos en KIT Features, volver a la página anterior
      navigate(previousPath.current);
    } else {
      // Si no estamos en KIT Features, ir a KIT Features
      navigate(kitFeaturesConfig.navigationPath);
    }
    setActiveIndex(-1);
  };

  return (
    <Box className="sidebarContainer">
      <Box className="regularItems">
        {items.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isDisabled = item.disabled === true;
          
          return (
            <NavLink
              to={item.path}
              key={index}
              className={`iconButton ${isActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
              onClick={() => setActiveIndex(index)}
            >
              <Box className={`iconWrapper ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}>
                {item.icon}
              </Box>
            </NavLink>
          );
        })}
      </Box>
      
      <Box className="fixedItems">
        <Box
          className={`iconButton kitFeaturesButton ${isKitFeaturesActive ? 'active' : ''}`}
          onClick={handleKitFeaturesClick}
          sx={{ cursor: 'pointer', textDecoration: 'none' }}
        >
          <Box className={`kitFeaturesIcon ${isKitFeaturesActive ? 'active' : ''}`}>
            {cloneElement(kitFeaturesConfig.icon as React.ReactElement<any>, { isActive: isKitFeaturesActive })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar
<!--
Eclipse Tractus-X - Industry Core Hub

Copyright (c) 2026 LKS Next
Copyright (c) 2026 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This work is made available under the terms of the
Creative Commons Attribution 4.0 International (CC-BY-4.0) license,
which is available at
https://creativecommons.org/licenses/by/4.0/legalcode.

SPDX-License-Identifier: CC-BY-4.0
-->

# KIT Features

> Manage and configure the features of each KIT integrated into the Industry Core Hub.

---

## Purpose

The KIT Features section is the central hub for managing Tractus-X KITs within the Industry Core Hub. KITs (Knowledge Integration Toolkits) are modular components that provide specific functionality for different use cases in the Catena-X ecosystem. This feature allows you to browse, enable, and manage which KIT features are available in your application.

KIT Features enables:
- **KIT Discovery**: Browse all available and upcoming KITs in an interactive carousel
- **Feature Management**: Enable or disable specific features within each KIT
- **Navigation Control**: Enabled features appear in the main sidebar navigation
- **Documentation Access**: Quick links to official Tractus-X KIT documentation
- **Customization**: Tailor your ICHub experience by selecting only the features you need

---

## Features

### Core Functionality
- **KIT Carousel**: Interactive card-based display of all KITs with smooth navigation
- **Feature Toggles**: Enable/disable individual features within each KIT
- **Status Indicators**: See which KITs are available, coming soon, or in development
- **Version Information**: View version numbers and last update dates

### Navigation
- **Keyboard Navigation**: Use arrow keys to browse the carousel
- **Click Navigation**: Click on any card to center it
- **Dot Navigation**: Click dots at the bottom to jump to specific KITs
- **Carousel Arrows**: Use left/right arrows for smooth sliding

### Integration
- **Sidebar Updates**: Enabled features automatically appear in the main navigation
- **Quick Access**: Jump directly to feature screens from KIT cards
- **Documentation Links**: Access official Tractus-X documentation for each KIT

---

## Available KITs

### 1. Industry Core KIT
**Status**: Available | **Category**: Core

The foundational KIT providing core data management capabilities:
- **Catalog Management**: Manage product catalogs and registrations
- **Serialized Parts**: Track and manage serialized components
- **Dataspace Discovery**: Discover and connect to data spaces

### 2. PCF KIT (Product Carbon Footprint)
**Status**: Available | **Category**: Sustainability

Environmental impact calculation tools:
- **Carbon Calculation**: Calculate product carbon footprints
- **Lifecycle Assessment**: Perform comprehensive LCA analysis
- **Emission Tracking**: Track and monitor emissions
- **Sustainability Reports**: Generate detailed reports

### 3. Data Chain KIT
**Status**: Coming Soon | **Category**: Collaboration

Secure data sharing and interoperability:
- Data Sharing capabilities
- Cross-platform Interoperability
- Chain Management
- Data Governance

### 4. Business Partner KIT
**Status**: Available | **Category**: Core

Business partner data management:
- **Contact List**: Define and manage data space participants (Name and BPNL)

### 5. DCM KIT (Demand & Capacity Management)
**Status**: Coming Soon | **Category**: Core

Supply chain optimization:
- Demand Planning
- Capacity Planning
- Resource Optimization
- Advanced Analytics

### 6. Eco Pass KIT
**Status**: Coming Soon | **Category**: Sustainability

Digital Product Passport functionality:
- Carbon Footprint tracking
- Environmental Impact assessment
- Sustainability Reports
- Green Metrics tracking

### 7. Traceability KIT
**Status**: Available | **Category**: Traceability

End-to-end traceability:
- Part Tracking
- Supply Chain Visibility
- Origin Verification
- Recall Management

---

## Usage Guide

### 1. Accessing KIT Features

#### From the Main Navigation
Navigate to **KIT Features** from the main sidebar menu.

> Captura de la barra lateral mostrando la opción "KIT Features" seleccionada y la vista principal del carrusel de KITs.

#### From the Sidebar Plus Button
Click the **"+"** button in the sidebar to quickly access KIT management.

> Captura del botón "+" en la barra lateral y el panel desplegable que muestra los KITs disponibles.

### 2. Navigating Between KITs

The main view displays KITs in an interactive carousel:

> Captura de la vista principal de KIT Features mostrando el carrusel con múltiples tarjetas de KIT, destacando el KIT central y los KITs laterales con efecto blur.

**Navigation Methods**:

1. **Arrow Buttons**: Click the left/right arrows on either side of the carousel
   > Captura de las flechas de navegación del carrusel (izquierda y derecha) con sus efectos hover.

2. **Keyboard Arrows**: Press ← or → keys to navigate
   
3. **Click on Cards**: Click any non-centered card to bring it to focus
   > Captura mostrando el cursor sobre una tarjeta lateral (no centrada) con el efecto hover.

4. **Dot Navigation**: Click the dots at the bottom to jump to specific KITs
   > Captura de la barra de puntos de navegación en la parte inferior, mostrando el punto activo destacado.

### 3. Opening a KIT and Viewing Features

Click on the centered KIT card to expand it and see available features:

> Captura de una tarjeta de KIT expandida/centrada mostrando el nombre, descripción, estado, versión y la lista de features disponibles.

Each KIT card displays:
- **KIT Name**: Title with icon
- **Description**: Purpose and capabilities
- **Status Badge**: Available / Coming Soon
- **Version**: Current version number
- **Last Updated**: Date of last update
- **Features List**: All features with toggle switches
- **Documentation Link**: Button to access official docs

### 4. Enabling/Disabling Features

Toggle individual features on or off:

1. Locate the feature you want to enable
2. Click the toggle switch next to the feature name
3. A notification confirms the change: "Feature X has been enabled/disabled"

> Captura de la lista de features de un KIT mostrando los toggle switches, con algunos habilitados (verde) y otros deshabilitados.

**Effect of Enabling Features**:
- The feature appears in the main sidebar navigation
- You can navigate directly to the feature screen
- Feature functionality becomes accessible

> Captura de la barra lateral mostrando una nueva opción de navegación que apareció después de habilitar una feature.

### 5. Accessing Official KIT Documentation

Each KIT card includes a link to official Tractus-X documentation:

1. Open a KIT card
2. Click the **"View Documentation"** or link icon
3. Official documentation opens in a new tab

> Captura del botón o enlace de documentación oficial en una tarjeta de KIT.

### 6. Navigating to Feature Screens

After enabling a feature, go directly to its screen:

**Option 1: From the KIT Card**
Click the feature name to navigate to its screen.

> Captura de un feature habilitado en la tarjeta de KIT con el enlace/botón para ir a la vista de ese feature.

**Option 2: From the Sidebar**
Click the newly appeared feature icon in the main sidebar.

> Captura de la barra lateral mostrando el feature recién habilitado y clickeable para navegar.

### 7. Using the Sidebar Quick Access

The sidebar "+" button provides fast KIT management:

1. Click **"+"** in the sidebar
2. Browse available KITs
3. Toggle features directly from the dropdown
4. Close the dropdown or click anywhere outside

> Captura del panel desplegable del sidebar mostrando la lista de KITs con sus features y toggles.

This is useful for quick feature toggling without navigating to the full KIT Features page.

---

## Carousel Visual Effects

The carousel uses visual effects to indicate focus:

| Position | Scale | Opacity | Blur |
|----------|-------|---------|------|
| **Centered** | 110% | 100% | None |
| **Adjacent** | 95% | 80% | Slight |
| **Second level** | 85% | 60% | Medium |
| **Far** | 75% | 30% | Heavy |

> Captura mostrando el efecto visual del carrusel con la tarjeta central más grande y clara, y las laterales progresivamente más pequeñas y difuminadas.

---

## KIT Status Reference

| Status | Description | Features |
|--------|-------------|----------|
| **Available** | Fully functional | Can be enabled/used |
| **Coming Soon** | In development | Visible but disabled |

---

## Tips

- **Start Simple**: Begin with Industry Core KIT features before exploring others
- **Check Dependencies**: Some features may require other features to be enabled first
- **Stay Updated**: Check version numbers and update dates for the latest capabilities
- **Read Documentation**: Use the documentation links to understand feature capabilities fully
- **Customize Navigation**: Only enable features you actively use to keep the sidebar clean
- **Keyboard Navigation**: Use arrow keys for fast browsing through KITs

---

## Related Features

- [Catalog Parts](ichub/CATALOG-PARTS.md): Part of Industry Core KIT
- [Serialized Parts](ichub/SERIALIZED-PARTS.md): Part of Industry Core KIT
- [Dataspace Discovery](ichub/DATASPACE-DISCOVERY.md): Part of Industry Core KIT
- [Contact List](business-partner/CONTACT-LIST.md): Part of Business Partner KIT
- [Passport Provision](eco-pass/DPP-PROVIDER-MANAGEMENT.md): Part of Eco Pass KIT
- [Passport Consumption](eco-pass/DPP-CONSUMER-VIEWER.md): Part of Eco Pass KIT

---

> For more information, see the main [Frontend Documentation](../FRONTEND-DOCUMENTATION.md).

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: https://github.com/eclipse-tractusx/industry-core-hub

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

# Catalog Parts

> Create, register, and publish Catalog Parts in the data space.

---

## Purpose

Catalog Parts (Part Types) are the foundation for managing and sharing product data in the Industry Core Hub. They represent the master data of your product catalog — the types of parts you manufacture or supply. Each Catalog Part defines the base characteristics of a product (such as name, description, category, dimensions, and materials) that can later be associated with individual serialized instances.

Catalog Parts serve as:
- **Master Data Repository**: Central definition of all your product types
- **Data Space Integration**: Enable digital twin creation and discovery by partners
- **Traceability Foundation**: Link serialized parts to their parent product definitions

---

## Features

### Core Functionality
- **Create Catalog Parts**: Define new product types with comprehensive metadata including name, description, category, dimensions, and material composition
- **View Catalog Parts**: Browse all your catalog parts in a card-based layout with pagination
- **Access Part Details**: View complete information about any catalog part including associated serialized parts
- **Update Catalog Parts**: Modify existing catalog part information (future feature)

### Data Space Operations
- **Register Catalog Parts**: Create a Digital Twin in the data space, making the part discoverable by authorized partners
- **Share Catalog Parts**: Publish catalog parts to specific business partners with optional customer part ID mapping
- **View Twin Status**: Track the lifecycle state of each part (Draft → Registered → Shared)

### Additional Features
- **View Submodels**: Access and manage submodels associated with registered parts (e.g., DPP - Digital Product Passport)
- **Add Serialized Parts**: Create individual part instances directly from the catalog part detail view
- **Material Composition Visualization**: View material breakdown with interactive pie charts

---

## Usage Guide

### 1. Accessing Catalog Parts

Navigate to the Catalog Parts section from the main sidebar menu.

> Captura de la barra lateral mostrando la opción "Catalog Parts" seleccionada y la vista principal de Catalog Parts con las tarjetas de productos listadas.

### 2. Creating a New Catalog Part

#### 2.1 Open the Creation Dialog
Click the **"Create Catalog Part"** button (green button with + icon) located at the top right of the page.

> Captura del botón "Create Catalog Part" en la esquina superior derecha de la vista de Catalog Parts.

#### 2.2 Fill in the Form
The creation dialog contains several sections:

**Basic Information (Required)**
- **Manufacturer Part ID**: Unique identifier for this part (auto-prefixed with your Manufacturer ID)
- **Name**: Commercial or technical name of the part
- **Description**: Detailed description of the part's purpose and characteristics
- **Category**: Classification category (select from presets or create custom: Mechanical Component, Electronic Sensor, Body Part)
- **BPNS**: Business Partner Number Site - identifies the manufacturing location

> Captura del formulario de creación mostrando la sección "Basic Information" con todos los campos visibles: Manufacturer Part ID, Name, Description, Category dropdown, y BPNS.

**Dimensions (Optional)**
- **Width**: Part width with unit selection (mm, cm, m, in, ft)
- **Height**: Part height with unit selection
- **Length**: Part length with unit selection
- **Weight**: Part weight with unit selection (kg, g, lb, oz)

> Captura de la sección "Dimensions" del formulario mostrando los campos de Width, Height, Length y Weight con sus selectores de unidades.

**Materials (Optional)**
Add material composition with percentage breakdown:
- Click **"Add Material"** to add a new material entry
- Enter material name and percentage share
- Visual pie chart updates in real-time showing distribution
- Ensure total percentage equals 100% for validation

> Captura de la sección "Materials" mostrando varios materiales añadidos con sus porcentajes y el gráfico circular de distribución de materiales.

#### 2.3 Create the Catalog Part
Once all required fields are filled:
1. Review the entered information
2. Click the **"Create"** button to save the catalog part
3. A success notification will appear confirming creation

> Captura del diálogo de creación completo con todos los campos rellenados y el botón "Create" habilitado.

### 3. Viewing the Created Catalog Part

After creation, the new catalog part appears in the main list:
- Cards display: Part Name, Category, Manufacturer Part ID, and Status
- Status badge shows current state: **Draft** (newly created)

> Captura de la vista principal de Catalog Parts mostrando la tarjeta del Catalog Part recién creado con estado "Draft".

### 4. Accessing Catalog Part Details

Click on any catalog part card to view its complete details:

> Captura de la vista de detalles de un Catalog Part mostrando toda la información: cabecera con estado, datos del producto (nombre, descripción, categorías, dimensiones, materiales), y tabla de Serialized Parts asociadas.

The detail view includes:
- **Header**: Status badge and action buttons (Update, Share dropdown)
- **Product Data**: Complete information including dimensions and materials
- **Shared Partners**: List of partners the part has been shared with
- **Serialized Parts Table**: All instances linked to this catalog part
- **Submodels Button**: Access to view associated submodels

### 5. Registering a Catalog Part (Creating Digital Twin)

Registration creates a Digital Twin in the data space, enabling discovery and data sharing.

#### From the Main List View
Click the **"Register"** button on the catalog part card:

> Captura de una tarjeta de Catalog Part con estado "Draft" mostrando el botón "Register" visible.

#### From the Detail View
Use the **Share dropdown** menu and select **"Register Twin"**:

> Captura de la vista de detalles mostrando el menú desplegable "Share" abierto con la opción "Register Twin" visible.

After registration:
- Status changes from **Draft** to **Registered**
- A PartType submodel is automatically created
- The part becomes available for sharing with partners

> Captura mostrando la notificación de éxito "Part twin registered successfully!" y el cambio de estado a "Registered".

### 6. Viewing the Created Part Type

After registration, you can view the automatically created PartType submodel:

1. Click **"View Submodels"** button in the detail view
2. The Submodels Grid Dialog shows all associated submodels
3. Click on a submodel to view its JSON structure

> Captura del diálogo "View Submodels" mostrando el PartType submodel creado automáticamente tras el registro.

### 7. Sharing a Catalog Part

Sharing enables specific partners to discover and access your catalog part.

#### From the Main List View
Click the **share icon** on any registered catalog part card:

> Captura de una tarjeta de Catalog Part con estado "Registered" mostrando el icono de compartir.

#### From the Detail View
Click the **"Share"** dropdown and select **"Share with Partner"**:

> Captura del menú desplegable "Share" en la vista de detalles con la opción "Share with Partner" seleccionada.

#### Share Dialog Options
1. **Select Partner**: Choose from your contact list or enter a BPNL manually
2. **Custom Part ID** (optional): Specify a customer-specific part identifier
3. Click **"Share"** to complete the operation

> Captura del diálogo "Share with partner" mostrando el selector de partner, el campo opcional de Customer Part ID, y el botón "Share".

After sharing:
- Status changes to **Shared**
- Partner information appears in the Shared Partners section
- The partner can now discover this part in their Dataspace Discovery

> Captura mostrando la notificación de éxito tras compartir y el estado actualizado a "Shared".

---

## Status Lifecycle

| Status | Description |
|--------|-------------|
| **Draft** | Part created but not registered in the data space |
| **Registered** | Digital Twin created, ready for sharing |
| **Shared** | Part shared with one or more business partners |
| **Pending** | Operation in progress |

---

## Tips

- **Unique IDs**: Use clear, unique Manufacturer Part IDs that follow your organization's naming conventions
- **Complete Metadata**: Fill in as much information as possible — detailed parts are more useful for partners
- **Material Accuracy**: Ensure material percentages total 100% for proper validation
- **Register Before Share**: A catalog part must be registered before it can be shared with partners
- **Contact List**: Add your business partners to the Contact List before sharing for easier selection

---

## Related Features

- [Serialized Parts](SERIALIZED-PARTS.md): Create individual instances of catalog parts
- [Dataspace Discovery](DATASPACE-DISCOVERY.md): How partners discover your shared parts
- [Contact List](CONTACT-LIST.md): Manage your business partners for sharing
- [Submodel Creator](../SUBMODEL_CREATOR_GUIDE.md): Create additional submodels for registered parts

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: https://github.com/eclipse-tractusx/industry-core-hub

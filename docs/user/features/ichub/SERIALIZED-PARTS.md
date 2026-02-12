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

# Serialized Parts

> Create, assign to Catalog Parts, register, and publish Serialized Parts.

---

## Purpose

Serialized Parts represent individual, unique instances of products in the Industry Core Hub. While Catalog Parts define the master data (the "what"), Serialized Parts track specific physical units (the "which one"). Each Serialized Part has a unique identifier (Part Instance ID) and is linked to a parent Catalog Part.

Serialized Parts enable:
- **Individual Tracking**: Track each physical unit throughout its lifecycle
- **Traceability**: Connect specific parts to their manufacturing origin and supply chain
- **Digital Twin Creation**: Create unique digital representations for each serialized unit
- **Data Sharing**: Share specific part instances with business partners

---

## Features

### Core Functionality
- **Create Serialized Parts**: Add new part instances linked to existing or new Catalog Parts
- **View Serialized Parts**: Browse all serialized parts in a data grid with sorting and filtering
- **Associate with Catalog Parts**: Link each serialized part to its parent product type
- **Business Partner Assignment**: Associate parts with their business partner origin

### Data Space Operations
- **Register Serialized Parts**: Create a Digital Twin for individual part instances
- **Share Serialized Parts**: Publish specific parts to business partners
- **Unshare Serialized Parts**: Revoke sharing access from partners
- **Delete Serialized Parts**: Remove part instances from the system

### Status Tracking
- **View Twin Status**: Track lifecycle state (Draft → Registered → Shared)
- **Copy Global Asset ID**: Quick access to the unique CX identifier
- **Copy DTR AAS ID**: Access the Digital Twin Registry shell identifier

---

## Usage Guide

### 1. Accessing Serialized Parts

Navigate to the **Serialized Parts** section from the main sidebar menu.

> Captura de la barra lateral mostrando la opción "Serialized Parts" seleccionada y la vista principal con la tabla de Serialized Parts.

The main view displays a data grid with columns:
- **Part Instance ID**: Unique identifier for this specific part
- **Manufacturer Part ID**: Link to the parent Catalog Part
- **Customer Part ID**: Optional customer-specific identifier
- **Business Partner**: Name and BPNL of the associated partner
- **Status**: Current lifecycle state
- **Actions**: Available operations

### 2. Creating a New Serialized Part

#### 2.1 Open the Creation Dialog
Click the **"Add"** button (green button with + icon) at the top of the data grid.

> Captura del botón "Add" para crear un nuevo Serialized Part en la vista principal.

#### 2.2 Fill in the Serialized Part Form (Step 1)
The dialog displays the first step for entering serialized part information:

**Required Fields**
- **Manufacturer ID**: Auto-filled with your organization's BPNL (read-only chip)
- **Manufacturer Part ID**: Select from existing Catalog Parts via autocomplete, or enter a new ID
- **Part Instance ID**: Unique identifier for this specific instance
- **Business Partner**: Select from your contact list

**Optional Fields**
- **VAN (Vehicle Application Number)**: Toggle to show/enter vehicle-specific identifier
- **Customer Part ID**: Toggle to show/enter customer-specific identifier

> Captura del formulario de creación de Serialized Part mostrando todos los campos: Manufacturer ID chip, Manufacturer Part ID autocomplete, Part Instance ID, Business Partner selector, y los checkboxes opcionales para VAN y Customer Part ID.

#### 2.3 Creating the Serialized Part

**Option 1: Link to an Existing Catalog Part**
If the Manufacturer Part ID matches an existing Catalog Part:
1. Fill in the Part Instance ID
2. Select the Business Partner
3. Click **"Create"** to create the serialized part

> Captura del formulario completado con un Manufacturer Part ID existente seleccionado del autocomplete y el botón "Create" habilitado.

**Option 2: Create a New Catalog Part**
If the Manufacturer Part ID doesn't exist, you'll be prompted to create a new Catalog Part:

1. After entering a non-existing Manufacturer Part ID, the system detects it's missing
2. A choice dialog appears with two options:
   - **Quick Creation**: Auto-generate minimal Catalog Part data
   - **Full Configuration**: Open Catalog Part form to enter complete details
3. Choose your preferred method

> Captura del diálogo de elección mostrando las dos opciones: "Quick Creation" (icono de rayo) y "Full Configuration" (icono de configuración) con sus descripciones.

If choosing **Full Configuration**:
1. Fill in the Catalog Part details (Name, Category, BPNS, etc.)
2. Click **"Create"** to create both the Catalog Part and Serialized Part

> Captura del formulario adicional de Catalog Part que aparece cuando se selecciona "Full Configuration", mostrando campos Name, Category, y BPNS.

### 3. Viewing Serialized Parts

After creation, serialized parts appear in the data grid:

#### From the Serialized Parts View
The main table shows all your serialized parts with their current status:
- **Draft**: Created but not registered
- **Registered**: Digital Twin created
- **Shared**: Published to partners

> Captura de la tabla de Serialized Parts mostrando varias filas con diferentes estados (Draft, Registered, Shared) y las columnas de información.

#### From the Catalog Part Detail View
Navigate to the parent Catalog Part and scroll to the **"Serialized Parts"** table:

> Captura de la vista de detalles de un Catalog Part mostrando la tabla de Serialized Parts asociados en la parte inferior.

### 4. Registering a Serialized Part

Registration creates a Digital Twin in the data space for the specific part instance.

1. Locate the serialized part in the data grid
2. Click the **"Register"** button (cloud upload icon) in the Actions column
3. Wait for the operation to complete
4. Status changes from **Draft** to **Registered**

> Captura de una fila de Serialized Part con estado "Draft" mostrando el botón de registro (icono de nube con flecha hacia arriba) en la columna de acciones.

After registration:
- A **Global Asset ID** is generated (copy button available)
- A **DTR AAS ID** is assigned (copy button available)

> Captura de la fila actualizada mostrando el estado "Registered" y los botones de copiar para Global Asset ID y DTR AAS ID.

### 5. Sharing a Serialized Part

Sharing makes the serialized part discoverable by your business partners.

1. Locate a **Registered** serialized part in the data grid
2. Click the **"Share"** button (share icon) in the Actions column
3. Confirm the sharing operation
4. Status changes from **Registered** to **Shared**

> Captura del botón de compartir en una fila con estado "Registered" y la confirmación de la operación de compartir.

### 6. Unsharing a Serialized Part

Revoke partner access to a previously shared part:

1. Locate a **Shared** serialized part
2. Click the **"Unshare"** button (link off icon)
3. Confirm the operation
4. Status returns to **Registered**

> Captura del botón de unshare (icono de link roto) visible en una fila con estado "Shared".

### 7. Deleting a Serialized Part

Remove a serialized part from the system:

1. Locate the serialized part (must be in **Draft** status)
2. Click the **"Delete"** button (trash icon)
3. Confirm deletion in the dialog
4. The part is removed from the system

> Captura del diálogo de confirmación de eliminación preguntando "Are you sure you want to delete this serialized part?"

**Note**: Only **Draft** serialized parts can be deleted. Registered or Shared parts must first be unregistered.

### 8. Additional Actions

#### Copying Identifiers
For registered parts, quick-copy buttons are available:
- **Copy Global Asset ID**: Click the copy icon next to the Global Asset ID
- **Copy DTR AAS ID**: Click the copy icon next to the DTR AAS ID

> Captura mostrando los botones de copiar con el tooltip "Copy Global Asset ID" visible.

#### Refreshing the Table
Click the **"Refresh"** button to reload the latest data from the backend.

> Captura del botón "Refresh" en la barra superior de la tabla.

---

## Status Lifecycle

| Status | Description | Available Actions |
|--------|-------------|-------------------|
| **Draft** | Part created, not registered | Register, Delete |
| **Registered** | Digital Twin created | Share, Copy IDs |
| **Shared** | Published to partners | Unshare, Copy IDs |

---

## Data Grid Features

The Serialized Parts table includes:
- **Sorting**: Click column headers to sort
- **Pagination**: Navigate through large datasets
- **Column Visibility**: Show/hide columns as needed
- **Row Selection**: Select multiple rows for batch operations (future)

---

## Tips

- **Unique Part Instance IDs**: Use serial numbers, batch codes, or other unique identifiers
- **Business Partner First**: Ensure the business partner exists in your Contact List before creating parts
- **Catalog Part Association**: Always verify the correct Manufacturer Part ID is selected
- **Status Awareness**: Remember that only Draft parts can be deleted
- **Copy & Paste**: Use the copy buttons to easily share identifiers with partners

---

## Related Features

- [Catalog Parts](CATALOG-PARTS.md): Create parent product types for serialized parts
- [Contact List](CONTACT-LIST.md): Manage business partners for association
- [Dataspace Discovery](DATASPACE-DISCOVERY.md): How partners discover shared serialized parts

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2026 LKS Next
- SPDX-FileCopyrightText: 2026 Contributors to the Eclipse Foundation
- Source URL: https://github.com/eclipse-tractusx/industry-core-hub

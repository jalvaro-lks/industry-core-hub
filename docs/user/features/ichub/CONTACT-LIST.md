# Contact List

> Define and manage data space participants (Name and BPNL).

---

## Purpose

The Contact List (Partners View) is the central registry for managing your business partners in the Industry Core Hub. Before you can share parts or discover data from other participants, you need to add them to your Contact List. Each contact consists of a human-readable name and a unique Business Partner Number Legal Entity (BPNL).

The Contact List enables:
- **Partner Identification**: Store partner names with their unique BPNL identifiers
- **Simplified Sharing**: Quick partner selection when sharing Catalog Parts or Serialized Parts
- **Discovery Source**: Define which partners to query during Dataspace Discovery
- **Central Management**: Single location to manage all your data space participants

---

## Features

### Core Functionality
- **Add Partners**: Create new partner entries with name and BPNL
- **View Partners**: Browse all partners in a card-based layout
- **Edit Partners**: Modify partner information (name changes)
- **Delete Partners**: Remove partners from your contact list

### Integration Points
- **Sharing Workflows**: Partners appear in autocomplete when sharing parts
- **Discovery Queries**: Select partners as targets for dataspace discovery
- **Business Partner Association**: Link serialized parts to specific partners

---

## Usage Guide

### 1. Accessing the Contact List

Navigate to the **Partners View** section from the main sidebar menu.

> Captura de la barra lateral mostrando la opción "Partners" o "Contact List" seleccionada y la vista principal con las tarjetas de partners.

The main view displays:
- **Title**: "Partners View"
- **Add Button**: Green "New" button to create partners
- **Partner Cards**: Grid of existing partners showing name and BPNL
- **Pagination**: Navigate through partner lists

### 2. Creating a New Partner

#### 2.1 Open the Creation Dialog
Click the **"New"** button (green button with + icon) at the top right of the page.

> Captura del botón "New" en la esquina superior derecha de la vista Partners.

#### 2.2 Fill in the Partner Form
The dialog presents two required fields:

**Required Fields**
- **Partner Name**: Human-readable name for the business partner (e.g., "BMW Group", "Supplier Co.")
- **BPNL**: Business Partner Number Legal Entity - the unique identifier in the Catena-X ecosystem (format: BPNL followed by alphanumeric characters)

> Captura del diálogo "Create new partner" mostrando los campos Name y BPNL con sus etiquetas y placeholders.

**BPNL Format Notes**:
- Must start with "BPNL"
- Contains alphanumeric characters after the prefix
- Is case-sensitive
- Example: `BPNL00000003CRHK`

> Captura del formulario con un ejemplo de datos rellenados: Name: "Test Supplier" y BPNL: "BPNL00000003CRHK".

#### 2.3 Create the Partner
1. Verify the entered information
2. Click the **"Create"** button
3. A success notification appears: "Partner [Name] created successfully [BPNL]"
4. The dialog closes and the new partner appears in the list

> Captura mostrando la notificación de éxito "Partner Test Supplier created successfully [BPNL00000003CRHK]" después de crear el partner.

### 3. Viewing Partners

After creation, partners appear as cards in the main view:

> Captura de la vista principal mostrando varias tarjetas de partners con sus nombres y BPNLs visibles.

Each partner card displays:
- **Partner Name**: Large text showing the company/partner name
- **BPNL**: The unique identifier displayed below the name
- **Action Icons**: Edit (pencil) and Delete (trash) buttons

### 4. Editing a Partner

Modify an existing partner's information:

1. Locate the partner card you want to edit
2. Click the **Edit** button (pencil icon) on the card
3. The edit dialog opens with pre-filled information
4. Modify the **Name** field (BPNL typically cannot be changed as it's an identifier)
5. Click **"Save"** or **"Update"** to apply changes

> Captura del diálogo de edición mostrando el formulario con los datos del partner cargados y el botón de guardar/actualizar.

**Note**: Editing a partner's name is a local update. The BPNL is the primary identifier and should remain constant.

### 5. Deleting a Partner

Remove a partner from your contact list:

1. Locate the partner card you want to delete
2. Click the **Delete** button (trash icon) on the card
3. The partner is removed from the list

> Captura de una tarjeta de partner con el cursor sobre el botón de eliminar (icono de papelera).

**Warning**: Deleting a partner does not affect:
- Previously shared parts with that partner
- Historical sharing records
- Data already exchanged

### 6. Using Partners in Other Features

#### In Sharing Dialogs
When sharing a Catalog Part or Serialized Part, partners from your Contact List appear in the autocomplete dropdown:

> Captura del diálogo de compartir mostrando el campo "Select Partner" con el autocomplete desplegado mostrando partners de la Contact List.

#### In Dataspace Discovery
When configuring discovery queries, select partners from your Contact List as discovery targets:

> Captura de la vista de Dataspace Discovery mostrando el selector de partner con opciones de la Contact List.

---

## Error Handling

### Validation Errors
The form validates:
- **Empty Fields**: Both name and BPNL are required
- **BPNL Format**: Must follow the standard BPNL format

> Captura del formulario mostrando un mensaje de error de validación cuando los campos están vacíos.

### API Errors
Common error scenarios:
- **Duplicate BPNL (409 Conflict)**: "Partner with this BPNL already exists"
- **Network Error**: "Network error. Please check your connection"
- **Timeout**: "Request timed out. Please try again"

> Captura mostrando un mensaje de error de API indicando que el partner ya existe.

---

## Tips

- **Consistent Naming**: Use official company names for clarity
- **Verify BPNL**: Double-check BPNL identifiers — typos will prevent successful sharing
- **Regular Updates**: Keep your contact list current as business relationships evolve
- **Add Before Share**: Always add a partner to your Contact List before attempting to share parts with them
- **Contact Other Teams**: If you don't know a partner's BPNL, contact their IT or data management team

---

## BPNL Reference

| Component | Description |
|-----------|-------------|
| **BPNL** | Business Partner Number Legal Entity |
| **Format** | BPNL + alphanumeric string |
| **Example** | BPNL00000003CRHK |
| **Purpose** | Uniquely identifies legal entities in Catena-X |

---

## Related Features

- [Catalog Parts](CATALOG-PARTS.md): Share parts with partners from your Contact List
- [Serialized Parts](SERIALIZED-PARTS.md): Associate parts with business partners
- [Dataspace Discovery](DATASPACE-DISCOVERY.md): Discover data from your contacts

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

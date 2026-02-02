# Passport Consumption & Visualization

> Discover, retrieve, and visualize Digital Product Passports from the data space using partner identifiers or specific twin IDs.

---

## Purpose

The Passport Consumption & Visualization feature allows users to access and view Digital Product Passports (DPPs) published in the Catena-X data space. This enables data consumers to retrieve product information from partners and suppliers without direct database access.

Key capabilities:
- **Data Space Discovery**: Find and retrieve Digital Twins from partner companies
- **Single Twin Search**: Directly access a specific Digital Twin by its AAS ID
- **Submodel Viewing**: Explore and visualize passport data in detail
- **DTR Information**: Access Digital Twin Registry metadata
- **Verifiable Credentials**: View and verify signed passport credentials

---

## Features

### Search Modes

#### 1. Discovery Search
Search for multiple Digital Twins from a partner's registry based on filters:
- Filter by Twin Type (Catalog/Serialized)
- Filter by Manufacturer Part ID
- Filter by Customer Part ID
- Filter by Global Asset ID
- Filter by Part Instance ID (for Serialized Parts)
- Paginated results with configurable limits

#### 2. Single Twin Search
Directly retrieve a specific Digital Twin using:
- Partner BPNL (Business Partner Number Legal)
- AAS ID (Asset Administration Shell Identifier)

### Results Visualization

#### Twin Overview
- Digital Twin type indicator
- Asset identifiers (Manufacturer Part ID, Customer Part ID, etc.)
- Global Asset ID
- Submodel count
- DTR source information

#### Submodel Carousel
- Preview submodels in a scrollable carousel
- See semantic ID and type for each submodel
- View verifiable credential badges
- Quick access to full submodel details

#### Submodel Viewer
- Full JSON content display
- Syntax highlighting
- Copy functionality
- Field navigation
- Schema information

---

## Usage Guide

### Accessing Passport Consumption

Navigate to **Dataspace Discovery** from the main sidebar.

> Captura de la barra lateral con la opción "Dataspace Discovery" seleccionada.

### Step 1: Select Search Mode

The interface offers two search modes at the top:

> Captura de los botones de selección de modo: "Discovery Search" y "Single Twin Search".

- **Discovery Search**: Find multiple twins with filters
- **Single Twin Search**: Retrieve a specific twin by ID

### Step 2: Select a Partner

Choose the partner (data provider) whose data you want to access:

> Captura del selector de partner mostrando el autocomplete con la lista de partners disponibles.

**Options**:
- Type to search partners by name or BPNL
- Select from dropdown list
- View partner name and BPNL displayed

If no partners appear:
- Check network connectivity
- Verify backend is running
- Click "Retry" if available

> Captura del estado de error de partners con el botón de retry.

### Method A: Discovery Search

#### Configure Search Filters

1. **Part Type Selection**:
   - Select "Catalog Parts" for PartType twins
   - Select "Serialized Parts" for PartInstance twins

> Captura del panel lateral de filtros mostrando los radio buttons de tipo de parte.

2. **Optional Filters**:
   Open the filters panel to set:
   - **Manufacturer Part ID**: Filter by manufacturer's part number
   - **Customer Part ID**: Filter by customer's part number
   - **Global Asset ID**: Filter by unique global identifier
   - **Part Instance ID**: (Only for Serialized Parts) Filter by instance ID

> Captura del panel de filtros expandido mostrando todos los campos de filtro.

3. **Page Limit**:
   Set how many results to retrieve per page:
   - Predefined options: 10, 25, 50, 100
   - Custom limit: Enter any value up to 1000
   - "All" option for no limit (use carefully)

> Captura del selector de límite de página con las opciones predefinidas y la opción de límite personalizado.

#### Execute Search

Click the **Search** button to start the discovery:

> Captura del botón de búsqueda y el indicador de carga durante la búsqueda.

The search process:
1. Contacts partner's EDC connector
2. Negotiates data access (first request may take ~10s)
3. Queries Digital Twin Registry
4. Returns matching twins

> Captura de la animación de carga con el mensaje de estado ("Searching...", "Negotiating access...").

#### Cancel Search

If needed, click **Cancel** to abort the search:

> Captura del botón de cancelar durante una búsqueda en progreso.

### Method B: Single Twin Search

#### Enter Twin Details

1. Select "Single Twin Search" mode
2. Enter the **AAS ID** of the specific twin

> Captura del campo de entrada para el AAS ID en modo Single Twin Search.

3. Click **Search** to retrieve

> Captura del botón de búsqueda en modo Single Twin con el AAS ID introducido.

### Step 3: View Search Results

#### Discovery Results: Catalog Parts

For Catalog Part searches, results display as cards:

> Captura de la vista de resultados para Catalog Parts mostrando múltiples tarjetas de productos.

Each card shows:
- Product name / Manufacturer Part ID
- Digital Twin Type badge
- DTR source indicator (color-coded)
- Submodel count
- Global Asset ID (truncated)
- Action buttons

**Card Actions**:
- **View Details**: Open the twin details
- **Download**: Export twin data as JSON

> Captura de una tarjeta de Catalog Part con hover mostrando los botones de acción.

#### Discovery Results: Serialized Parts

For Serialized Part searches, results display as a table:

> Captura de la vista de resultados para Serialized Parts en formato de tabla.

Table columns:
- AAS ID
- Manufacturer Part ID
- Part Instance ID
- Global Asset ID
- Submodel Count
- DTR Index
- Actions

**Table Features**:
- Sortable columns
- Row selection
- Pagination
- Download individual or selected

> Captura de la tabla de Serialized Parts con paginación y selección de filas.

#### Single Twin Results

For single twin search, detailed information displays immediately:

> Captura de la vista de resultados para Single Twin mostrando la información completa del twin.

### Step 4: DTR Information

Click the **DTR Details** button to view Digital Twin Registry information:

> Captura del botón "DTR Details" y el diálogo que se abre mostrando la información del DTR.

DTR Information includes:
- **Connector URL**: EDC connector endpoint
- **Asset ID**: DTR asset identifier
- Copy buttons for each value

> Captura del diálogo de información del DTR con los campos de Connector URL y Asset ID.

### Step 5: Browse Submodels

#### Submodel Carousel

Scroll through available submodels:

> Captura del carrusel de submodels mostrando múltiples tarjetas de submodel.

Each submodel card shows:
- **Semantic ID**: Schema identifier
- **Model Name**: Parsed schema name
- **Version**: Schema version
- **Verifiable Credential Badge**: If signed

> Captura de una tarjeta de submodel mostrando el nombre, versión y badge de credencial verificable.

**Navigation**:
- Use arrows to scroll left/right
- Click "View All Submodels" for complete list

> Captura de las flechas de navegación del carrusel y el botón "View All Submodels".

#### Verifiable Credentials

Submodels with verifiable credentials show:
- Lock icon badge
- Credential type
- Signature type (e.g., JWS 2020)
- W3C version

> Captura de un submodel con credencial verificable mostrando el badge de seguridad y la información de firma.

### Step 6: View Submodel Details

Click **Retrieve Submodel** on any submodel card:

> Captura del botón "Retrieve Submodel" en una tarjeta de submodel.

The Submodel Viewer opens:

> Captura del Submodel Viewer mostrando el contenido JSON del submodel con syntax highlighting.

**Viewer Features**:

1. **JSON View**:
   - Full submodel content
   - Syntax highlighting
   - Collapsible sections
   - Line numbers

> Captura del JSON View del submodel con secciones colapsables.

2. **Schema Information**:
   - Semantic ID
   - Model name and version
   - Namespace

> Captura del panel de información del schema en el Submodel Viewer.

3. **Copy Options**:
   - Copy full JSON
   - Copy specific values
   - Download as file

> Captura de los botones de copia y descarga en el Submodel Viewer.

4. **Navigation**:
   - Scroll through content
   - Search within JSON
   - Expand/collapse all

### Step 7: Pagination (Discovery Mode)

For large result sets, use pagination:

> Captura de los controles de paginación mostrando "Page 1 of X" y botones de navegación.

- **Previous**: Load previous page
- **Next**: Load next page
- Page indicator shows current position

> Captura del indicador de carga durante la navegación entre páginas.

### Step 8: Return to Search

Click **Back** or **New Search** to return to the search form:

> Captura del botón de volver a la búsqueda desde la vista de resultados.

---

## Understanding DTR Colors

When searching across multiple DTRs, results are color-coded:

| Color | Description |
|-------|-------------|
| 🟢 Green | First DTR source |
| 🔵 Blue | Second DTR source |
| 🟠 Orange | Third DTR source |
| 🟣 Purple | Fourth DTR source |
| 🔴 Red | Fifth DTR source |
| ... | Additional colors cycle |

> Captura mostrando resultados de múltiples DTRs con diferentes colores indicando la fuente.

---

## Verifiable Credentials Reference

| Indicator | Meaning |
|-----------|---------|
| 🔒 Lock Badge | Signed with verifiable credential |
| **JWS 2020** | JSON Web Signature 2020 format |
| **W3C v2** | W3C Verifiable Credentials v2.0 |

> Captura de un submodel con credencial verificable mostrando todos los indicadores.

---

## Tips

- **First Search Takes Longer**: Initial access negotiation may take ~10 seconds
- **Use Filters**: Narrow results with specific filters for faster searches
- **Check DTR Source**: Color-coded badges help identify data sources
- **Copy IDs**: Click chips or use copy buttons for quick ID copying
- **Download Data**: Export twin data as JSON for offline analysis
- **Verifiable Credentials**: Look for lock badges to identify signed passports

---

## Troubleshooting

### "Failed to load partners" Error
1. Check backend connectivity
2. Verify authentication
3. Click Retry button

### Search Times Out
1. Try with smaller page limit
2. Use more specific filters
3. Check partner EDC availability

### No Results Found
1. Verify BPNL is correct
2. Check filter values
3. Ensure partner has published data
4. Try Single Twin Search with known AAS ID

### Submodel Retrieval Fails
1. Check network connectivity
2. Verify access permissions
3. Try refreshing the page

---

## Related Features

- [Passport Provision](DPP-PROVIDER-MANAGEMENT.md): Create and publish passports
- [Dataspace Discovery](../ichub/DATASPACE-DISCOVERY.md): General discovery documentation
- [Contact List](../ichub/CONTACT-LIST.md): Manage partner information
- [Catalog Parts](../ichub/CATALOG-PARTS.md): Manage local product catalog

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

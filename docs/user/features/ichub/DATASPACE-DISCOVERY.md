# Dataspace Discovery

> Consume Catalog and Serialized Parts published by your contacts.

---

## Purpose

Dataspace Discovery is the consumer-facing feature that allows you to search for and retrieve data from business partners in the Catena-X ecosystem. It enables you to discover Digital Twins (Catalog Parts and Serialized Parts) that your partners have shared with you.

Dataspace Discovery provides:
- **Partner Data Access**: Query data from partners in your Contact List
- **Flexible Search**: Filter by part type, identifiers, and various parameters
- **Twin Visualization**: View detailed information about discovered Digital Twins
- **Multiple Search Modes**: Discovery search or single twin lookup
- **DTR Integration**: Connect to partners' Digital Twin Registries

---

## Features

### Search Capabilities
- **Partner Selection**: Choose which partner to query from your Contact List
- **Part Type Filtering**: Search specifically for Catalog Parts or Serialized Parts
- **Identifier Filters**: Filter by Manufacturer Part ID, Customer Part ID, Global Asset ID, or Part Instance ID
- **Paginated Results**: Configure how many results to retrieve per page
- **Custom Limits**: Set specific result limits for large queries

### Search Modes
- **Discovery Mode**: Broad search across partner's DTR with filtering options
- **Single Twin Mode**: Direct lookup of a specific AAS by its ID

### Results Display
- **Catalog Parts View**: Card-based display of PartType twins
- **Serialized Parts Table**: Data grid for SerializedPart twins
- **Twin Details**: Expanded view with submodel information
- **DTR Information**: See which DTR(s) returned results

### Data Actions
- **Copy Identifiers**: Quick copy of Global Asset IDs and AAS IDs
- **Download Twin Data**: Export raw twin data as JSON
- **View Twin Details**: Inspect submodels and metadata

---

## Usage Guide

### 1. Accessing Dataspace Discovery

Navigate to the **Dataspace Discovery** section from the main sidebar menu.

> Captura de la barra lateral mostrando la opción "Dataspace Discovery" seleccionada y la vista principal de búsqueda.

The main view consists of:
- **Search Header**: Partner selection and search mode toggle
- **Filter Sidebar**: Additional filtering options (shown when sidebar is open)
- **Search Button**: Execute the discovery query
- **Results Area**: Display of found twins

### 2. Configuring Your Search

#### 2.1 Select a Partner
Choose a business partner from your Contact List using the autocomplete dropdown:

> Captura del selector de partner (autocomplete) mostrando la lista desplegable con partners disponibles de la Contact List.

**Note**: If no partners appear, first add them via the [Contact List](CONTACT-LIST.md) feature.

#### 2.2 Configure Filters (Sidebar)
Click to open the filter sidebar for advanced options:

> Captura de la barra lateral de filtros mostrando todas las opciones de configuración: Part Type, Page Limit, y los campos de filtrado adicionales.

**Part Type Selection**
- **Catalog**: Search for PartType twins (product definitions)
- **Serialized**: Search for SerializedPart twins (specific instances)

> Captura de los radio buttons de selección de Part Type mostrando las opciones "Catalog" y "Serialized".

**Page Limit**
Configure how many results to retrieve:
- Preset options: 5, 10, 20, 50, 100
- Custom limit: Enter a specific number

> Captura del selector de Page Limit mostrando las opciones predefinidas y el campo de límite personalizado.

**Identifier Filters**
Narrow your search with specific identifiers:
- **Customer Part ID**: Filter by customer-specific identifier
- **Manufacturer Part ID**: Filter by manufacturer's part number
- **Global Asset ID**: Search by unique CX identifier
- **Part Instance ID**: (Serialized only) Filter by instance ID

> Captura de los campos de filtrado de identificadores: Customer Part ID, Manufacturer Part ID, Global Asset ID, y Part Instance ID.

### 3. Executing the Search

#### 3.1 Start the Search
Click the **"Search"** button to execute the discovery query.

> Captura del botón "Search" con el icono de búsqueda junto al campo de selección de partner.

#### 3.2 Loading Animation
A loading indicator shows while the query is being processed:

> Captura de la animación de carga durante la búsqueda, mostrando el indicador de progreso.

**Cancel Search**: If needed, click **"Cancel"** to abort a long-running search.

### 4. Viewing Search Results

#### 4.1 Catalog Parts Results
When searching for Catalog Parts, results display as cards:

> Captura de los resultados de búsqueda mostrando tarjetas de Catalog Parts con información como Manufacturer Part ID, nombre, categoría, y número de submodels.

Each card shows:
- **Manufacturer ID / Manufacturer Part ID**
- **Customer Part ID** (if available)
- **Digital Twin Type**: PartType
- **Submodel Count**: Number of associated submodels
- **DTR Badge**: Which DTR returned this result

> Captura de una tarjeta de resultado de Catalog Part mostrando todos los campos de información y el badge del DTR.

#### 4.2 Serialized Parts Results
When searching for Serialized Parts, results display in a data table:

> Captura de la tabla de resultados de Serialized Parts mostrando columnas como Part Instance ID, Manufacturer Part ID, Global Asset ID, y acciones.

Table columns include:
- **Part Instance ID**
- **Manufacturer Part ID**
- **Customer Part ID**
- **Digital Twin Type**: SerializedPart
- **Submodel Count**
- **Actions**: View details, copy, download

### 5. Viewing Twin Details

Click on any result to view its detailed information:

> Captura del panel de detalles expandido mostrando la información completa del twin, incluyendo metadatos y lista de submodels.

The detail view shows:
- **Complete Metadata**: All twin attributes
- **Submodels List**: Available submodels with their semantic IDs
- **Raw Data Preview**: JSON structure of the twin

> Captura de la vista de detalle de un twin mostrando la sección de submodels con sus semantic IDs.

### 6. Single Twin Search Mode

Switch to Single Twin mode for direct AAS lookup:

1. Toggle to **"Single Twin"** search mode
2. Enter the partner's BPNL
3. Enter the specific **AAS ID** you want to retrieve
4. Click **"Search"**

> Captura del modo Single Twin mostrando el campo de AAS ID y el botón de búsqueda.

This mode is useful when you know the exact AAS identifier and want to retrieve a specific twin directly.

> Captura del resultado de una búsqueda Single Twin mostrando el twin encontrado con todos sus detalles.

### 7. DTR Information Section

When results are returned, a DTR information section shows:

> Captura de la sección DTR Information mostrando información sobre los Digital Twin Registries consultados.

**Toggle DTR Section**: Click to expand/collapse DTR details.

The section displays:
- **DTR Index**: Color-coded DTR identifier
- **Connector URL**: Partner's EDC connector endpoint
- **Asset ID**: DTR asset identifier
- **Shell Count**: Number of twins from this DTR

> Captura de la sección DTR expandida mostrando los detalles de cada DTR consultado con sus colores distintivos.

**Navigation**: Use carousel arrows to browse multiple DTRs when partners have several registries.

### 8. Additional Actions

#### Copy Identifiers
Click copy buttons to quickly copy:
- **Global Asset ID**: Unique CX identifier
- **AAS ID**: Asset Administration Shell ID
- **Connector URL**: Partner's EDC endpoint

> Captura de los botones de copiar en una tarjeta de resultado mostrando los tooltips.

#### Download Twin Data
Export the raw twin data as JSON:

1. Click the **"Download"** button on any result
2. A JSON file is downloaded with the complete twin structure

> Captura del botón de descarga en una tarjeta de resultado.

#### Pagination
Navigate through results using pagination controls:

> Captura de los controles de paginación mostrando botones Previous/Next y el indicador de página actual.

---

## Search Flow Summary

```
1. Select Partner → 2. Configure Filters → 3. Execute Search → 4. View Results → 5. Inspect Details
```

---

## Tips

- **Start Broad**: Begin with fewer filters to see all available data, then narrow down
- **Check Contact List**: Ensure your partner is added before attempting discovery
- **Use Specific IDs**: When looking for a known twin, use Global Asset ID for fastest results
- **Monitor DTRs**: The DTR section helps understand which registry returned which results
- **Page Limits**: Start with smaller limits (10-20) for faster response times
- **Cancel Long Queries**: Don't hesitate to cancel searches that take too long

---

## Error Handling

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| "Please enter a partner BPNL" | No partner selected | Select a partner from dropdown |
| "No results found" | No matching twins | Broaden filters or check partner data |
| "Request timeout" | Network/server issues | Retry or reduce page limit |
| "Failed to load partners" | Backend connectivity | Check connection, retry |

---

## Related Features

- [Contact List](CONTACT-LIST.md): Add partners to enable discovery
- [Catalog Parts](CATALOG-PARTS.md): Understand what Catalog Parts are
- [Serialized Parts](SERIALIZED-PARTS.md): Understand what Serialized Parts are

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

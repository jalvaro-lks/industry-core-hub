# Passport Provision & Management

> Create, manage, and publish Digital Product Passports using a guided wizard with schema validation.

---

## Purpose

The Passport Provision & Management feature enables manufacturers and data providers to create Digital Product Passports (DPPs) for their products. DPPs contain comprehensive information about a product's characteristics, sustainability data, materials, and more, following standardized Catena-X schemas.

This feature provides:
- **Schema-Based Creation**: Use validated JSON schemas for consistent data structure
- **Guided Wizard**: Step-by-step process with real-time validation
- **Flexible Data Entry**: Support for all field types including arrays, objects, and enumerations
- **JSON Import/Export**: Import existing data or export for review
- **Validation Engine**: Ensure compliance before publishing to the data space

---

## Features

### Core Functionality
- **Multi-Schema Support**: Create passports using different schema versions (e.g., DPP v6.1.0)
- **Dynamic Form Generation**: Forms automatically generated from JSON schemas
- **Real-Time Validation**: Validate data against schema rules before submission
- **Field-Level Guidance**: Tooltips and descriptions for every field
- **Grouped Sections**: Organized form sections (Metadata, Identification, Materials, etc.)

### Data Entry Options
- **Manual Entry**: Fill in each field individually through the form interface
- **JSON Import**: Import pre-filled JSON data to populate the form
- **Copy/Paste Values**: Click to copy field values (IDs, URNs, etc.)
- **Array Management**: Add, edit, and remove items in array fields
- **Nested Objects**: Navigate complex nested data structures

### Validation & Submission
- **Schema Validation**: Validate against Catena-X schema requirements
- **Error Navigation**: Jump to fields with validation errors
- **Rules Viewer**: See all validation rules for the selected schema
- **JSON Preview**: Review generated JSON before submission
- **Submodel Creation**: Create and attach to Digital Twin

---

## Available Schemas

The system supports multiple schema versions. Currently available:

### Digital Product Passport (DPP) v6.1.0
**SemanticID**: `urn:samm:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport`

Key sections include:
- **Metadata**: Passport identifier, registration, status, validity
- **Identification**: Product identifiers, manufacturer information
- **Operation**: Operating conditions, usage information
- **Handling**: Handling instructions, producer/importer info
- **Product Characteristics**: Physical characteristics, categorization
- **Commercial Information**: Warranty, commercial conditions
- **Materials**: Material composition, hazardous substances
- **Sustainability**: Carbon footprint, environmental impact
- **Sources & Documentation**: Documentation links, references
- **Additional Data**: Custom fields, extensions

---

## Usage Guide

### Prerequisites

Before creating a Digital Product Passport, ensure:
1. You have a **Catalog Part** created in the system
2. The Catalog Part has a **Digital Twin** (created or pending)
3. You have the necessary data to fill in required fields

### Step 1: Navigate to Product Details

1. Go to **Catalog Parts** in the sidebar
2. Find and click on your product to open its details
3. Navigate to the **Submodels** section

> Captura de la vista de detalle de un Catalog Part mostrando la sección de Submodels con el botón para crear nuevo submodel.

### Step 2: Initiate Submodel Creation

Click the **"Create Submodel"** or **"+"** button in the Submodels section.

> Captura del botón "Create Submodel" o "+" en la sección de Submodels de un producto.

### Step 3: Select Schema Template

A dialog displays available schema templates:

> Captura del diálogo de selección de esquema (SchemaSelector) mostrando las tarjetas de esquemas disponibles con nombre, versión, descripción y namespace.

Each schema card shows:
- **Schema Name**: Full name (e.g., "Digital Product Passport")
- **Version Badge**: Version number (e.g., "v6.1.0")
- **Description**: Purpose and scope of the schema
- **Namespace**: Technical identifier

**Actions**:
- Click on a schema card to select it
- Use "Read more" to see full description
- Click the namespace chip to copy it

> Captura de una tarjeta de esquema expandida mostrando la descripción completa con el botón "Show less" y el namespace copiable.

### Step 4: Understanding the Submodel Creator Interface

After selecting a schema, the Submodel Creator opens:

> Captura de la vista completa del SubmodelCreator mostrando el AppBar con título, la sección Target Product, la barra de acciones sticky y el formulario.

**Interface Elements**:

1. **App Bar (Top)**:
   - Back arrow: Return to schema selection
   - Title: "Create New Submodel - [Schema Name]"
   - Subtitle: Twin ID and Semantic ID
   - Close button: Exit wizard

2. **Target Product Section**:
   - Manufacturer Part ID chip (clickable to copy)
   - Twin ID chip (if created)
   - AAS ID chip (if available)

> Captura de la sección "Target Product" con los chips de Manufacturer Part ID, Twin ID y AAS ID, mostrando el tooltip al hacer hover.

3. **Sticky Action Bar**:
   - Validation status message
   - Validate button
   - Create Submodel button

> Captura de la barra de acciones sticky mostrando el mensaje de estado, botón de validación y botón de crear submodel.

4. **Two-Column Layout**:
   - **Left**: Dynamic form with grouped sections
   - **Right**: Preview panel (JSON, Errors, Rules)

### Step 5: Fill in Form Data

#### Navigating Form Sections

The form is organized into expandable accordion sections:

> Captura del formulario con múltiples secciones accordion (Metadata, Identification, etc.) mostrando una sección expandida y otras colapsadas.

Each section shows:
- Section name with icon
- Count of required fields
- Expand/collapse arrow

#### Field Types

**Text Fields**:
Standard text input with label, helper text, and required indicator.

> Captura de un campo de texto mostrando label, placeholder, texto de ayuda y asterisco de campo requerido.

**Select/Dropdown Fields**:
Choose from predefined options.

> Captura de un campo select/dropdown abierto mostrando las opciones disponibles.

**Array Fields**:
Add multiple items with "+" button.

> Captura de un campo de tipo array con el botón "+" para añadir elementos, mostrando varios items ya añadidos con botones de eliminar.

**Nested Object Fields**:
Complex fields with sub-fields organized in groups.

> Captura de un campo de objeto anidado mostrando sub-campos organizados.

**Date/DateTime Fields**:
Date picker with calendar interface.

> Captura del selector de fecha mostrando el calendario desplegable.

### Step 6: Import JSON Data (Optional)

If you have pre-prepared JSON data:

1. Click the **Import JSON** button in the toolbar
2. Paste or upload your JSON content
3. The form automatically populates with the imported data

> Captura del diálogo de importación JSON con el área de texto para pegar JSON y los botones de acción.

### Step 7: Preview Panel Options

The right panel offers three views:

#### JSON View (Default)
Shows the generated JSON in real-time as you fill the form.

> Captura del panel de preview en modo JSON mostrando el JSON generado con syntax highlighting y campo resaltado.

Features:
- Syntax highlighting
- Field highlighting when focused in form
- Copy button for full JSON
- Real-time updates

#### Errors View
Displays validation errors grouped by section.

> Captura del panel de preview en modo Errors mostrando errores de validación agrupados por sección con botones para navegar al campo.

Features:
- Errors grouped by form section
- Click to navigate to error field
- Search in rules for specific fields
- Error count per section

#### Rules View
Shows all validation rules for the schema.

> Captura del panel de preview en modo Rules mostrando las reglas de validación del esquema con búsqueda.

Features:
- Search rules by field name
- See required fields
- View format requirements
- Understand constraints

**Toggle between views** using the tabs at the top of the preview panel:

> Captura de las pestañas del panel de preview (JSON, Errors, Rules) con una seleccionada.

### Step 8: Validate Your Data

Before creating the submodel, validation is required:

1. Click the **"Validate"** button

> Captura del botón de validación en estado inicial (antes de validar).

2. If validation fails, you'll see:
   - Error count in red
   - Automatic switch to Errors view
   - Field-level error indicators

> Captura de la vista después de una validación fallida mostrando el mensaje de error, contador de errores y panel de errores.

3. Navigate to each error:
   - Click the error to jump to the field
   - Fix the issue
   - The field error clears when fixed

> Captura de un campo con error destacado en rojo y el mensaje de error específico.

4. Re-validate until successful:

> Captura del mensaje de validación exitosa mostrando "Form is valid and ready to submit" en verde.

### Step 9: Create the Submodel

Once validated successfully:

1. The **"Create Submodel"** button becomes active
2. Click to submit

> Captura del botón "Create Submodel" activo (verde) después de una validación exitosa.

3. A loading overlay appears during creation

> Captura del overlay de carga durante la creación del submodel.

4. On success:
   - Success notification appears
   - Dialog closes automatically
   - Product details refresh to show new submodel

> Captura del mensaje de éxito (snackbar) indicando que el submodel fue creado correctamente.

### Step 10: Verify in Product Details

Return to the product details to see the newly created submodel:

> Captura de la vista de detalle del producto con el nuevo submodel listado en la sección de Submodels.

---

## Form Sections Reference

### Metadata
Information about the passport itself.
- Passport Identifier
- Registration Number
- Status
- Validity Period
- Economic Operator Info

### Identification
Product identification details.
- Manufacturer Part ID
- Batch Number
- Serial Number
- Product Identifiers

### Operation
Operational characteristics.
- Operating Conditions
- Usage Limits
- Performance Data

### Handling
Handling and producer information.
- Producer Details
- Importer Information
- Handling Instructions
- Storage Requirements

### Product Characteristics
Physical and categorical information.
- Dimensions
- Weight
- Color
- Category
- Classification

### Commercial Information
Commercial and warranty details.
- Warranty Terms
- Commercial Conditions
- Pricing Information

### Materials
Material composition data.
- Material List
- Hazardous Substances
- REACH Compliance
- Material Percentages

### Sustainability
Environmental impact data.
- Carbon Footprint
- Environmental Impact
- Recycling Information
- End-of-Life Instructions

### Sources & Documentation
Links and references.
- Documentation URLs
- Certification Links
- Technical Specifications
- User Manuals

### Additional Data
Custom and extended information.
- Custom Properties
- Extension Fields
- Notes

---

## Validation States

| State | Icon | Color | Meaning |
|-------|------|-------|---------|
| **Initial** | Warning | Yellow | Validation not yet performed |
| **Validated** | Check | Green | All validations passed |
| **Errors** | Error | Red | Validation errors found |

---

## Tips

- **Start with Required Fields**: Complete all required fields (marked with *) first
- **Use JSON Import**: Save time by importing existing data structures
- **Section by Section**: Complete one section at a time for better organization
- **Validate Often**: Validate periodically to catch errors early
- **Copy IDs Easily**: Click chips to copy IDs for use elsewhere
- **Read Descriptions**: Hover over fields for detailed guidance
- **Check Rules View**: When unsure about a field, check the Rules view
- **Preview JSON**: Use JSON view to see the exact output structure

---

## Troubleshooting

### "Twin must be created first" Error
Create a Digital Twin for your Catalog Part before adding submodels.

### Validation Keeps Failing
1. Check all required fields are filled
2. Verify format requirements (dates, URNs, etc.)
3. Review the Errors view for specific issues

### JSON Import Not Working
1. Ensure valid JSON syntax
2. Check that field names match the schema
3. Verify data types match expected types

### Submodel Creation Fails
1. Check network connectivity
2. Verify permissions
3. Ensure Twin ID is valid
4. Contact administrator if persists

---

## Related Features

- [Catalog Parts](../ichub/CATALOG-PARTS.md): Manage your product catalog
- [Serialized Parts](../ichub/SERIALIZED-PARTS.md): Track serialized instances
- [Passport Consumption](DPP-CONSUMER-VIEWER.md): View published passports
- [KIT Features](../KIT-FEATURES.md): Enable Eco Pass KIT features

---

> For more information, see the main [Frontend Documentation](../../FRONTEND-DOCUMENTATION.md).

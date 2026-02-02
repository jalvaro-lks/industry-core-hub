# Policy Management

> Configure and manage data space policies for access control and governance compliance.

---

## Purpose

The Policy Management feature allows you to define, visualize, and manage access and usage policies for your data space resources. Policies in the Industry Core Hub control how data is shared, accessed, and consumed within the Catena-X ecosystem.

Policy management ensures:
- **Secure Data Sharing**: Control who can access your data
- **Compliance**: Enforce framework agreements and usage restrictions
- **Governance**: Define rules for data consumption
- **Flexibility**: Configure different policies per semantic ID

---

## Features

### Current Status

⚠️ **Coming Soon**: The visual Policy Builder interface is currently in development. Policy configuration is currently done through Helm chart configuration.

### Planned Features
- Visual Policy Builder with drag-and-drop interface
- Policy templates for common scenarios
- Policy validation and testing
- Policy version management
- Policy analytics and monitoring

---

## Policy Configuration (via Helm)

Currently, policies are configured through the Helm chart deployment. This section documents the configuration structure.

### Policy Types (ODRL)

The system supports ODRL (Open Digital Rights Language) rules with three types:

| Type | Description | Use Case |
|------|-------------|----------|
| **Permission** | Rules that allow specific actions | Grant access to data |
| **Prohibition** | Rules that forbid specific actions | Prevent unauthorized use |
| **Obligation** | Rules that require specific actions | Mandate compliance steps |

### Configuration Structure

Policies are defined in the Helm values under `frontend.consumption.governance`:

```yaml
frontend:
  consumption:
    governance:
      - semanticid: "urn:samm:io.catenax.part_type_information:1.0.0#PartTypeInformation"
        policies: 
          - strict: true
            permission:
              - action: odrl:use
                LogicalConstraint: odrl:and
                constraints:
                  - leftOperand: cx-policy:FrameworkAgreement
                    operator: odrl:eq
                    rightOperand: DataExchangeGovernance:1.0
                  - leftOperand: cx-policy:Membership
                    operator: odrl:eq
                    rightOperand: active
            prohibition: []
            obligation: []
```

### Constraint Components

| Component | Description | Example |
|-----------|-------------|---------|
| `leftOperand` | Policy attribute to check | `cx-policy:Membership` |
| `operator` | Comparison operator | `odrl:eq`, `odrl:neq` |
| `rightOperand` | Expected value | `active` |

### Common Left Operands

| Operand | Purpose |
|---------|---------|
| `cx-policy:Membership` | Check membership status |
| `cx-policy:FrameworkAgreement` | Verify framework agreement |
| `cx-policy:UsagePurpose` | Restrict usage purpose |
| `cx-policy:Role` | Check user role |

### Logical Constraints

| Type | Description |
|------|-------------|
| `odrl:and` | All constraints must be satisfied |
| `odrl:or` | Any constraint must be satisfied |

---

## Strict vs Non-Strict Mode

### Strict Mode (`strict: true`)

- Uses exact order of constraints as configured
- Generates exactly 1 policy
- Use when constraint order matters

> Captura de ejemplo de configuración con modo strict mostrando el YAML o JSON resultante.

### Non-Strict Mode (`strict: false`)

- Automatically generates all permutations
- For 2 constraints: generates 6 policies
- For 3 constraints: generates 15 policies
- Use for maximum compatibility

> Captura de ejemplo de configuración con modo non-strict mostrando las múltiples políticas generadas.

---

## Usage Guide (Helm Configuration)

### Step 1: Access Helm Values

Navigate to your Helm chart values file (e.g., `values.yaml` or `values-custom.yaml`).

> Captura mostrando la ubicación del archivo values.yaml en la estructura del proyecto.

### Step 2: Locate Governance Section

Find the `frontend.consumption.governance` section:

```yaml
frontend:
  consumption:
    governance:
      # Your policies here
```

> Captura de la sección de governance en el archivo values.yaml.

### Step 3: Add Semantic ID Configuration

Define policies for each semantic ID:

```yaml
- semanticid: "urn:samm:io.catenax.generic.digital_product_passport:6.1.0#DigitalProductPassport"
  policies:
    - strict: true
      permission:
        - action: odrl:use
          LogicalConstraint: odrl:and
          constraints:
            - leftOperand: cx-policy:Membership
              operator: odrl:eq
              rightOperand: active
      prohibition: []
      obligation: []
```

> Captura de un ejemplo completo de configuración de política para DPP.

### Step 4: Deploy Configuration

Apply the Helm configuration:

```bash
helm upgrade --install ichub ./charts/industry-core-hub -f values.yaml
```

> Captura del comando de despliegue y el output exitoso.

### Step 5: Verify Deployment

Check that the policies are loaded in the frontend:

1. Open browser developer tools
2. Check the `GOVERNANCE_CONFIG` environment variable
3. Verify policies appear in API requests

> Captura de las herramientas de desarrollador mostrando la configuración cargada.

---

## Policy Examples

### Basic Membership Check

```yaml
- strict: true
  permission:
    - action: odrl:use
      constraints:
        - leftOperand: cx-policy:Membership
          operator: odrl:eq
          rightOperand: active
```

### Framework Agreement Required

```yaml
- strict: true
  permission:
    - action: odrl:use
      LogicalConstraint: odrl:and
      constraints:
        - leftOperand: cx-policy:FrameworkAgreement
          operator: odrl:eq
          rightOperand: DataExchangeGovernance:1.0
        - leftOperand: cx-policy:Membership
          operator: odrl:eq
          rightOperand: active
```

### Usage Purpose Restriction

```yaml
- strict: true
  permission:
    - action: odrl:use
      LogicalConstraint: odrl:and
      constraints:
        - leftOperand: cx-policy:Membership
          operator: odrl:eq
          rightOperand: active
        - leftOperand: cx-policy:UsagePurpose
          operator: odrl:eq
          rightOperand: cx.core.industrycore:1
```

### Multiple Policies per Semantic ID

```yaml
- semanticid: "urn:samm:io.catenax.part_type_information:1.0.0#PartTypeInformation"
  policies:
    # Strict policy for precise governance
    - strict: true
      permission:
        - action: odrl:use
          constraints:
            - leftOperand: cx-policy:Membership
              operator: odrl:eq
              rightOperand: active
    
    # Non-strict for flexible access
    - strict: false
      permission:
        - action: odrl:use
          LogicalConstraint: odrl:and
          constraints:
            - leftOperand: cx-policy:FrameworkAgreement
              operator: odrl:eq
              rightOperand: DataExchangeGovernance:1.0
            - leftOperand: cx-policy:Membership
              operator: odrl:eq
              rightOperand: active
```

---

## Tips

- **Start Simple**: Begin with basic membership checks, add complexity as needed
- **Test Thoroughly**: Verify policy behavior in a test environment first
- **Document Policies**: Keep documentation of what each policy allows/restricts
- **Use Strict Mode**: When order matters for your governance requirements
- **Use Non-Strict Mode**: When maximum compatibility is needed
- **Group by Semantic ID**: Organize policies by data type for clarity

---

## Troubleshooting

### Policies Not Applied
1. Verify Helm deployment completed successfully
2. Check browser console for configuration errors
3. Verify semantic ID matches exactly

### Access Denied Unexpectedly
1. Review policy constraints
2. Check operator usage (eq vs neq)
3. Verify rightOperand values match provider's configuration

### Configuration Not Loading
1. Verify YAML syntax
2. Check for indentation errors
3. Validate JSON generation in developer tools

---

## Related Features

- [Catalog Parts](ichub/CATALOG-PARTS.md): Apply policies to product data
- [Serialized Parts](ichub/SERIALIZED-PARTS.md): Apply policies to serialized instances
- [Dataspace Discovery](ichub/DATASPACE-DISCOVERY.md): Policies affect discovery results
- [Passport Provision](eco-pass/DPP-PROVIDER-MANAGEMENT.md): Policies apply to published passports

---

## Technical Reference

For detailed technical documentation on policy configuration, see:
- [Governance Configuration Guide](../../ichub-frontend/docs/GOVERNANCE_CONFIGURATION.md)

---

> For more information, see the main [Frontend Documentation](../FRONTEND-DOCUMENTATION.md).

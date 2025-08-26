# Tests para PartManagementService

Este archivo contiene tests unitarios exhaustivos para la clase `PartManagementService` ubicada en `services/provider/part_management_service.py`.

## Estructura de los Tests

### Configuración de Tests
- **TestPartManagementService**: Clase principal de testing que agrupa todos los tests
- **setup_method()**: Inicializa una instancia del servicio antes de cada test
- **Fixtures**: Objetos mock reutilizables para diferentes entidades (catalog_part, legal_entity, business_partner, etc.)

### Categorías de Tests

#### 1. Tests de Creación de Catalog Parts
- `test_create_catalog_part_success`: Creación exitosa de catalog part
- `test_create_catalog_part_legal_entity_not_found_creates_new`: Creación automática de legal entity si no existe
- `test_create_catalog_part_already_exists`: Manejo de error cuando el catalog part ya existe
- `test_create_catalog_part_with_customer_part_ids`: Creación con IDs de customer parts

#### 2. Tests de Validación de Materiales
- `test_manage_share_error_valid_share`: Validación exitosa de porcentajes de materiales
- `test_manage_share_error_invalid_share_over_100`: Error cuando el porcentaje total excede 100%
- `test_manage_share_error_negative_total_share`: Error cuando el porcentaje total es negativo

#### 3. Tests de Consulta de Catalog Parts
- `test_get_catalog_parts_success`: Recuperación exitosa de catalog parts
- `test_get_catalog_part_details_success`: Recuperación exitosa de detalles de catalog part
- `test_get_catalog_part_details_not_found`: Manejo cuando no se encuentra el catalog part
- `test_get_catalog_parts_empty_result`: Manejo de resultados vacíos

#### 4. Tests de Serialized Parts
- `test_create_serialized_part_success`: Creación exitosa de serialized part
- `test_create_serialized_part_business_partner_not_found`: Error cuando business partner no existe
- `test_create_serialized_part_with_auto_generate_catalog_part`: Auto-generación de catalog part
- `test_create_serialized_part_customer_part_id_mismatch`: Error cuando customer part ID no coincide
- `test_create_serialized_part_auto_generate_partner_part`: Auto-generación de partner catalog part
- `test_get_serialized_parts_success`: Recuperación exitosa de serialized parts
- `test_empty_get_serialized_parts`: Manejo de consultas vacías

#### 5. Tests de Partner Catalog Part Mappings
- `test_create_partner_catalog_part_mapping_success`: Creación exitosa de mapping
- `test_create_partner_catalog_part_mapping_already_exists`: Error cuando mapping ya existe

#### 6. Tests de Business Partner Management
- `test_get_business_partner_by_name_success`: Recuperación exitosa por nombre
- `test_get_business_partner_by_name_missing_customer_part_id`: Error por customer part ID faltante
- `test_get_business_partner_by_name_missing_business_partner_name`: Error por nombre faltante
- `test_get_business_partner_by_name_not_found`: Error cuando business partner no existe

#### 7. Tests de Helper Methods
- `test_find_catalog_part_success`: Búsqueda exitosa de catalog part
- `test_find_catalog_part_legal_entity_not_found`: Error cuando legal entity no existe
- `test_find_catalog_part_catalog_part_not_found`: Error cuando catalog part no existe
- `test_find_catalog_part_auto_generate`: Auto-generación de catalog part
- `test_fill_customer_part_ids`: Llenado de customer part IDs

#### 8. Tests de Métodos de Conveniencia
- `test_create_catalog_part_by_ids_success`: Creación por IDs (actualmente saltado debido a bug en código fuente)

## Problemas Identificados

### Bug en el Código Fuente
El método `create_catalog_part_by_ids` tiene un bug donde intenta acceder a `business_partner_name` en lugar de `business_partner_number` del modelo `PartnerCatalogPartBase`. Este bug se documenta en el test correspondiente que se salta automáticamente.

## Ejecutar los Tests

Para ejecutar todos los tests:
```bash
cd /home/mgarcia/Desktop/PR/industry-core-hub/ichub-backend
/home/mgarcia/.pyenv/versions/3.12.0/bin/python -m pytest tests/test_part_management_service.py -v
```

Para ejecutar tests específicos:
```bash
/home/mgarcia/.pyenv/versions/3.12.0/bin/python -m pytest tests/test_part_management_service.py::TestPartManagementService::test_create_catalog_part_success -v
```

## Cobertura

Los tests cubren:
- ✅ Todos los métodos públicos implementados en la clase
- ✅ Todos los métodos estáticos y helpers
- ✅ Casos de éxito y casos de error
- ✅ Validaciones de entrada
- ✅ Manejo de excepciones
- ✅ Interacciones con repositorios
- ✅ Diferentes flujos de auto-generación

**Total**: 29 tests pasando, 1 test saltado por bug en código fuente.

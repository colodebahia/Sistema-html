# Metodología de Costeo — Módulo "Costeo" (Buena Huella)

Objetivo
- Establecer un método reproducible para calcular el costo total de equipos desarrollados internamente (gateways, sensores, gabinetes, plaquetas, etc.) que combinan componentes comprados y operaciones propias.

Conceptos clave
- Componente: pieza comprada o sub-ensamblado con costo unitario (USD/ARS).
- Producto (ensamblado): equipo final que contiene uno o más componentes y procesos (mano de obra, programación, testing, impresión 3D, placas).
- BOM (Bill of Materials): lista de componentes con cantidad por producto.
- Costos directos: suma de costos de componentes + mano de obra directa por unidad.
- Costos indirectos / overhead: asignación proporcional de gastos generales (herramientas, electricidad, espacio, amortización de maquinaria).
- Margen/profit: porcentaje aplicado al costo total para obtener precio de venta.

Estructura del cálculo
1) Costos de materiales: sumar (cantidad * costo_unitario) para cada componente del BOM.
2) Mano de obra directa: horas_estimada_por_unidad * costo_hora_operario.
3) Costos de procesamiento: costos específicos (impresión 3D, ensamblado, testing) por unidad.
4) Amortización de herramientas/equipos: (costo_equipo / vida_útil_horas) * horas_usadas_por_unidad + (costo_equipo / vida_útil_unidades) si se prefiere por unidades.
5) Overhead asignado: aplicar factor fijo o porcentaje (ej. 10-20%) sobre suma de 1..4.
6) Costeo total unitario = materiales + mano_obra + procesos + amortización + overhead.
7) Precio sugerido = Costeo total unitario * (1 + margen)

Consideraciones de moneda
- Mantener costos base en USD y en ARS (precio proveedor vs conversión). Guardar la tasa usada y la fecha de conversión.
- Para insumos locales, registrar en ARS y opcionalmente convertir a USD para análisis.

Versionado y trazabilidad
- Cada producto guardará "versión de BOM" y fecha; cambios en BOM generan nuevo registro de costo calculado.
- Mantener historial de costos calculados para comparativas y auditoría.

Campos mínimos a capturar (plantilla CSV/DB)
- product_sku, product_name, bom_version, component_sku, component_name, qty, unit_cost_usd, unit_cost_ars, supplier, lead_time
- labour_hours_per_unit, labour_cost_per_hour, amortization_hours_per_unit, overhead_pct, cost_date, exchange_rate

Ejemplo sencillo
- Componentes: Plaqueta (1x, 15 USD), Gabinete impreso (1x, 8 USD), Tornillos (4x, 0.1 USD)
- Mano de obra: 0.5 h a 2000 ARS/h → convertir si se desea a USD
- Amortización: impresora 3D 600 USD, vida 2000 h → 0.3 USD/h * 0.5 h = 0.15 USD
- Sumar y aplicar overhead 10% → resultado

Recomendaciones para implementación
- Implementar BOM relacional (productos ↔ components) y versionado simple (bom_version). 
- Calcular costos en JS en el frontend para feedback inmediato y persistir cálculo final (con tasa y metadatos) en storage.
- Mantener la lógica de cálculo replicable en backend para reports y generación de PDFs oficiales.
- Proveer UI para editar componentes, precios y parámetros de amortización/overhead a nivel empresa o por producto.

Testeo y validación
- Crear ejemplos de producto simples y compuestos con resultados esperados (unit tests) para validar la calculadora.
- Validar conversiones de moneda y trazabilidad de la tasa.

Formato y almacenamiento
- Guardar registros de componentes en plantilla CSV para import inicial; usar JSON schema para validación al importar.

---
Documento generado como guía inicial; se actualizará según datos reales que proveas.
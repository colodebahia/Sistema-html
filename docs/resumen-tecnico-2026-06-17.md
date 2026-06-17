# Resumen y detalle técnico — 2026-06-17

## 1. Resumen de avances (alto nivel)

Hasta hoy se avanzó en una versión funcional del sistema Buena Huella con foco en operación en campo (mobile-first) y gestión comercial básica.

### Lo implementado

1. **Clientes (CRUD)**
   - Alta, edición, borrado y búsqueda por nombre/teléfono/email.
   - Persistencia local y soporte de import/export JSON.
   - Integración con KML (importar, visualizar en mapa y exportar).

2. **Productos (CRUD)**
   - Alta, edición, borrado y búsqueda.
   - Campos comerciales/técnicos (SKU, proveedor, precios USD/ARS, stock, lead time).
   - Carga de **información técnica** (web, archivo local, YouTube).
   - Carga de **imágenes** por producto (galería en modal).

3. **Componentes (CRUD)**
   - Alta, edición, borrado y búsqueda.
   - Exportación JSON y CSV.
   - Base para armar BOM/costeo de equipos propios.

4. **Presupuestos**
   - Creación de ítems, totales USD/ARS y uso de tipo de cambio.
   - Historial de presupuestos.
   - Impresión/PDF.
   - Compartir por WhatsApp y Email.
   - IVA discriminado y total con IVA.
   - Opción para mostrar/ocultar detalle.

5. **Documentación técnica**
   - Metodología de costeo.
   - Esquema SQL inicial para módulo de costeo.
   - Guía de despliegue en web server.

6. **Backend y sincronización**
   - Backend Node.js + Express + Sequelize + SQLite en puerto 3000.
   - API REST para clientes, productos, componentes y presupuestos.
   - Endpoints de sync import/export.
   - Frontend conectado mediante capa `js/api.js` con fallback offline (localStorage).

---

## 2. Detalle técnico para desarrollador web

## 2.1 Estructura actual de proyecto (relevante)

- `clientes.html` → CRUD clientes + mapa/KML
- `productos.html` → CRUD productos + recursos técnicos + imágenes
- `componentes.html` → CRUD componentes
- `presupuestos.html` → cotización + historial + compartir + IVA
- `js/api.js` → data layer (API-first, fallback localStorage)
- `backend/server.js` → API REST + modelos Sequelize
- `backend/package.json` → dependencias backend
- `docs/` → documentación funcional/técnica

## 2.2 Modelo de datos (actual, nivel aplicación)

### Cliente
- `id`, `name`, `phone`, `email`, `location`, `notes`, `geometry`

### Producto
- `id`, `sku`, `name`, `description`, `supplier`
- `priceUsd`, `priceArs`, `stock`, `leadTime`
- `components` (JSON)
- `technicalInfo` (JSON)
- `images` (JSON)

### Componente
- `id`, `sku`, `name`, `description`, `supplier`
- `priceUsd`, `priceArs`, `leadTime`, `stock`, `notes`

### Presupuesto
- `id`, `clientId`, `clientName`, `items`
- `totalUsd`, `totalArs`, `totalWithIva`, `ivaPct`

## 2.3 Backend API (Express)

Base URL local:
- `http://localhost:3000/api`

Endpoints principales:
- `GET/POST/PUT/DELETE /api/clients`
- `GET/POST/PUT/DELETE /api/products`
- `GET/POST/PUT/DELETE /api/components`
- `GET/POST/PUT/DELETE /api/budgets`
- `GET /api/sync/export`
- `POST /api/sync/import`
- `GET /api/health`

## 2.4 Capa de datos frontend (`js/api.js`)

Patrón usado:
1. Intentar operación contra API (`fetch`).
2. Si la API responde, actualizar cache local.
3. Si falla API, operar en localStorage (modo offline).

Ventaja:
- Continúa funcionando sin red.
- Cuando hay backend disponible, sincroniza base compartida entre dispositivos.

## 2.5 Diferencia clave: localStorage vs backend

- **localStorage**: por navegador/dispositivo (no compartido).
- **API + SQL**: datos centralizados, compartidos entre PC/celular si ambos pegan al mismo backend.

## 2.6 KML

En clientes:
- importación KML con parser JS
- almacenamiento de geometría por cliente
- render en Leaflet
- exportación KML individual y global

## 2.7 Presupuestos (lógica actual)

- Ítems con cantidad y unitario USD.
- Conversión a ARS con tasa guardada.
- Subtotal ARS + IVA (%) + total final.
- Texto formateado para WhatsApp/Email.

## 2.8 Estado de despliegue (hoy)

Ambiente local funcional:
- Frontend: servidor estático (ej. `localhost:8001`)
- Backend: Node.js (`localhost:3000`)
- DB: SQLite (`backend/database.sqlite`)

Para producción:
1. Publicar frontend en dominio real.
2. Publicar backend en host con Node.
3. Configurar CORS restringido.
4. Mover a PostgreSQL recomendado.
5. SSL/HTTPS y backup diario.

## 2.9 Riesgos técnicos actuales

1. Validaciones básicas (faltan validaciones robustas de payload).
2. Seguridad: sin autenticación/roles aún.
3. Concurrencia limitada con SQLite en carga alta.
4. Sin migraciones formales de esquema.

## 2.10 Próximos pasos sugeridos (técnicos)

1. Implementar autenticación y roles (admin/vendedor/técnico).
2. Migrar DB a PostgreSQL.
3. Agregar validaciones de entrada (backend).
4. Integrar BOM real en presupuestos para detalle opcional por componentes.
5. Estandarizar build/deploy (CI básico).

---

Documento preparado para continuidad técnica y traspaso a otro desarrollador.

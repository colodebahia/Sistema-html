# Guía de cambios para alojar el sistema en tu web server

## 1. Arquitectura recomendada en producción

- **Frontend (HTML/CSS/JS):** servido desde tu dominio (ej: `https://www.buenahuella.com.ar/sistema/`).
- **Backend API (Node.js + Express):** servido como subdominio o ruta API (ej: `https://api.buenahuella.com.ar`).
- **Base de datos SQL:** en servidor (recomendado PostgreSQL en producción; SQLite solo para entorno local o chico).

---

## 2. Cambios obligatorios en el frontend

### 2.1 URL de API
Hoy el frontend usa `http://localhost:3000/api` en `js/api.js`.

En producción debe apuntar a tu API real, por ejemplo:

```js
const API_URL = 'https://api.buenahuella.com.ar/api';
```

Recomendación: usar variable de entorno o archivo de configuración para no editar código cada vez.

### 2.2 CORS
En backend, permitir solo el dominio real del frontend:

- `https://www.buenahuella.com.ar`
- (opcional) `https://buenahuella.com.ar`

No dejar CORS totalmente abierto en producción.

### 2.3 Recursos externos
Verificar que Leaflet/CDN carguen por **HTTPS** y sin bloqueos de integridad mal configurada.

---

## 3. Cambios obligatorios en el backend

### 3.1 Variables de entorno
Crear `.env` de producción con:

- `PORT`
- `DB_DIALECT` (`postgres` recomendado)
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `CORS_ORIGIN`

### 3.2 Base SQL de producción
- Recomendado: **PostgreSQL**.
- Si empezás con SQLite, migrar luego a PostgreSQL para concurrencia, backup y estabilidad.

### 3.3 Seguridad mínima
- Habilitar HTTPS (certificado SSL).
- Agregar límites de tamaño a payloads.
- Validar entradas (IDs, emails, números).
- Logging de errores (sin exponer stack al cliente).

### 3.4 Proceso en segundo plano
Ejecutar backend con PM2 o systemd para reinicio automático:

```bash
pm2 start server.js --name buena-api
pm2 save
```

---

## 4. Dominio, SSL y reverse proxy

Usar Nginx/Apache como proxy:

- `www.buenahuella.com.ar` -> frontend estático
- `api.buenahuella.com.ar` -> `localhost:3000`

Habilitar certificado SSL (Let's Encrypt).

---

## 5. Sincronización entre PC y celular

Para que ambos vean los mismos datos:

1. Ambos deben entrar al mismo frontend publicado.
2. Ese frontend debe apuntar a la misma API de producción.
3. API debe guardar en la misma base SQL.

Si falla API, entra en modo offline (localStorage), pero eso no sincroniza dispositivos.

---

## 6. Checklist de despliegue

1. Subir frontend al web server.
2. Subir backend al servidor (Node.js).
3. Configurar `.env` de producción.
4. Configurar base SQL (preferible PostgreSQL).
5. Configurar Nginx/Apache + SSL.
6. Cambiar `API_URL` del frontend a dominio real de API.
7. Probar CRUD completo (clientes, productos, componentes, presupuestos).
8. Probar desde PC y celular.
9. Activar backups diarios de base de datos.

---

## 7. Backups y mantenimiento

- Backup automático diario de base SQL.
- Retención mínima sugerida: 14-30 días.
- Probar restauración de backup al menos 1 vez por mes.

---

## 8. Siguiente mejora recomendada

Agregar autenticación (usuarios/roles) antes de abrir a internet:

- Admin, vendedor, técnico.
- Token/JWT o sesión.
- Auditoría básica (quién creó/editó/borró).


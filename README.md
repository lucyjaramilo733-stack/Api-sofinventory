# SofInventory APIs

APIs REST de solo lectura para el sistema de inventario **SofInventory**. El repositorio contiene dos microservicios independientes que exponen datos de productos y proveedores a clientes externos.

---

## Estructura del repositorio

```
sofinventory-apis/
├── api-productos/          # Microservicio de productos y categorías
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   └── productosController.js
│   │   └── routes/
│   │       └── productosRoutes.js
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── api-proveedores/        # Microservicio de proveedores y tipos de documento
    ├── src/
    │   ├── config/
    │   │   └── db.js
    │   ├── controllers/
    │   │   └── proveedoresController.js
    │   └── routes/
    │       └── proveedoresRoutes.js
    ├── index.js
    ├── package.json
    └── .env.example
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior
- Base de datos `db_sofinventory` creada y poblada

---

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd sofinventory-apis
```

### 2. Configurar variables de entorno

Cada API requiere su propio archivo `.env`. Usa el archivo `.env.example` como plantilla.

**api-productos/.env**
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=db_sofinventory
DB_PASSWORD=tu_contraseña
DB_PORT=5432
```

**api-proveedores/.env**
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=db_sofinventory
DB_PASSWORD=tu_contraseña
DB_PORT=5432
```

> ⚠️ **Nunca subas archivos `.env` con datos reales al repositorio.**

### 3. Instalar dependencias e iniciar cada API

```bash
# API de Productos
cd api-productos
npm install
npm run dev       # desarrollo (nodemon)
# npm start       # producción

# API de Proveedores (en otra terminal)
cd api-proveedores
npm install
npm run dev
# npm start
```

---

## API de Productos

**Puerto por defecto:** `3000`  
**Base URL:** `http://localhost:3000`

### Descripción

Expone datos de los productos e inventario registrados en SofInventory. Es de **solo lectura** — únicamente acepta peticiones `GET`.

### Dependencias

| Paquete    | Versión   | Uso                              |
|------------|-----------|----------------------------------|
| express    | ^5.2.1    | Framework HTTP                   |
| pg         | ^8.20.0   | Driver PostgreSQL                |
| cors       | ^2.8.5    | Control de acceso entre dominios |
| dotenv     | ^17.4.2   | Variables de entorno             |
| nodemon    | ^3.0.1    | Reinicio automático (dev)        |

### Endpoints

#### `GET /`
Información general de la API.

**Respuesta de ejemplo:**
```json
{
  "nombre": "API de Productos - SofInventory",
  "version": "1.0.0",
  "estado": "online",
  "endpoints": ["/api/productos", "/api/productos/:id", "/api/categorias"]
}
```

---

#### `GET /api/productos`
Lista todos los productos activos. Soporta filtros opcionales por query params.

**Query params opcionales:**

| Parámetro  | Tipo   | Descripción                         | Ejemplo               |
|------------|--------|-------------------------------------|-----------------------|
| `categoria`| string | Filtra por nombre de categoría      | `?categoria=Herramientas` |
| `estado`   | string | Filtra por estado del producto      | `?estado=activo`      |
| `buscar`   | string | Busca por nombre o SKU              | `?buscar=cemento`     |

**Respuesta de ejemplo:**
```json
{
  "ok": true,
  "total": 2,
  "filtros": { "categoria": "Herramientas", "estado": null, "buscar": null },
  "datos": [
    {
      "id": 1,
      "sku": "HER-001",
      "nombre": "Martillo de carpintero",
      "marca": "Stanley",
      "referencia": "51-624",
      "unidad_medida": "Unidad",
      "precio_venta": 45000,
      "stock": 20,
      "stock_minimo": 5,
      "estado": "activo",
      "imagen": null,
      "descripcion": "Martillo de acero con mango de fibra",
      "categoria": "Herramientas",
      "tipo_control": "unidad"
    }
  ]
}
```

---

#### `GET /api/productos/:id`
Detalle completo de un producto específico.

**Parámetros de ruta:**

| Parámetro | Tipo    | Descripción          |
|-----------|---------|----------------------|
| `id`      | integer | ID numérico del producto |

**Respuesta de ejemplo:**
```json
{
  "ok": true,
  "datos": {
    "id": 1,
    "sku": "HER-001",
    "nombre": "Martillo de carpintero",
    "marca": "Stanley",
    "referencia": "51-624",
    "unidad_medida": "Unidad",
    "precio_venta": 45000,
    "stock": 20,
    "stock_minimo": 5,
    "estado": "activo",
    "imagen": null,
    "descripcion": "Martillo de acero con mango de fibra",
    "especificaciones": { "peso_kg": 0.5 },
    "observaciones": null,
    "fecha_creacion": "2026-01-10T12:00:00.000Z",
    "fecha_actualizacion": "2026-04-01T08:30:00.000Z",
    "categoria": "Herramientas",
    "tipo_control": "unidad",
    "categoria_descripcion": "Herramientas manuales y eléctricas"
  }
}
```

**Errores posibles:**

| Código | Descripción                         |
|--------|-------------------------------------|
| 400    | El ID no es un número válido        |
| 404    | No existe un producto con ese ID    |
| 500    | Error interno del servidor          |

---

#### `GET /api/categorias`
Lista todas las categorías disponibles.

**Respuesta de ejemplo:**
```json
{
  "ok": true,
  "total": 3,
  "datos": [
    { "id": 1, "nombre": "Herramientas", "tipo_control": "unidad", "descripcion": "Herramientas manuales y eléctricas" },
    { "id": 2, "nombre": "Materiales", "tipo_control": "peso", "descripcion": "Materiales de construcción" }
  ]
}
```

---

## API de Proveedores

**Puerto por defecto:** `3001`  
**Base URL:** `http://localhost:3001`

### Descripción

Expone los datos de proveedores registrados en SofInventory. Al igual que la API de Productos, es de **solo lectura** — únicamente acepta peticiones `GET`.

### Dependencias

| Paquete    | Versión   | Uso                              |
|------------|-----------|----------------------------------|
| express    | ^5.2.1    | Framework HTTP                   |
| pg         | ^8.20.0   | Driver PostgreSQL                |
| cors       | ^2.8.5    | Control de acceso entre dominios |
| dotenv     | ^17.4.2   | Variables de entorno             |
| nodemon    | ^3.0.1    | Reinicio automático (dev)        |

### Endpoints

#### `GET /`
Información general de la API.

**Respuesta de ejemplo:**
```json
{
  "nombre": "API de Proveedores - SofInventory",
  "version": "1.0.0",
  "estado": "online",
  "endpoints": ["/api/proveedores", "/api/proveedores/:id", "/api/tipos-documento"]
}
```

---

#### `GET /api/proveedores`
Lista todos los proveedores. Soporta filtros opcionales por query params.

**Query params opcionales:**

| Parámetro        | Tipo   | Descripción                                    | Ejemplo                    |
|------------------|--------|------------------------------------------------|----------------------------|
| `tipo_proveedor` | string | Filtra por tipo de proveedor                   | `?tipo_proveedor=nacional` |
| `estado`         | string | Filtra por estado                              | `?estado=activo`           |
| `pais`           | string | Filtra por país                               | `?pais=Colombia`           |
| `buscar`         | string | Busca en razón social, contacto o documento   | `?buscar=ferretería`       |

**Respuesta de ejemplo:**
```json
{
  "ok": true,
  "total": 1,
  "filtros": { "tipo_proveedor": "nacional", "estado": null, "pais": null, "buscar": null },
  "datos": [
    {
      "id": 1,
      "numero_documento": "900123456-1",
      "tipo_documento": "NIT",
      "razon_social": "Ferretería El Tornillo SAS",
      "nombre_contacto": "Carlos Pérez",
      "cargo_contacto": "Gerente",
      "email": "ventas@eltornillo.com",
      "telefono": "3201234567",
      "direccion": "Calle 50 # 30-20",
      "ciudad": "Medellín",
      "departamento": "Antioquia",
      "pais": "Colombia",
      "tipo_proveedor": "nacional",
      "estado": "activo",
      "observaciones": null,
      "fecha_registro": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/proveedores/:id`
Detalle completo de un proveedor específico.

**Parámetros de ruta:**

| Parámetro | Tipo    | Descripción              |
|-----------|---------|--------------------------|
| `id`      | integer | ID numérico del proveedor |

**Errores posibles:**

| Código | Descripción                           |
|--------|---------------------------------------|
| 400    | El ID no es un número válido          |
| 404    | No existe un proveedor con ese ID     |
| 500    | Error interno del servidor            |

---

#### `GET /api/tipos-documento`
Lista todos los tipos de documento disponibles (NIT, CC, CE, Pasaporte, etc.).

**Respuesta de ejemplo:**
```json
{
  "ok": true,
  "total": 4,
  "datos": [
    { "id": 1, "nombre": "CC" },
    { "id": 2, "nombre": "CE" },
    { "id": 3, "nombre": "NIT" },
    { "id": 4, "nombre": "Pasaporte" }
  ]
}
```

---

## Seguridad y restricciones

- Ambas APIs son **exclusivamente de consulta**. Solo se aceptan los métodos `GET` y `OPTIONS`.
- Cualquier intento de `POST`, `PUT`, `PATCH` o `DELETE` retorna `405 Method Not Allowed`.
- CORS está habilitado para todos los orígenes (`*`). Ajustar en producción al dominio específico del cliente.
- Los campos sensibles (`precio_compra`, `creado_por_id`) **no se exponen** en ninguna respuesta.

---

## Formato estándar de respuestas

Todas las respuestas siguen esta estructura:

**Éxito (lista):**
```json
{
  "ok": true,
  "total": 10,
  "filtros": {},
  "datos": []
}
```

**Éxito (detalle):**
```json
{
  "ok": true,
  "datos": {}
}
```

**Error:**
```json
{
  "ok": false,
  "mensaje": "Descripción del error",
  "detalle": "Mensaje técnico (solo en errores 500)"
}
```

---

## Pruebas con ngrok

Para exponer las APIs localmente a internet durante pruebas:

```bash
ngrok http 3000   # api-productos
ngrok http 3000   # api-proveedores
```

Incluir la cabecera `ngrok-skip-browser-warning: true` en las peticiones para evitar la página de advertencia de ngrok.

---

## Licencia

ISC © SofInventory

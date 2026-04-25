# Estándar de Codificación — SofInventory APIs

Este documento establece las convenciones y reglas de codificación para todos los microservicios del repositorio `sofinventory-apis`. Todo el equipo de desarrollo debe seguirlo para garantizar consistencia, mantenibilidad y calidad del código.

---

## 1. Idioma

| Elemento                          | Idioma      |
|-----------------------------------|-------------|
| Código fuente (variables, funciones, archivos) | **Español** |
| Comentarios y documentación JSDoc | **Español** |
| Mensajes de respuesta HTTP (`mensaje`) | **Español** |
| Claves técnicas de respuesta JSON (`ok`, `error`, `datos`) | **Inglés/minúsculas** |
| Commits de Git                    | **Español** |

```js
// ✅ Correcto
const obtenerProductos = async (req, res) => { ... };
let condiciones = [];

// ❌ Incorrecto
const getProducts = async (req, res) => { ... };
let conditions = [];
```

---

## 2. Nomenclatura

### Variables y funciones — `camelCase`
```js
// ✅ Correcto
const pool = require('../config/db');
const whereClause = condiciones.join(' AND ');
const obtenerProductoPorId = async (req, res) => { ... };

// ❌ Incorrecto
const WHERE_CLAUSE = ...;
const ObtenerProductoPorId = ...;
```

### Archivos y directorios — `camelCase` en singular
```
src/
  config/
    db.js                       ✅
  controllers/
    productosController.js      ✅
    productos-controller.js     ❌
  routes/
    productosRoutes.js          ✅
```

### Rutas de endpoints — `kebab-case` en plural
```
/api/productos          ✅
/api/tipos-documento    ✅
/api/tiposDocumento     ❌
/api/producto           ❌
```

### Variables de entorno — `SCREAMING_SNAKE_CASE`
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=db_sofinventory
DB_PASSWORD=tu_contraseña
DB_PORT=5432
```

---

## 3. Estructura de archivos por microservicio

Cada API debe seguir esta estructura obligatoria:

```
api-<nombre>/
├── src/
│   ├── config/
│   │   └── db.js               # Configuración y pool de PostgreSQL
│   ├── controllers/
│   │   └── <nombre>Controller.js  # Lógica de negocio y consultas SQL
│   └── routes/
│       └── <nombre>Routes.js   # Definición de rutas y middleware de seguridad
├── index.js                    # Punto de entrada: Express, CORS, middlewares globales
├── package.json
├── .env                        # Variables de entorno locales (no subir al repo)
└── .env.example                # Plantilla de variables (sí se sube al repo)
```

---

## 4. Comentarios y documentación

### Cabecera de archivo
Todo archivo principal (`index.js`) debe incluir un bloque JSDoc al inicio:

```js
/**
 * @file index.js
 * @description Punto de entrada principal de la API REST de SofInventory.
 *              Configura el servidor Express, middlewares, rutas y restricciones
 *              de seguridad. Esta API es de solo lectura (únicamente métodos GET).
 */
```

### Documentación de funciones (controllers)
Cada función de controller debe tener JSDoc con endpoint, descripción y parámetros:

```js
/**
 * GET /api/productos
 *
 * Devuelve todos los productos activos.
 * Incluye el NOMBRE de la categoría en vez del ID
 * usando un JOIN entre las tablas productos y categorias.
 *
 * Parámetros opcionales por URL (query params):
 * - categoria : filtra por nombre de categoría  ej: ?categoria=Herramientas
 * - estado    : filtra por estado del producto   ej: ?estado=activo
 * - buscar    : busca por nombre o SKU           ej: ?buscar=cemento
 */
const obtenerProductos = async (req, res) => { ... };
```

### Comentarios en línea
Usar comentarios explicativos en bloques de lógica compleja. Evitar comentarios obvios.

```js
// ✅ Correcto — explica el "por qué"
// ILIKE es como LIKE pero sin distinguir mayúsculas/minúsculas
condiciones.push(`c.nombre ILIKE $${contador}`);

// ❌ Incorrecto — no aporta valor
// Incrementamos el contador
contador++;
```

---

## 5. Configuración de Express

### Orden obligatorio de middlewares en `index.js`

```js
// 1. CORS
app.use(cors({ ... }));
app.options('*', cors());

// 2. Body parsers
app.use(express.json());

// 3. Middleware de restricción de métodos
app.use((req, res, next) => { ... });

// 4. Rutas del módulo
app.use('/api', <nombre>Routes);

// 5. Ruta raíz informativa
app.get('/', (req, res) => { ... });

// 6. Handler 404 (siempre al final)
app.use('*', (req, res) => { ... });
```

### Configuración de CORS

```js
app.use(cors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));
```

> En producción, reemplazar `'*'` por el dominio específico del cliente.

---

## 6. Restricción de métodos HTTP

Ambas APIs son de **solo lectura**. Se debe implementar el middleware de restricción en dos niveles:

**Nivel global (`index.js`):**
```js
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        return res.status(405).json({
            ok: false,
            error: 'Method Not Allowed',
            mensaje: 'Esta API es exclusivamente de consulta (solo lectura).'
        });
    }
    next();
});
```

**Nivel de router (`<nombre>Routes.js`):**
```js
router.use((req, res, next) => {
    const metodosPermitidos = ['GET'];
    if (!metodosPermitidos.includes(req.method)) {
        return res.status(405).json({
            ok: false,
            error: 'Método no permitido',
            mensaje: `El método ${req.method} no está permitido en esta API. Solo se aceptan consultas GET.`,
            metodo_utilizado: req.method,
            metodos_permitidos: metodosPermitidos
        });
    }
    next();
});
```

---

## 7. Consultas SQL

### Parametrización obligatoria

Nunca interpolar variables directamente en el SQL. Siempre usar parámetros posicionales de `pg` (`$1`, `$2`, ...):

```js
// ✅ Correcto
const result = await pool.query(
    'SELECT * FROM productos WHERE id = $1',
    [id]
);

// ❌ Incorrecto — vulnerable a inyección SQL
const result = await pool.query(
    `SELECT * FROM productos WHERE id = ${id}`
);
```

### Construcción dinámica de filtros

Usar el patrón de arrays `condiciones` y `valores` con contador incremental:

```js
let condiciones = [];
let valores     = [];
let contador    = 1;

if (categoria) {
    condiciones.push(`c.nombre ILIKE $${contador}`);
    valores.push(`%${categoria}%`);
    contador++;
}

const whereClause = condiciones.length > 0
    ? `WHERE ${condiciones.join(' AND ')}`
    : '';
```

### Campos expuestos vs. internos

No exponer nunca campos sensibles o de uso interno del sistema:

| Exponer ✅        | No exponer ❌     |
|-------------------|-------------------|
| `precio_venta`    | `precio_compra`   |
| `nombre_contacto` | `creado_por_id`   |
| `estado`          | claves foráneas internas |

### Formato de las queries

Escribir las queries SQL con indentación clara dentro de template literals:

```js
const query = `
    SELECT
        p.id,
        p.nombre,
        c.nombre AS categoria
    FROM productos p
    JOIN categorias c ON p.categoria_id = c.id
    ${whereClause}
    ORDER BY p.nombre ASC
`;
```

---

## 8. Manejo de errores

### Estructura obligatoria en controllers

Cada función de controller debe usar `try/catch` y manejar al menos tres casos:

```js
const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Validación de entrada
        if (isNaN(id)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El ID debe ser un número válido'
            });
        }

        const result = await pool.query(query, [id]);

        // 2. Recurso no encontrado
        if (result.rows.length === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: `No existe un producto con el ID ${id}`
            });
        }

        // 3. Respuesta exitosa
        res.json({ ok: true, datos: result.rows[0] });

    } catch (err) {
        // 4. Error de servidor
        console.error('Error en obtenerProductoPorId:', err.message);
        res.status(500).json({
            ok: false,
            mensaje: 'Error interno del servidor',
            detalle: err.message
        });
    }
};
```

### Códigos HTTP

| Situación                        | Código |
|----------------------------------|--------|
| Éxito                            | 200    |
| Parámetro inválido               | 400    |
| Recurso no encontrado            | 404    |
| Método HTTP no permitido         | 405    |
| Error interno del servidor       | 500    |

---

## 9. Formato estándar de respuestas JSON

Todas las respuestas deben seguir este esquema:

**Lista con filtros:**
```json
{
  "ok": true,
  "total": 10,
  "filtros": { "categoria": "Herramientas", "estado": null, "buscar": null },
  "datos": [ ... ]
}
```

**Detalle único:**
```json
{
  "ok": true,
  "datos": { ... }
}
```

**Error:**
```json
{
  "ok": false,
  "mensaje": "Descripción legible del error",
  "detalle": "Mensaje técnico (solo en errores 500)"
}
```

Reglas del formato:
- El campo `ok` es obligatorio en todas las respuestas.
- Las claves del objeto JSON van en `snake_case`.
- Los datos siempre se agrupan bajo la clave `datos`.
- No devolver campos `null` innecesarios en respuestas de error.

---

## 10. Variables de entorno

- Toda variable sensible (credenciales, puertos, URLs) debe vivir en `.env`.
- El archivo `.env` **nunca** debe commitearse. Verificar que esté en `.gitignore`.
- Siempre proveer un `.env.example` con los nombres de las variables y valores de ejemplo (sin datos reales).

```env
# .env.example
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=nombre_de_tu_bd
DB_PASSWORD=tu_contraseña
DB_PORT=5432
```

---

## 11. Gestión de dependencias

- No instalar dependencias innecesarias. Evaluar antes de hacer `npm install <paquete>`.
- Las dependencias de desarrollo (ej: `nodemon`) siempre van en `devDependencies`:
  ```bash
  npm install nodemon --save-dev
  ```
- No subir la carpeta `node_modules` al repositorio (verificar `.gitignore`).

`.gitignore` mínimo requerido por cada microservicio:
```
node_modules/
.env
```

---

## 12. Git y control de versiones

### Ramas

| Nombre              | Uso                                          |
|---------------------|----------------------------------------------|
| `main`              | Código estable en producción                 |
| `feature/<nombre>`  | Desarrollo de una nueva funcionalidad        |
| `fix/<nombre>`      | Corrección de un bug específico              |

Ejemplo: `feature/api-productos`, `fix/error-conexion-db`

### Mensajes de commit

Formato: `<tipo>: <descripción breve en español`

| Tipo       | Cuándo usarlo                                  |
|------------|------------------------------------------------|
| `feat`     | Nueva funcionalidad                            |
| `fix`      | Corrección de bug                              |
| `docs`     | Cambios en documentación                       |
| `refactor` | Refactorización sin cambio de comportamiento   |
| `chore`    | Tareas de mantenimiento (dependencias, config) |

```bash
# ✅ Ejemplos correctos
git commit -m "feat: agregar endpoint de categorías"
git commit -m "fix: validar que el ID sea numérico antes de consultar"
git commit -m "docs: actualizar README con ejemplos de respuesta"
git commit -m "refactor: extraer construcción de WHERE a función auxiliar"

# ❌ Incorrectos
git commit -m "cambios"
git commit -m "arregle cosas"
git commit -m "wip"
```

---

## 13. Checklist antes de hacer un commit

Antes de subir cambios al repositorio, verificar:

- [ ] El archivo `.env` **no** está incluido en el commit.
- [ ] Los campos sensibles (`precio_compra`, `creado_por_id`) **no** se exponen en ninguna respuesta.
- [ ] Toda función de controller tiene su bloque `try/catch`.
- [ ] Toda consulta SQL usa parámetros posicionales (`$1`, `$2`...) y no interpolación de strings.
- [ ] Las variables y funciones están nombradas en español y en `camelCase`.
- [ ] El mensaje del commit sigue el formato `<tipo>: <descripción>`.
- [ ] El servidor arranca sin errores (`npm run dev`).
- [ ] La conexión a PostgreSQL es exitosa (ver log `✅ Conexión a PostgreSQL exitosa`).

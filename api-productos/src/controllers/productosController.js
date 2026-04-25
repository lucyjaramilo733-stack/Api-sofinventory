// src/controllers/productosController.js

// Importamos el pool de conexión que configuramos en db.js
const pool = require('../config/db');

/**
 * CONTROLLER DE PRODUCTOS
 * 
 * Un controller es el responsable de:
 * 1. Recibir la petición (req = request)
 * 2. Consultar la base de datos
 * 3. Devolver la respuesta (res = response)
 * 
 * Cada función aquí corresponde a un endpoint de la API.
 */
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
 * - buscar    : busca por nombre o SKU            ej: ?buscar=cemento
 */
const obtenerProductos = async (req, res) => {
  try {
    // Leemos los filtros que lleguen en la URL
    // Si no llegan, quedan como undefined
    const { categoria, estado, buscar } = req.query;

    /**
     * Construcción dinámica de la consulta SQL
     * 
     * Usamos un array de condiciones para armar el WHERE
     * solo con los filtros que el cliente envió.
     * Esto evita tener múltiples queries separadas.
     */
    let condiciones = [];  // array de condiciones WHERE
    let valores = [];      // valores para los parámetros ($1, $2...)
    let contador = 1;      // contador para los parámetros de PostgreSQL

    // Si enviaron ?categoria=xxx agregamos esa condición
    if (categoria) {
      condiciones.push(`c.nombre ILIKE $${contador}`);
      valores.push(`%${categoria}%`);
      contador++;
    }

    // Si enviaron ?estado=xxx agregamos esa condición
    if (estado) {
      condiciones.push(`p.estado ILIKE $${contador}`);
      valores.push(`%${estado}%`);
      contador++;
    }

    // Si enviaron ?buscar=xxx buscamos en nombre y SKU
    if (buscar) {
      condiciones.push(`(p.nombre ILIKE $${contador} OR p.sku ILIKE $${contador})`);
      valores.push(`%${buscar}%`);
      contador++;
    }

    // Armamos el WHERE solo si hay condiciones
    // Si no hay filtros, whereClause queda vacío y trae todo
    const whereClause = condiciones.length > 0
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    /**
     * La consulta SQL con JOIN a categorias
     * 
     * ILIKE es como LIKE pero sin distinguir mayúsculas/minúsculas
     * JOIN trae el nombre de la categoría en vez del ID
     * No exponemos: precio_compra, creado_por_id (datos internos)
     */
    const query = `
      SELECT 
        p.id,
        p.sku,
        p.nombre,
        p.marca,
        p.referencia,
        p.unidad_medida,
        p.precio_venta,
        p.stock,
        p.stock_minimo,
        p.estado,
        p.imagen,
        p.descripcion,
        c.nombre AS categoria,
        c.tipo_control
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY p.nombre ASC
    `;

    const result = await pool.query(query, valores);

    /**
     * Respuesta exitosa con metadata
     * 
     * Devolvemos no solo los datos sino también:
     * - total: cuántos resultados hay
     * - filtros: qué filtros se aplicaron
     * Esto es una buena práctica en APIs profesionales
     */
    res.json({
      ok: true,
      total: result.rows.length,
      filtros: { categoria, estado, buscar },
      datos: result.rows
    });

  } catch (err) {
    // Si algo falla en la BD, devolvemos error 500
    console.error('Error en obtenerProductos:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


/**
 * GET /api/productos/:id
 * 
 * Devuelve el detalle completo de UN producto específico.
 * El :id viene en la URL, ej: /api/productos/5
 * 
 * Incluye especificaciones (campo JSONB de PostgreSQL)
 * y el nombre completo de la categoría con JOIN.
 */
const obtenerProductoPorId = async (req, res) => {
  try {
    // El id viene en req.params (parte de la URL)
    const { id } = req.params;

    /**
     * Validación básica del ID
     * 
     * Verificamos que sea un número antes de consultar la BD.
     * Esto evita inyecciones SQL y errores innecesarios.
     */
    if (isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El ID debe ser un número válido'
      });
    }

    const query = `
      SELECT 
        p.id,
        p.sku,
        p.nombre,
        p.marca,
        p.referencia,
        p.unidad_medida,
        p.precio_venta,
        p.stock,
        p.stock_minimo,
        p.estado,
        p.imagen,
        p.descripcion,
        p.especificaciones,
        p.observaciones,
        p.fecha_creacion,
        p.fecha_actualizacion,
        c.nombre AS categoria,
        c.tipo_control,
        c.descripcion AS categoria_descripcion
      FROM productos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    // Si no encontró ningún producto con ese ID
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No existe un producto con el ID ${id}`
      });
    }

    // Devolvemos el producto encontrado
    res.json({
      ok: true,
      datos: result.rows[0]
    });

  } catch (err) {
    console.error('Error en obtenerProductoPorId:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


/**
 * GET /api/categorias
 * 
 * Devuelve todas las categorías disponibles.
 * Útil para que el cliente sepa por qué categorías puede filtrar.
 */
const obtenerCategorias = async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        nombre,
        tipo_control,
        descripcion
      FROM categorias
      ORDER BY nombre ASC
    `;

    const result = await pool.query(query);

    res.json({
      ok: true,
      total: result.rows.length,
      datos: result.rows
    });

  } catch (err) {
    console.error('Error en obtenerCategorias:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


// Exportamos las tres funciones para usarlas en las rutas
module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  obtenerCategorias
};
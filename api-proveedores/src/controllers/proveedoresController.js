// src/controllers/proveedoresController.js

// Importamos el pool de conexión que configuramos en db.js
const pool = require('../config/db');

/**
 * CONTROLLER DE PROVEEDORES
 *
 * Un controller es el responsable de:
 * 1. Recibir la petición (req = request)
 * 2. Consultar la base de datos
 * 3. Devolver la respuesta (res = response)
 *
 * Cada función aquí corresponde a un endpoint de la API.
 */


/**
 * GET /api/proveedores
 *
 * Devuelve todos los proveedores registrados.
 * Incluye el NOMBRE del tipo de documento en vez del ID
 * usando un JOIN entre proveedores y tipos_documento.
 *
 * Parámetros opcionales por URL (query params):
 * - tipo_proveedor : filtra por tipo              ej: ?tipo_proveedor=nacional
 * - estado         : filtra por estado            ej: ?estado=activo
 * - pais           : filtra por país              ej: ?pais=Colombia
 * - buscar         : busca por razón social,
 *                    nombre contacto o documento  ej: ?buscar=ferretería
 */
const obtenerProveedores = async (req, res) => {
  try {
    // Leemos los filtros que lleguen en la URL
    const { tipo_proveedor, estado, pais, buscar } = req.query;

    /**
     * Construcción dinámica de la consulta SQL
     *
     * Usamos un array de condiciones para armar el WHERE
     * solo con los filtros que el cliente envió.
     */
    let condiciones = [];
    let valores     = [];
    let contador    = 1;

    // Si enviaron ?tipo_proveedor=xxx
    if (tipo_proveedor) {
      condiciones.push(`p.tipo_proveedor ILIKE $${contador}`);
      valores.push(`%${tipo_proveedor}%`);
      contador++;
    }

    // Si enviaron ?estado=xxx
    if (estado) {
      condiciones.push(`p.estado ILIKE $${contador}`);
      valores.push(`%${estado}%`);
      contador++;
    }

    // Si enviaron ?pais=xxx
    if (pais) {
      condiciones.push(`p.pais ILIKE $${contador}`);
      valores.push(`%${pais}%`);
      contador++;
    }

    // Si enviaron ?buscar=xxx — busca en razón social, nombre contacto y documento
    if (buscar) {
      condiciones.push(
        `(p.razon_social ILIKE $${contador} OR p.nombre_contacto ILIKE $${contador} OR p.numero_documento ILIKE $${contador})`
      );
      valores.push(`%${buscar}%`);
      contador++;
    }

    // Armamos el WHERE solo si hay condiciones
    const whereClause = condiciones.length > 0
      ? `WHERE ${condiciones.join(' AND ')}`
      : '';

    /**
     * La consulta SQL con JOIN a tipos_documento
     *
     * No exponemos: creado_por_id (dato interno del sistema)
     * Sí exponemos: tipo de documento legible (nombre) en vez del ID
     */
    const query = `
      SELECT
        p.id,
        p.numero_documento,
        td.nombre      AS tipo_documento,
        p.razon_social,
        p.nombre_contacto,
        p.cargo_contacto,
        p.email,
        p.telefono,
        p.direccion,
        p.ciudad,
        p.departamento,
        p.pais,
        p.tipo_proveedor,
        p.estado,
        p.observaciones,
        p.fecha_registro
      FROM proveedores p
      JOIN tipos_documento td ON p.tipo_documento_id = td.id
      ${whereClause}
      ORDER BY p.razon_social ASC
    `;

    const result = await pool.query(query, valores);

    /**
     * Respuesta exitosa con metadata
     */
    res.json({
      ok: true,
      total: result.rows.length,
      filtros: { tipo_proveedor, estado, pais, buscar },
      datos: result.rows
    });

  } catch (err) {
    console.error('Error en obtenerProveedores:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


/**
 * GET /api/proveedores/:id
 *
 * Devuelve el detalle completo de UN proveedor específico.
 * El :id viene en la URL, ej: /api/proveedores/5
 *
 * Incluye todos los campos de la tabla incluyendo observaciones
 * y el nombre del tipo de documento con JOIN.
 */
const obtenerProveedorPorId = async (req, res) => {
  try {
    const { id } = req.params;

    /**
     * Validación básica del ID
     * Verificamos que sea un número antes de consultar la BD.
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
        p.numero_documento,
        td.nombre      AS tipo_documento,
        p.razon_social,
        p.nombre_contacto,
        p.cargo_contacto,
        p.email,
        p.telefono,
        p.direccion,
        p.ciudad,
        p.departamento,
        p.pais,
        p.tipo_proveedor,
        p.estado,
        p.observaciones,
        p.fecha_registro
      FROM proveedores p
      JOIN tipos_documento td ON p.tipo_documento_id = td.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);

    // Si no encontró ningún proveedor con ese ID
    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: `No existe un proveedor con el ID ${id}`
      });
    }

    res.json({
      ok: true,
      datos: result.rows[0]
    });

  } catch (err) {
    console.error('Error en obtenerProveedorPorId:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


/**
 * GET /api/tipos-documento
 *
 * Devuelve todos los tipos de documento disponibles.
 * Útil para que el cliente sepa qué tipos existen
 * (ej: NIT, CC, CE, Pasaporte, etc.)
 */
const obtenerTiposDocumento = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        nombre
      FROM tipos_documento
      ORDER BY nombre ASC
    `;

    const result = await pool.query(query);

    res.json({
      ok: true,
      total: result.rows.length,
      datos: result.rows
    });

  } catch (err) {
    console.error('Error en obtenerTiposDocumento:', err.message);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor',
      detalle: err.message
    });
  }
};


// Exportamos las tres funciones para usarlas en las rutas
module.exports = {
  obtenerProveedores,
  obtenerProveedorPorId,
  obtenerTiposDocumento
};

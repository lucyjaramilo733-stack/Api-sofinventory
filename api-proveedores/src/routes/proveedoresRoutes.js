// src/routes/proveedoresRoutes.js

const express = require('express');
const router  = express.Router();

// Importamos los controladores
const {
  obtenerProveedores,
  obtenerProveedorPorId,
  obtenerTiposDocumento
} = require('../controllers/proveedoresController');

/**
 * MIDDLEWARE DE SEGURIDAD - SOLO GET
 *
 * Intercepta TODAS las peticiones que lleguen a /api/*
 * y verifica que el método HTTP sea GET.
 *
 * Si alguien intenta POST, PUT, PATCH o DELETE, recibe un error 405.
 */
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

/**
 * DEFINICIÓN DE RUTAS (END-POINTS)
 */

// GET /api/proveedores           → Lista todos los proveedores (con filtros opcionales)
router.get('/proveedores', obtenerProveedores);

// GET /api/proveedores/:id       → Detalle de un proveedor específico
router.get('/proveedores/:id', obtenerProveedorPorId);

// GET /api/tipos-documento       → Lista todos los tipos de documento
router.get('/tipos-documento', obtenerTiposDocumento);

// Exportamos el router para usarlo en el archivo principal
module.exports = router;

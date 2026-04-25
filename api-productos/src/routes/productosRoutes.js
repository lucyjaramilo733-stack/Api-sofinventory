// src/routes/productosRoutes.js

const express = require('express');
const router = express.Router();

// Importamos los controladores
const {
    obtenerProductos,
    obtenerProductoPorId,
    obtenerCategorias
} = require('../controllers/productosController');

/**
 * MIDDLEWARE DE SEGURIDAD - SOLO GET
 * 
 * Este middleware intercepta TODAS las peticiones que lleguen a /api/productos/*
 * y verifica que el método HTTP sea GET.
 * 
 * Si alguien intenta POST, PUT, PATCH o DELETE, recibe un error 405.
 * Esto es CRUCIAL para el proyecto porque la otra empresa externa SOLO puede consultar
router.use((req, res, next) => {
    // Lista de métodos permitidos (solo GET)
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
    next(); // Si es GET, continúa con el controlador
});

/**
 * DEFINICIÓN DE RUTAS (END-POINTS)
 * 
 * Cada ruta corresponde a una función del controlador.
 * Todas son GET porque el middleware ya bloqueó los otros métodos.
 */

// GET /api/productos - Lista todos los productos (con filtros opcionales)
router.get('/productos', obtenerProductos);

// GET /api/productos/:id - Detalle de un producto específico
router.get('/productos/:id', obtenerProductoPorId);

// GET /api/categorias - Lista todas las categorías (útil para filtros)
router.get('/categorias', obtenerCategorias);

// Exportamos el router para usarlo en el archivo principal
module.exports = router;
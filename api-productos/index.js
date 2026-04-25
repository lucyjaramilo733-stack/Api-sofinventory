/**
 * @file index.js
 * @description Punto de entrada principal de la API REST de SofInventory.
 *              Configura el servidor Express, middlewares, rutas y restricciones
 *              de seguridad. Esta API es de solo lectura (únicamente métodos GET).
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();
// Importación de rutas del módulo de productos
const productosRoutes = require('./src/routes/productosRoutes');

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;
/**
 * Configuración de CORS (Cross-Origin Resource Sharing)
 * Permite que frontends u otros clientes externos consuman la API.
 * - origin '*'     → acepta peticiones desde cualquier dominio
 * - methods        → solo permite GET y OPTIONS
 * - allowedHeaders → cabeceras permitidas, incluyendo la de ngrok para pruebas
 */
app.use(cors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// ✅ Manejar preflight OPTIONS
app.options('*', cors());

// ✅ Middlewares estándar
app.use(express.json());

// ✅ Middleware de solo GET
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

// ✅ Rutas
app.use('/api', productosRoutes);
/**
 * Ruta raíz — información general de la API
 * Útil para verificar que el servidor está online y ver los endpoints disponibles.
 */
app.get('/', (req, res) => {
    res.json({
        nombre: 'API de Productos - SofInventory',
        version: '1.0.0',
        estado: 'online',
        endpoints: ['/api/productos', '/api/productos/:id', '/api/categorias']
    });
});
/**
 * Middleware para rutas no encontradas (404)
 * Captura cualquier ruta que no haya sido definida anteriormente
 * y responde con un error descriptivo.
 */
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not Found', mensaje: 'Ruta no existe' });
});
/**
 * Inicio del servidor
 * El servidor comienza a escuchar peticiones en el puerto definido.
 */
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`✅ CORS activado para todos los orígenes`);
});


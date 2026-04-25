const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const proveedoresRoutes = require('./src/routes/proveedoresRoutes');

const app  = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS completo
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
app.use('/api', proveedoresRoutes);

// ✅ Ruta raíz - información de la API
app.get('/', (req, res) => {
  res.json({
    nombre:    'API de Proveedores - SofInventory',
    version:   '1.0.0',
    estado:    'online',
    endpoints: [
      '/api/proveedores',
      '/api/proveedores/:id',
      '/api/tipos-documento'
    ]
  });
});

// ✅ Ruta no encontrada
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', mensaje: 'Ruta no existe' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`✅ CORS activado para todos los orígenes`);
});

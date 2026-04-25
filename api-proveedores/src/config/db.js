// src/config/db.js

// dotenv lee el archivo .env y pone las variables disponibles en process.env
require('dotenv').config();

// pg es el driver oficial de PostgreSQL para Node.js
const { Pool } = require('pg');

/**
 * Pool de conexiones a PostgreSQL
 *
 * Un "pool" es un grupo de conexiones reutilizables.
 * En vez de abrir y cerrar una conexión por cada consulta
 * (lo cual es lento), el pool mantiene varias conexiones
 * abiertas y las reutiliza automáticamente.
 *
 * Todos los datos sensibles vienen del archivo .env
 * y nunca se escriben directamente aquí.
 */
const pool = new Pool({
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT,
});

/**
 * Verificar que la conexión funciona al iniciar
 * Si hay un error (contraseña mal, BD no existe, etc.)
 * lo veremos inmediatamente en la consola
 */
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión a PostgreSQL exitosa');
    release(); // libera la conexión de vuelta al pool
  }
});

// Exportamos el pool para usarlo en los controllers
module.exports = pool;

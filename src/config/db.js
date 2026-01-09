const { Pool } = require('pg');
require('dotenv').config();

// Usamos la URL completa que configuramos en Render
// Si no existe (en local), intentará usar las variables individuales
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Esto es CRÍTICO para que Supabase acepte la conexión desde Render
  }
});

// Prueba de conexión rápida
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conexión a PostgreSQL (Supabase) exitosa');
  }
});

module.exports = pool;
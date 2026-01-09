const { Pool } = require('pg');
require('dotenv').config();

const url = process.env.DATABASE_URL;

if (!url) {
    console.error("❌ ERROR: No se cargó la variable DATABASE_URL. Revisa el archivo .env");
    process.exit(1);
}

// Imprimimos la URL censurada para verificar que se lee el archivo
console.log(`--- Intentando conectar a: ${url.split(':').slice(0, 2).join(':')}:****@... ---`);

const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false } // Obligatorio para Supabase/Cloud 
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error detallado:', err.message);
    } else {
        console.log('✅ ¡CONEXIÓN EXITOSA A LA NUBE!');
        console.log('Fecha/Hora servidor:', res.rows[0].now);
    }
    pool.end();
});
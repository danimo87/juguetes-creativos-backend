const bcrypt = require('bcryptjs');
const pool = require('../config/db'); // Ajusta la ruta a tu archivo de conexión
require('dotenv').config();

async function crearAdmin() {
    const nombre = 'Administrador Principal';
    const usuario = 'admin';
    const clavePlana = 'admin123'; // Esta es la que usarás para loguearte
    const rol = 'Administrador';

    try {
        // 1. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const claveEncriptada = await bcrypt.hash(clavePlana, salt);

        // 2. Insertar en la base de datos
        const query = `
            INSERT INTO USUARIOS (username, password, nombre_completo, rol)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING id_usuario;
        `;

        const res = await pool.query(query, [usuario, claveEncriptada, nombre, rol]);

        if (res.rowCount > 0) {
            console.log('✅ Usuario administrador creado con éxito.');
            console.log('Usuario: admin');
            console.log('Contraseña: admin123');
        } else {
            console.log('⚠️ El usuario ya existe en la base de datos.');
        }
    } catch (err) {
        console.error('❌ Error al crear el administrador:', err);
    } finally {
        pool.end();
    }
}

crearAdmin();
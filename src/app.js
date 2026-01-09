require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./config/db'); 
const verificarToken = require('./middleware/auth');

const app = express();

// --- 1. CONFIGURACIÓN DE CORS ---
app.use(cors({
    origin: [
        'https://juguetes-creativos-frontend.vercel.app', 
        'http://localhost:5173',
        'http://127.0.0.1:5500'
    ], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- 2. RASTREADOR DE PETICIONES ---
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] 📡 Petición: ${req.method} ${req.url}`);
    next();
});

// --- 3. VERIFICACIÓN DE BASE DE DATOS ---
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ ERROR: No se pudo conectar a PostgreSQL.');
    } else {
        console.log('✅ CONEXIÓN EXITOSA: PostgreSQL listo.');
    }
});

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
    // CAMBIO: Usamos 'password' en lugar de 'contraseña'
    const { nombre, email, password, rol } = req.body; 

    try {
        // Validación de seguridad: si no llega el password, avisamos antes de fallar
        if (!password) {
            return res.status(400).json({ success: false, message: "Falta la contraseña en la petición" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt); // Ahora sí recibirá el string correcto
        
        const query = `
            INSERT INTO USUARIOS (nombre_completo, username, password, rol) 
            VALUES ($1, $2, $3, $4) RETURNING id_usuario, username, rol`;
        
        const result = await pool.query(query, [nombre, email, passwordHash, rol || 'Vendedor']);
        res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error("❌ Error en registro:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM USUARIOS WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ success: false, message: 'Usuario no encontrado' });

        const user = result.rows[0];
        const esValida = await bcrypt.compare(password, user.password);
        if (!esValida) return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id_usuario, rol: user.rol }, 
            process.env.JWT_SECRET || 'secreto_temporal', 
            { expiresIn: '8h' }
        );
        res.json({ success: true, data: { token, usuario: { id: user.id_usuario, nombre: user.nombre_completo, rol: user.rol } } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- RUTAS DE JUGUETES (CRUD) ---

// 1. OBTENER TODOS (CORREGIDO)
app.get('/api/juguetes', verificarToken, async (req, res) => {
    try {
        // Hacemos JOIN para ver el nombre de la categoría y material en la tabla
        const query = `
            SELECT j.id_juguete, j.nombre_juguete, c.nombre_categoria as categoria, 
                   m.nombre_material as material, j.stock_actual
            FROM JUGUETE j
            LEFT JOIN CATEGORIA c ON j.id_categoria = c.id_categoria
            LEFT JOIN MATERIAL m ON j.id_material = m.id_material
            ORDER BY j.id_juguete ASC`;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. CREAR (CORREGIDO)
app.post('/api/juguetes', verificarToken, async (req, res) => {
    const { nombre_juguete, categoria, material, stock_disponible } = req.body;
    try {
        const id_juguete = 'JUG-' + Math.floor(Math.random() * 9999);
        const query = `
            INSERT INTO JUGUETE (id_juguete, nombre_juguete, id_categoria, id_material, stock_actual) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`;
        
        const values = [id_juguete, nombre_juguete, categoria, material, stock_disponible || 0];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, message: "¡Juguete guardado!", data: result.rows[0] });
    } catch (err) {
        console.error("❌ Error en DB:", err.message);
        res.status(500).json({ success: false, message: "Error en la base de datos: " + err.message });
    }
});

// 3. ACTUALIZAR (CORREGIDO: Ahora usa id_categoria, id_material y stock_actual)
app.put('/api/juguetes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { nombre_juguete, categoria, material, stock_disponible } = req.body;
    try {
        const query = `
            UPDATE JUGUETE 
            SET nombre_juguete = $1, id_categoria = $2, id_material = $3, stock_actual = $4 
            WHERE id_juguete = $5 RETURNING *`;
        const result = await pool.query(query, [nombre_juguete, categoria, material, stock_disponible, id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error al actualizar: " + err.message });
    }
});

// 4. ELIMINAR
app.delete('/api/juguetes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM JUGUETE WHERE id_juguete = $1', [id]);
        res.json({ success: true, message: "Juguete eliminado" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

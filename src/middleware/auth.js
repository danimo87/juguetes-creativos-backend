const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Obtener el token del encabezado Authorization
    // El formato suele ser: "Bearer TOKEN_AQUÍ"
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // 2. Si no hay token, denegar acceso
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso denegado. No se proporcionó un token.' 
        });
    }

    try {
        // 3. Verificar el token usando la clave secreta de tu archivo .env
        const cifrado = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Guardar los datos del usuario (id y rol) en la petición para usarlo después
        // Esto permite saber qué usuario está haciendo la acción
        req.usuario = cifrado;
        
        // 5. Continuar a la siguiente función (el controlador)
        next();
    } catch (error) {
        res.status(403).json({ 
            success: false, 
            message: 'Token no válido o expirado.' 
        });
    }
};

module.exports = verificarToken;
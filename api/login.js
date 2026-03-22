require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, User } = require('./_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método no permitido' });

    try {
        await connectDB();
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
        }

        const user = await User.findOne({ $or: [{ email: username }, { username }] });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado. Por favor regístrate para crear una cuenta.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Contraseña incorrecta. Inténtalo de nuevo.' });
        }

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                role: user.role || 'user'
            }
        });
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
    }
};

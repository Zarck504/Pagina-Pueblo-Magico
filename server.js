require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (CSS, JS, imágenes, videos, etc.)
app.use(express.static(path.join(__dirname), {
    index: false // No servir index automáticamente, lo manejamos manualmente
}));

// Configuración de Mongoose
mongoose.set('strictQuery', false);
mongoose.set('debug', false);

// Opciones de conexión a MongoDB
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Usar IPv4, evitar fallos de IPv6
    autoIndex: true
};

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pueblo-magico', mongoOptions)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('Conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión a MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Desconectado de MongoDB');
});

// Modelo de Usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Modelo de Reseña
const reviewSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    experience: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Ruta para obtener las reseñas
getReviews = async (req, res) => {
    try {
        const { experience } = req.query;
        const query = {};
        
        // Si se proporciona un tipo de experiencia, filtrar por él
        if (experience) {
            query.experience = experience;
        }
        
        const reviews = await Review.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error al obtener reseñas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las reseñas', error: error.message });
    }
};

// Ruta para eliminar una reseña
deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        
        if (!id || !userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de reseña y correo electrónico son requeridos' 
            });
        }

        // Buscar y eliminar la reseña
        const result = await Review.findOneAndDelete({ 
            _id: id, 
            userEmail: userEmail 
        });

        if (!result) {
            return res.status(404).json({ 
                success: false, 
                title: 'Error',
                message: 'No se pudo encontrar la reseña o no tienes permiso para eliminarla',
                type: 'error'
            });
        }

        res.status(200).json({ 
            success: true, 
            title: '¡Eliminada!',
            message: 'La reseña ha sido eliminada correctamente',
            type: 'success'
        });
    } catch (error) {
        console.error('Error al eliminar la reseña:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar la reseña',
            error: error.message 
        });
    }
};

// Ruta para guardar una nueva reseña
postReview = async (req, res) => {
    try {
        const { userEmail, userName, rating, comment, experience } = req.body;
        
        // Validar datos
        if (!userEmail || !userName || !rating || !comment || !experience) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son requeridos' 
            });
        }

        // Log all reviews for debugging
        console.log('Buscando reseñas existentes para:', { userEmail, experience });
        const allReviews = await Review.find({});
        console.log('Todas las reseñas en la base de datos:', JSON.stringify(allReviews, null, 2));
        
        // Check for existing review from this user for this experience
        const existingReviews = await Review.find({ 
            userEmail: userEmail, 
            experience: experience
        });
        
        console.log('Reseñas existentes del usuario para esta experiencia:', existingReviews);
        
        // Temporary: Allow multiple reviews for testing
        console.log('Permitiendo múltiples reseñas temporalmente para pruebas');
        /*
        if (existingReviews.length > 0) {
            console.log('Encontrada reseña existente, rechazando nueva reseña');
            return res.status(400).json({ 
                success: false, 
                message: 'Ya has enviado una reseña para esta experiencia' 
            });
        }
        */

        // Crear nueva reseña
        const newReview = new Review({
            userEmail,
            userName,
            rating,
            comment,
            experience
        });

        await newReview.save();

        res.status(201).json({ 
            success: true, 
            message: '¡Reseña guardada exitosamente!',
            data: newReview
        });
    } catch (error) {
        console.error('Error al guardar la reseña:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar la reseña',
            error: error.message 
        });
    }
};

// Ruta para registro de usuarios
app.post('/api/register', async (req, res) => {
    console.log('Solicitud de registro recibida:', req.body); // Para depuración
    try {
        const { name, email, username, password, role = 'user' } = req.body; // Por defecto 'user' si no se especifica
        
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'El correo electrónico o nombre de usuario ya está en uso' 
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear nuevo usuario
        const newUser = new User({
            name,
            email,
            role, // Añadir el rol al nuevo usuario
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente' 
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar el usuario',
            error: error.message 
        });
    }
});

// Ruta para inicio de sesión
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar por username o email
        const user = await User.findOne({
            $or: [{ email: username }, { username }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado. Por favor regístrate para crear una cuenta.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta. Inténtalo de nuevo.'
            });
        }

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role || 'user'
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: userData
        });
    } catch (error) {
        console.error('Error en inicio de sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// Rutas para reseñas
app.get('/api/reviews', getReviews);
app.post('/api/reviews', postReview);
app.delete('/api/reviews/:id', deleteReview);

// Ruta para manejar las páginas del sitio: solo sirve index.html para rutas
// que NO sean archivos estáticos con extensión conocida
app.get('*', (req, res) => {
    const ext = path.extname(req.path);
    // Si tiene extensión de archivo conocida que no se sirvió antes, devolver 404
    const staticExtensions = ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif',
        '.mp4', '.json', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.webm'];
    if (ext && staticExtensions.includes(ext.toLowerCase())) {
        return res.status(404).send('Archivo no encontrado');
    }
    // Para cualquier otra ruta (páginas), servir index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

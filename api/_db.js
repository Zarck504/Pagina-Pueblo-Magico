const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    const mongoOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        autoIndex: true
    };

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pueblo-magico', mongoOptions);
    isConnected = true;
}

// Modelo de Usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

// Modelo de Reseña
const reviewSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    experience: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = { connectDB, User, Review };

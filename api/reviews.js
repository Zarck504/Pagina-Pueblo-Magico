require('dotenv').config();
const { connectDB, Review } = require('./_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    await connectDB();

    if (req.method === 'GET') {
        try {
            const { experience } = req.query;
            const query = experience ? { experience } : {};
            const reviews = await Review.find(query).sort({ createdAt: -1 });
            return res.status(200).json({ success: true, data: reviews });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al obtener las reseñas', error: error.message });
        }
    }

    if (req.method === 'POST') {
        try {
            const { userEmail, userName, rating, comment, experience } = req.body;

            if (!userEmail || !userName || !rating || !comment || !experience) {
                return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
            }

            const newReview = new Review({ userEmail, userName, rating, comment, experience });
            await newReview.save();

            return res.status(201).json({
                success: true,
                message: '¡Reseña guardada exitosamente!',
                data: newReview
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al guardar la reseña', error: error.message });
        }
    }

    res.status(405).json({ success: false, message: 'Método no permitido' });
};

require('dotenv').config();
const { connectDB, Review } = require('../_db');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'DELETE') return res.status(405).json({ success: false, message: 'Método no permitido' });

    try {
        await connectDB();
        const { id } = req.query;
        const { userEmail } = req.body;

        if (!id || !userEmail) {
            return res.status(400).json({ success: false, message: 'ID de reseña y correo electrónico son requeridos' });
        }

        const result = await Review.findOneAndDelete({ _id: id, userEmail });

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
        res.status(500).json({ success: false, message: 'Error al eliminar la reseña', error: error.message });
    }
};

// routes/reportes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Obtener estadísticas generales (público)
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalProyectos: await mongoose.connection.collection('proyectos').countDocuments(),
            proyectosActivos: await mongoose.connection.collection('proyectos').countDocuments({ estado: 'pendiente' }),
            proyectosTerminados: await mongoose.connection.collection('proyectos').countDocuments({ estado: 'terminado' }),
            totalUsuarios: await mongoose.connection.collection('users').countDocuments(),
            totalPosts: await mongoose.connection.collection('posts').countDocuments()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener datos para gráficos y exportación (público)
router.get('/charts', async (req, res) => {
    try {
        const proyectos = await mongoose.connection.collection('proyectos').find({}).toArray();
        const posts = await mongoose.connection.collection('posts').find({}).toArray();
        const users = await mongoose.connection.collection('users').find({}).toArray();
        // Añadir comentarios si la colección existe
        const comentarios = await mongoose.connection.collection('comentarios').find({}).toArray();

        res.json({ proyectos, posts, users, comentarios });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
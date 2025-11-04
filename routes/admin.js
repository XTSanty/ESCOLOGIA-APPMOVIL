// routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Historial = require('../models/Historial'); // Asegúrate de crear este modelo

// Middleware para verificar si es admin
const isAdmin = (req, res, next) => {
    if (!req.session || !req.session.usuarioId) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    if (req.session.tipoUsuario !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: solo administradores' });
    }
    next();
};

// Registrar acción en historial
const registrarAccion = async (req, accion, descripcion) => {
    const historial = new Historial({
        usuario: req.session.correo,
        accion,
        descripcion,
        ip: req.ip
    });
    await historial.save();
};

// Obtener todos los usuarios (solo admin)
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { contraseña: 0 });
        await registrarAccion(req, 'Ver usuarios', 'Administrador visualizó la lista de usuarios');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un usuario por ID (solo admin)
router.get('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { contraseña: 0 });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar usuario (solo admin)
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await registrarAccion(req, 'Actualizar usuario', `Actualizó datos del usuario ${user.correo}`);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar usuario (solo admin)
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await registrarAccion(req, 'Eliminar usuario', `Eliminó al usuario ${user.correo}`);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restablecer contraseña de un usuario (solo admin)
router.post('/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const { nuevaContraseña } = req.body;
        if (!nuevaContraseña || nuevaContraseña.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        user.contraseña = nuevaContraseña; // Esto se hashearía en el modelo
        await user.save();

        await registrarAccion(req, 'Restablecer contraseña', `Restableció contraseña del usuario ${user.correo}`);

        res.json({ message: 'Contraseña restablecida exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener historial de acciones
router.get('/historial', isAdmin, async (req, res) => {
    try {
        const historial = await Historial.find({}).sort({ fecha: -1 }).limit(100);
        res.json(historial);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener estadísticas (solo admin)
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            totalPosts: await mongoose.connection.collection('posts').countDocuments(),
            totalProjects: await mongoose.connection.collection('proyectos').countDocuments(),
            activeUsers: await User.countDocuments({ activo: true })
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
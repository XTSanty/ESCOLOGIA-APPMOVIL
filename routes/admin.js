// routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Importar modelo de Historial
const Historial = require('../models/Historial');

// Middleware para verificar si es admin
const isAdmin = (req, res, next) => {
    if (!req.session || !req.session.usuarioId) {
        return res.status(401).json({ 
            success: false,
            error: 'No autorizado - Sesión no válida' 
        });
    }
    
    // Verificar si es admin por correo o por tipo de usuario
    const esAdmin = req.session.tipoUsuario === 'admin' || 
                    req.session.tipoUsuario === 'administrador' ||
                    req.session.correo === 'admin@escuela.edu.mx' ||
                    req.session.correo === 'sergio.admin@escuela.edu.mx';
    
    if (!esAdmin) {
        return res.status(403).json({ 
            success: false,
            error: 'Acceso denegado: solo administradores' 
        });
    }
    next();
};

// Registrar acción en historial
const registrarAccion = async (req, accion, descripcion) => {
    try {
        const historial = new Historial({
            usuario: req.session.correo || 'admin',
            accion,
            descripcion,
            ip: req.ip || req.connection.remoteAddress,
            fecha: new Date()
        });
        await historial.save();
    } catch (error) {
        console.error('Error al registrar historial:', error);
    }
};

// ============================================
// RUTAS DE USUARIOS
// ============================================

// Obtener todos los usuarios (solo admin)
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { contraseña: 0 }).sort({ fechaCreacion: -1 });
        
        await registrarAccion(req, 'Ver usuarios', 'Administrador visualizó la lista de usuarios');
        
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener usuarios',
            message: error.message 
        });
    }
});

// Obtener un usuario por ID (solo admin)
router.get('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { contraseña: 0 });
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener usuario',
            message: error.message 
        });
    }
});

// ✅ CORREGIDO: Actualizar usuario CON soporte para cambio de contraseña (SIN doble hasheo)
router.put('/users/:id', isAdmin, async (req, res) => {
    try {
        const { nombre, correo, institucion, password } = req.body;
        
        // Buscar el usuario primero
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }

        // Actualizar campos básicos
        if (nombre) user.nombre = nombre;
        if (correo) user.correo = correo;
        if (institucion) user.institucion = institucion;
        
        // ✅ Si se proporciona una nueva contraseña, actualizarla
        if (password && password.trim() !== '') {
            // Validar longitud mínima
            if (password.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres' 
                });
            }
            
            // ✅ SOLO asignar - el middleware de User.js la hasheará automáticamente
            user.contraseña = password;
            
            console.log(`✅ Contraseña actualizada para usuario: ${user.correo}`);
        }
        
        // Actualizar fecha de modificación
        user.fechaActualizacion = Date.now();
        
        // Guardar cambios (el middleware pre('save') hasheará la contraseña)
        await user.save();
        
        // Registrar acción en historial
        await registrarAccion(
            req, 
            'Actualizar usuario', 
            `Actualizó datos del usuario ${user.correo}${password ? ' (incluye cambio de contraseña)' : ''}`
        );
        
        // Devolver usuario sin contraseña
        const userResponse = user.toObject();
        delete userResponse.contraseña;
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            user: userResponse
        });
        
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        
        // Manejar error de correo duplicado
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Ya existe un usuario con ese correo electrónico' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error al actualizar usuario',
            message: error.message 
        });
    }
});

// Eliminar usuario (solo admin)
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }
        
        await registrarAccion(req, 'Eliminar usuario', `Eliminó al usuario ${user.correo}`);
        
        res.json({ 
            success: true,
            message: 'Usuario eliminado exitosamente' 
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al eliminar usuario',
            message: error.message 
        });
    }
});

// ✅ CORREGIDO: Restablecer contraseña de un usuario (SIN doble hasheo)
router.post('/users/:id/reset-password', isAdmin, async (req, res) => {
    try {
        const { nuevaContraseña } = req.body;
        
        if (!nuevaContraseña || nuevaContraseña.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuario no encontrado' 
            });
        }

        // ✅ SOLO asignar - el middleware de User.js la hasheará automáticamente
        user.contraseña = nuevaContraseña;
        user.fechaActualizacion = Date.now();
        
        // Guardar (el middleware pre('save') hasheará la contraseña)
        await user.save();

        await registrarAccion(req, 'Restablecer contraseña', `Restableció contraseña del usuario ${user.correo}`);

        res.json({ 
            success: true,
            message: 'Contraseña restablecida exitosamente' 
        });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al restablecer contraseña',
            message: error.message 
        });
    }
});

// ============================================
// RUTAS DE HISTORIAL Y ESTADÍSTICAS
// ============================================

// Obtener historial de acciones
router.get('/historial', isAdmin, async (req, res) => {
    try {
        const historial = await Historial.find({})
            .sort({ fecha: -1 })
            .limit(100);
            
        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener historial',
            message: error.message 
        });
    }
});

// Obtener estadísticas (solo admin)
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            activeUsers: await User.countDocuments({ activo: true }),
            inactiveUsers: await User.countDocuments({ activo: false })
        };
        
        // Intentar obtener estadísticas de otras colecciones
        try {
            stats.totalPosts = await mongoose.connection.collection('posts').countDocuments();
        } catch (error) {
            stats.totalPosts = 0;
        }
        
        try {
            stats.totalProjects = await mongoose.connection.collection('proyectos').countDocuments();
        } catch (error) {
            stats.totalProjects = 0;
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message 
        });
    }
});

// ============================================
// RUTA DE PRUEBA
// ============================================

// Ruta de prueba para verificar que el módulo funciona
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Rutas de administración funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
// routes/perfil.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Asegúrate de instalar bcryptjs: npm install bcryptjs

// Importar modelos
const User = require('../models/User'); // Asumiendo que tienes un modelo User

// Cambiar contraseña
router.post('/change-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        // Validar entrada
        if (!email || !newPassword) {
            return res.status(400).json({ 
                error: 'Email y nueva contraseña son requeridos' 
            });
        }
        
        // Validar longitud de contraseña
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }
        
        // Buscar usuario
        const user = await User.findOne({ correo: email });
        if (!user) {
            return res.status(404).json({ 
                error: 'Usuario no encontrado' 
            });
        }
        
        // Hash de la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Actualizar contraseña
        user.contraseña = hashedPassword;
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Contraseña actualizada exitosamente' 
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// Obtener información del usuario
router.get('/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ correo: req.params.email });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
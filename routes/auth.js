// routes/auth.js - Rutas para autenticación con sesiones
const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Ruta para LOGIN (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    // Validar que se envíen los datos necesarios
    if (!correo || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    // Buscar el usuario por correo electrónico
    const usuario = await User.findOne({ correo: correo.toLowerCase() });
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacta al administrador.'
      });
    }

    // Comparar la contraseña
    const contraseñaValida = await usuario.compararContraseña(contraseña);
    
    if (!contraseñaValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // ✅ CREAR SESIÓN EN MONGODB
    req.session.usuarioId = usuario._id;
    req.session.correo = usuario.correo;
    req.session.nombre = usuario.nombre;
    req.session.tipoUsuario = usuario.tipoUsuario;
    req.session.institucion = usuario.institucion;

    // Guardar sesión explícitamente (opcional, pero recomendado)
    req.session.save((err) => {
      if (err) {
        console.error('Error guardando sesión:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al crear la sesión'
        });
      }
    });

    // Login exitoso - enviar información del usuario (sin contraseña)
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      usuario: usuario.obtenerInfoPublica()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para REGISTRO (POST /api/auth/register)
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contraseña, tipoUsuario, institucion } = req.body;

    // Validar datos obligatorios
    if (!nombre || !correo || !contraseña) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, correo y contraseña son obligatorios'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await User.findOne({ correo: correo.toLowerCase() });
    
    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este correo electrónico'
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new User({
      nombre,
      correo,
      contraseña, // Se hasheará automáticamente por el middleware
      tipoUsuario: tipoUsuario || 'escuela',
      institucion
    });

    // Guardar en la base de datos
    const usuarioGuardado = await nuevoUsuario.save();

    // Enviar respuesta exitosa (sin contraseña)
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      usuario: usuarioGuardado.obtenerInfoPublica()
    });

  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errores: mensajes
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener información del usuario actual (GET /api/auth/me)
router.get('/me', (req, res) => {
  if (req.session && req.session.usuarioId) {
    res.json({
      success: true,
      user: {
        id: req.session.usuarioId,
        nombre: req.session.nombre,
        correo: req.session.correo,
        tipoUsuario: req.session.tipoUsuario,
        institucion: req.session.institucion
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
});

// Ruta para CERRAR SESIÓN (POST /api/auth/logout)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  });
});

// Ruta para obtener información del usuario (GET /api/auth/user/:id)
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar usuario por ID
    const usuario = await User.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Enviar información del usuario (sin contraseña)
    res.status(200).json({
      success: true,
      usuario: usuario.obtenerInfoPublica()
    });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
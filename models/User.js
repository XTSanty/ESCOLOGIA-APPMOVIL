// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
  // ID único generado automáticamente por MongoDB
  
  // Información básica del usuario
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true, // Elimina espacios en blanco al inicio y final
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },

  // Correo electrónico único para el login
  correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true, // No permite correos duplicados
    lowercase: true, // Convierte a minúsculas automáticamente
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un correo electrónico válido'
    ]
  },

  // Contraseña encriptada
  contraseña: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    // No incluimos maxlength aquí porque la contraseña será hasheada
  },

  // Tipo de usuario (escuela, administrador, etc.)
  tipoUsuario: {
    type: String,
    enum: ['escuela', 'administrador', 'coordinador'],
    default: 'escuela'
  },

  // Información adicional de la institución
  institucion: {
    type: String,
    trim: true,
    maxlength: [100, 'El nombre de la institución no puede exceder 100 caracteres']
  },

  // Estado del usuario (activo/inactivo)
  activo: {
    type: Boolean,
    default: true
  },

  // Fecha de creación y última actualización
  fechaCreacion: {
    type: Date,
    default: Date.now
  },

  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashea la contraseña si ha sido modificada
  if (!this.isModified('contraseña')) return next();

  try {
    // Genera un salt con factor de 12 (seguridad alta)
    const salt = await bcrypt.genSalt(12);
    
    // Hashea la contraseña con el salt
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar fecha de modificación
userSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

// Método para comparar contraseñas en el login
userSchema.methods.compararContraseña = async function(contraseñaIngresada) {
  try {
    // Compara la contraseña ingresada con la hasheada
    return await bcrypt.compare(contraseñaIngresada, this.contraseña);
  } catch (error) {
    throw new Error('Error al comparar contraseñas');
  }
};

// Método para obtener información del usuario sin la contraseña
userSchema.methods.obtenerInfoPublica = function() {
  const userObject = this.toObject();
  delete userObject.contraseña; // Elimina la contraseña del objeto
  return userObject;
};

// Crear y exportar el modelo
const User = mongoose.model('User', userSchema);

module.exports = User;
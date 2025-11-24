// models/Historial.js
const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
    // Usuario que realizó la acción
    usuario: {
        type: String,
        required: true,
        trim: true
    },
    
    // Tipo de acción realizada
    accion: {
        type: String,
        required: true
    },
    
    // Descripción detallada de la acción
    descripcion: {
        type: String,
        required: true,
        maxlength: 500
    },
    
    // IP desde donde se realizó la acción
    ip: {
        type: String,
        default: 'No disponible'
    },
    
    // Fecha y hora de la acción
    fecha: {
        type: Date,
        default: Date.now
    }
});

// Índice para búsquedas más rápidas
historialSchema.index({ fecha: -1 });
historialSchema.index({ usuario: 1 });

const Historial = mongoose.model('Historial', historialSchema);

module.exports = Historial;
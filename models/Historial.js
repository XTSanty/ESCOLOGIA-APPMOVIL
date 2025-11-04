// models/Historial.js
const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    accion: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    ip: { type: String }
});

module.exports = mongoose.model('Historial', historialSchema);
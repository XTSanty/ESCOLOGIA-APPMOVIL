// routes/proyectos.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Definir el esquema para los proyectos
const proyectoSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    estado: { type: String, default: 'pendiente' }, // 'pendiente' o 'terminado'
    fecha: { type: Date, default: Date.now },
    usuario: String,
    correo: String
});

const Proyecto = mongoose.model('Proyecto', proyectoSchema);

// Obtener todos los proyectos
router.get('/', async (req, res) => {
    try {
        const proyectos = await Proyecto.find().sort({ fecha: -1 });
        res.json(proyectos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo proyecto
router.post('/', async (req, res) => {
    try {
        const proyecto = new Proyecto(req.body);
        const savedProyecto = await proyecto.save();
        res.status(201).json(savedProyecto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener un proyecto por ID
router.get('/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findById(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json(proyecto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un proyecto
router.put('/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json(proyecto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar un proyecto
router.delete('/:id', async (req, res) => {
    try {
        const proyecto = await Proyecto.findByIdAndDelete(req.params.id);
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }
        res.json({ message: 'Proyecto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
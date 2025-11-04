// routes/posts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Definir el esquema para los posts
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    category: String,
    user: String,
    email: String,
    likes: { type: Number, default: 0 },
    likedBy: [String],
    comments: [{
        user: String,
        email: String,
        content: String,
        date: { type: Date, default: Date.now }
    }],
    date: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Obtener todos los posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo post
router.post('/', async (req, res) => {
    try {
        const post = new Post(req.body);
        const savedPost = await post.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener un post por ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un post
router.put('/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar un post
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        res.json({ message: 'Post eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agregar like a un post
router.post('/:id/like', async (req, res) => {
    try {
        const { email } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        
        const userLiked = post.likedBy.includes(email);
        if (userLiked) {
            // Quitar like
            post.likes = Math.max(0, post.likes - 1);
            post.likedBy = post.likedBy.filter(e => e !== email);
        } else {
            // Agregar like
            post.likes++;
            post.likedBy.push(email);
        }
        
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agregar comentario a un post
router.post('/:id/comment', async (req, res) => {
    try {
        const comment = {
            ...req.body,
            date: new Date()
        };
        
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: comment } },
            { new: true }
        );
        
        if (!post) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
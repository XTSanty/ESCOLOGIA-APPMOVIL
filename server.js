// server.js - Servidor principal con configuración para Railway
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const proyectoRoutes = require('./routes/proyectos');
const perfilRoutes = require('./routes/perfil');
const adminRoutes = require('./routes/admin');
const reportesRoutes = require('./routes/reportes');

// Crear la aplicación de Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// ✅ CRÍTICO: Trust proxy para Railway
app.set('trust proxy', 1);

// ✅ Configuración de CORS para Railway
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);
        
        // Lista de orígenes permitidos
        const allowedOrigins = [
            'https://tu-app.railway.app', // ✅ Reemplaza con tu dominio de Railway
            'http://localhost:3000',
            'http://localhost:5000'
        ];
        
        // En desarrollo, permitir cualquier origen
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(null, true); // ✅ Temporalmente permitir todos en producción
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// ✅ Configuración de sesiones para Railway
const sessionConfig = {
    name: 'escologia.sid',
    secret: process.env.SESSION_SECRET || 'tu-secreto-aqui-cambia-esto-en-produccion',
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ CRÍTICO para Railway
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // ✅ true en Railway
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ 'none' para Railway
        domain: process.env.COOKIE_DOMAIN || undefined
    }
};

// Configurar MongoStore
if (process.env.MONGODB_URI) {
    sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
        autoRemove: 'native'
    });
    console.log('✅ Sesiones configuradas con MongoDB Atlas');
} else {
    console.warn('⚠️ MONGODB_URI no encontrada. Usando store en memoria');
}

app.use(session(sessionConfig));

// Middleware para parsear JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Middleware de logging para debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Servir favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'), (err) => {
        if (err) {
            res.status(404).send('Favicon not found');
        }
    });
});

// ✅ Health check para Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Conexión a MongoDB
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI no está definida');
        }
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Conectado a MongoDB Atlas');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        // En Railway, intentar reconectar en lugar de terminar
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Reintentando conexión en 5 segundos...');
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }
    }
};

// Manejar desconexiones de MongoDB
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB desconectado. Intentando reconectar...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de MongoDB:', err);
});

// Conectar a la base de datos
connectDB();

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reportes', reportesRoutes);

// Middleware para verificar sesión
const verificarSesion = (req, res, next) => {
    if (req.session && req.session.usuarioId) {
        next();
    } else {
        res.redirect('/');
    }
};

// === RUTAS DE PÁGINAS ===

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Home
app.get('/home', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});
app.get('/home.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});

// Foro
app.get('/foro', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'foro.html'));
});
app.get('/foro.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'foro.html'));
});

// Foros y Chat
app.get('/foros-chat', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'foro.html'));
});
app.get('/foros-chat.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'foro.html'));
});

// Registro
app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});
app.get('/registro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registro.html'));
});

// Perfil de escuela
app.get('/perfil-escuela', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perfil-escuela.html'));
});
app.get('/perfil-escuela.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'perfil-escuela.html'));
});

// Mapa colaborativo
app.get('/mapa-colaborativo', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mapa-colaborativo.html'));
});
app.get('/mapa-colaborativo.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mapa-colaborativo.html'));
});

// Publicación de proyectos
app.get('/publicacion-proyectos', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'publicacion-proyectos.html'));
});
app.get('/publicacion-proyectos.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'publicacion-proyectos.html'));
});

// Panel administrativo
app.get('/panel-administrativo', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel-administrativo.html'));
});
app.get('/panel-administrativo.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel-administrativo.html'));
});

// Reportes
app.get('/reportes', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});
app.get('/reportes.html', verificarSesion, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

// Ruta 404
app.get('*', (req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Página no encontrada</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                h1 { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1>404 - Página no encontrada</h1>
            <p>La página que buscas no existe.</p>
            <a href="/">Volver al inicio</a>
        </body>
        </html>
    `);
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Archivos estáticos: ${path.join(__dirname, 'public')}`);
    console.log(`🔒 Sesiones con MongoDB Atlas`);
});

// Manejo de cierre graceful
const gracefulShutdown = async (signal) => {
    console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor...`);
    
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('✅ Conexión a MongoDB cerrada');
    }
    
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
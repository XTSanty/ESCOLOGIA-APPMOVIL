// server.js - Servidor principal de la aplicación con sesiones
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config(); // Carga las variables de entorno

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

// Middlewares globales
app.use(cors({
  origin: true,
  credentials: true
}));

// Configuración de sesiones
const sessionConfig = {
  name: 'escologia.sid',
  secret: process.env.SESSION_SECRET || 'tu-secreto-aqui-cambia-esto',
  resave: false,
  saveUninitialized: false,
 cookie: {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
}

};

// Solo usar MongoStore si hay una URL de MongoDB
if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60 // 7 días
  });
} else {
  console.warn('⚠️ MONGODB_URI no encontrada. Usando store en memoria (no recomendado para producción)');
}

app.use(session(sessionConfig));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Servir favicon.ico desde la carpeta public
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Conexión a MongoDB con manejo de errores
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado exitosamente a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB Atlas:', error.message);
    process.exit(1); // Termina la aplicación si no puede conectar
  }
};

// Conectar a la base de datos ANTES de iniciar el servidor
connectDB();

// Rutas de la API
app.use('/api/perfil', perfilRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/posts', postRoutes); // Rutas de posts
app.use('/api/proyectos', proyectoRoutes); // Rutas de proyectos

// Middleware para verificar sesión (solo para páginas protegidas)
const verificarSesion = (req, res, next) => {
  if (req.session && req.session.usuarioId) {
    next();
  } else {
    res.redirect('/');
  }
};

// === RUTAS ESPECÍFICAS (ORDEN IMPORTANTE) ===

// Página principal (sin sesión)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para home
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

// Foros y Chat (mismo archivo que foro)
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

// Juegos
app.get('/juegos', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'juegos.html'));
});
app.get('/juegos.html', verificarSesion, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'juegos.html'));
});

// === RUTA GENÉRICA AL FINAL ===

// Ruta para páginas no encontradas (AHORA VA AL FINAL)
app.get('*', verificarSesion, (req, res) => {
  res.status(404).send(`
    <h1>Página no encontrada</h1>
    <p>La página que buscas no existe.</p>
    <a href="/home">Volver al Home</a>
  `);
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📁 Archivos estáticos servidos desde: ${path.join(__dirname, 'public')}`);
  console.log(`🔒 Sesiones activadas con persistencia en MongoDB Atlas`);
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('✅ Conexión a MongoDB Atlas cerrada.');
  }
  process.exit(0);
});
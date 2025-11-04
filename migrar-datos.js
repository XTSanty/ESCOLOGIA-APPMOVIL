// migrar-datos.js
require('dotenv').config();
const mongoose = require('mongoose');

// Conectar a Atlas
async function migrarDatos() {
  try {
    console.log('🔧 Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB Atlas');

    // Datos a migrar
    const usersData = [
      {
        "nombre": "Emerich Santiago",
        "correo": "santy34@gmail.edu.mx",
        "contraseña": "$2a$12$tmEFbosnDsqXUlKjtT2c8uM..yp7ijxeCf9TkQ25EYebDDiH97Aym",
        "tipoUsuario": "admin",
        "institucion": "Universidad Tecnologica Santa Catarina",
        "activo": true,
        "fechaCreacion": new Date("2025-10-24T11:50:09.331Z"),
        "fechaActualizacion": new Date("2025-10-24T11:50:09.619Z"),
        "__v": 0
      }
    ];

    const historialsData = [
      {
        "usuario": "santy34@gmail.edu.mx",
        "accion": "Ver usuarios",
        "descripcion": "Administrador visualizó la lista de usuarios",
        "ip": "::1",
        "fecha": new Date("2025-10-31T07:05:23.972Z"),
        "__v": 0
      },
      {
        "usuario": "santy34@gmail.edu.mx",
        "accion": "Ver usuarios",
        "descripcion": "Administrador visualizó la lista de usuarios",
        "ip": "::1",
        "fecha": new Date("2025-10-31T07:05:30.237Z"),
        "__v": 0
      }
    ];

    const sessionsData = [
      {
        "expires": new Date("2025-11-06T20:04:18.785Z"),
        "lastModified": new Date("2025-10-30T20:04:18.786Z"),
        "session": "{\"cookie\":{\"originalMaxAge\":604799999,\"expires\":\"2025-11-06T20:04:18.785Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"usuarioId\":\"68fb67f1fd8616f7a85f26f2\",\"correo\":\"santy34@gmail.edu.mx\",\"tipoUsuario\":\"escuela\",\"nombre\":\"Emerich Santiago\"}"
      },
      {
        "expires": new Date("2025-11-11T20:51:30.819Z"),
        "session": "{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2025-11-07T06:46:23.002Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"usuarioId\":\"68fb67f1fd8616f7a85f26f2\",\"correo\":\"santy34@gmail.edu.mx\",\"nombre\":\"Emerich Santiago\",\"tipoUsuario\":\"admin\",\"institucion\":\"Universidad Tecnologica Santa Catarina\"}"
      }
    ];

    // Migrar usuarios
    console.log('🗂️  Limpiando y migrando usuarios...');
    await mongoose.connection.collection('users').deleteMany({});
    await mongoose.connection.collection('users').insertMany(usersData);
    console.log(`✅ Migrados ${usersData.length} usuarios`);

    // Migrar historiales
    console.log('🗂️  Limpiando y migrando historiales...');
    await mongoose.connection.collection('historials').deleteMany({});
    await mongoose.connection.collection('historials').insertMany(historialsData);
    console.log(`✅ Migrados ${historialsData.length} historiales`);

    // Migrar sesiones
    console.log('🗂️  Limpiando y migrando sesiones...');
    await mongoose.connection.collection('sessions').deleteMany({});
    await mongoose.connection.collection('sessions').insertMany(sessionsData);
    console.log(`✅ Migradas ${sessionsData.length} sesiones`);

    console.log('🎉 Migración completada exitosamente');
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔒 Conexión a MongoDB cerrada');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error('🔍 Detalles del error:', error);
    process.exit(1);
  }
}

migrarDatos();
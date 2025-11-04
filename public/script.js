// public/script.js - JavaScript para funcionalidad del login
// ✅ Agregar temporalmente al inicio de script.js (después de DOMContentLoaded)

// Desregistrar Service Workers viejos
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister().then(() => {
                console.log('🗑️ Service Worker viejo desregistrado');
            });
        }
    });
}

// Limpiar cachés viejas
if ('caches' in window) {
    caches.keys().then(keys => {
        keys.forEach(key => {
            caches.delete(key);
            console.log('🗑️ Caché eliminada:', key);
        });
    });
}
// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('contraseña');
    const statusMessage = document.getElementById('statusMessage');
    const loginButton = document.getElementById('loginButton');
    
    // Modal de registro
    const registerModal = document.getElementById('registerModal');
    const registerLink = document.getElementById('registerLink');
    const closeModal = document.getElementById('closeModal');
    const registerForm = document.getElementById('registerForm');

    // Funcionalidad para mostrar/ocultar contraseña
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Cambiar el ícono
        const icon = this.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });

    // Manejar envío del formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // ✅ CRÍTICO: Prevenir envío por defecto
        e.stopPropagation(); // ✅ NUEVO: Detener propagación del evento
        
        console.log('🔒 Iniciando proceso de login...');
        
        // Limpiar mensajes de error previos
        limpiarErrores();
        
        // Obtener datos del formulario
        const formData = new FormData(loginForm);
        const datos = {
            correo: formData.get('correo'),
            contraseña: formData.get('contraseña')
        };
        
        console.log('📧 Datos a enviar:', { correo: datos.correo });
        
        // Validar datos antes de enviar
        if (!validarLogin(datos)) {
            console.log('❌ Validación fallida');
            return false; // ✅ NUEVO: Retornar false
        }
        
        // Mostrar estado de carga
        mostrarCargando(true);
        
        try {
            console.log('📡 Enviando petición a /api/auth/login...');
            
            // ✅ CRÍTICO: Usar URL absoluta en producción
            const baseUrl = window.location.origin;
            const loginUrl = `${baseUrl}/api/auth/login`;
            
            console.log('🌐 URL completa:', loginUrl);
            
            // Realizar petición al servidor
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include', // ✅ CRÍTICO: Para cookies de sesión
                body: JSON.stringify(datos),
                cache: 'no-cache' // ✅ NUEVO: Evitar cache
            });
            
            console.log('✅ Respuesta recibida:', response.status);
            
            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Respuesta no es JSON. El servidor puede estar enviando HTML.');
            }
            
            const resultado = await response.json();
            console.log('📊 Resultado del backend:', resultado);
            
            if (resultado.success) {
                console.log('✅ Login exitoso, guardando usuario...');
                
                // Login exitoso
                // Guardar información del usuario
                localStorage.setItem('currentUser', JSON.stringify(resultado.usuario));
                
                console.log('🎯 Redirigiendo a /home...');
                
                // ✅ REDIRECCIÓN INMEDIATA sin SweetAlert
                window.location.replace('/home'); // ✅ CAMBIADO: replace en vez de href
                
            } else {
                console.log('❌ Login fallido:', resultado.message);
                
                // Error en el login
                Swal.fire({
                    title: 'Error de inicio de sesión',
                    text: resultado.message || 'Credenciales incorrectas',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
            
        } catch (error) {
            console.error('💥 Error en login:', error);
            Swal.fire({
                title: 'Error de conexión',
                text: `No se pudo conectar con el servidor. ${error.message}`,
                icon: 'error',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            mostrarCargando(false);
        }
        
        return false; // ✅ NUEVO: Prevenir cualquier acción adicional
    });

    // Funciones de validación
    function validarLogin(datos) {
        let esValido = true;
        
        // Validar correo electrónico
        if (!datos.correo) {
            mostrarError('correoError', 'El correo es obligatorio');
            esValido = false;
        } else if (!validarEmail(datos.correo)) {
            mostrarError('correoError', 'Ingresa un correo válido');
            esValido = false;
        }
        
        // Validar contraseña
        if (!datos.contraseña) {
            mostrarError('contraseñaError', 'La contraseña es obligatoria');
            esValido = false;
        } else if (datos.contraseña.length < 6) {
            mostrarError('contraseñaError', 'La contraseña debe tener al menos 6 caracteres');
            esValido = false;
        }
        
        return esValido;
    }
    
    // Función para validar formato de email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Validación estricta para correos educativos (OPCIONAL)
    function validarEmailFormatoEstricto(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    // Validar contraseña segura (OPCIONAL en login, obligatorio en registro)
    function validarContraseñaSegura(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
        return regex.test(password);
    }
    
    // Función para mostrar errores específicos
    function mostrarError(elementoId, mensaje) {
        const errorElement = document.getElementById(elementoId);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.style.display = 'block';
        }
    }
    
    // Función para limpiar errores
    function limpiarErrores() {
        const errores = document.querySelectorAll('.error-message');
        errores.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        statusMessage.className = 'status-message hidden';
    }
    
    // Función para mostrar mensajes de estado
    function mostrarMensaje(tipo, mensaje) {
        statusMessage.textContent = mensaje;
        statusMessage.className = `status-message ${tipo}`;
    }
    
    // Función para mostrar estado de carga
    function mostrarCargando(cargando) {
        if (cargando) {
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        } else {
            loginButton.disabled = false;
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    }

    // === FUNCIONALIDAD DEL MODAL DE REGISTRO ===
    
    // Abrir modal de registro
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        registerModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    // Cerrar modal
    closeModal.addEventListener('click', function() {
        cerrarModal();
    });
    
    // Cerrar modal al hacer clic fuera
    registerModal.addEventListener('click', function(e) {
        if (e.target === registerModal) {
            cerrarModal();
        }
    });
    
    function cerrarModal() {
        registerModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        registerForm.reset();
        limpiarErrores();
    }
    
    // Manejar envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const formData = new FormData(registerForm);
        const datos = {
            nombre: formData.get('nombre'),
            correo: formData.get('correo'),
            contraseña: formData.get('contraseña'),
            institucion: formData.get('institucion'),
            tipoUsuario: 'escuela'
        };
        
        const submitButton = registerForm.querySelector('button[type="submit"]');
        
        // Validar datos de registro
        if (!validarRegistro(datos)) {
            return false;
        }
        
        // Mostrar carga
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';
        
        try {
            const baseUrl = window.location.origin;
            const registerUrl = `${baseUrl}/api/auth/register`;
            
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(datos),
                cache: 'no-cache'
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                Swal.fire({
                    title: '¡Registro exitoso!',
                    text: 'Ya puedes iniciar sesión con tus credenciales',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    cerrarModal();
                    document.getElementById('correo').value = datos.correo;
                });
                
            } else {
                Swal.fire({
                    title: 'Error en el registro',
                    text: resultado.message || 'Error en el registro',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
            
        } catch (error) {
            console.error('Error en registro:', error);
            Swal.fire({
                title: 'Error de conexión',
                text: 'Error de conexión. Intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Registrarse';
        }
        
        return false;
    });

    // Validación para registro
    function validarRegistro(datos) {
        let esValido = true;
        
        if (!datos.nombre || datos.nombre.length < 3) {
            mostrarError('regNombreError', 'Nombre debe tener al menos 3 caracteres');
            esValido = false;
        }
        
        if (!datos.correo || !validarEmail(datos.correo)) {
            mostrarError('regCorreoError', 'Formato de correo inválido');
            esValido = false;
        }
        
        if (!datos.contraseña || datos.contraseña.length < 6) {
            mostrarError('regContraseñaError', 'Mínimo 6 caracteres');
            esValido = false;
        }
        
        if (!datos.institucion || datos.institucion.length < 5) {
            mostrarError('regInstitucionError', 'Mínimo 5 caracteres');
            esValido = false;
        }
        
        return esValido;
    }

    // ✅ NUEVO: Registro del Service Worker SOLO si existe
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            // Verificar si existe el archivo sw.js antes de registrarlo
            fetch('/sw.js', { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        navigator.serviceWorker.register('/sw.js')
                            .then(reg => console.log('✅ SW registrado:', reg.scope))
                            .catch(err => console.warn('⚠️ Error al registrar SW:', err));
                    } else {
                        console.log('ℹ️ No hay Service Worker disponible');
                    }
                })
                .catch(() => console.log('ℹ️ No hay Service Worker disponible'));
        });
    }

    console.log('🚀 Sistema de login inicializado correctamente');
});
// public/script.js - JavaScript para funcionalidad del login

// ✅ CRÍTICO: Esperar a que TODO esté cargado (incluyendo SweetAlert2)
window.addEventListener('load', function() {
    console.log('🚀 Iniciando sistema de login...');
    
    // Verificar que SweetAlert2 esté disponible
    if (typeof Swal === 'undefined') {
        console.error('❌ SweetAlert2 no está cargado');
        alert('Error: No se pudo cargar el sistema de alertas');
        return;
    }
    
    // Obtener referencias a elementos del DOM
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('contraseña');
    const statusMessage = document.getElementById('statusMessage');
    
    // Modal de registro
    const registerModal = document.getElementById('registerModal');
    const registerLink = document.getElementById('registerLink');
    const closeModal = document.getElementById('closeModal');
    const registerForm = document.getElementById('registerForm');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    // Verificar que todos los elementos existan
    if (!loginForm || !loginButton) {
        console.error('❌ Elementos del formulario no encontrados');
        return;
    }

    console.log('✅ Elementos del DOM encontrados');

    // Funcionalidad para mostrar/ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                if (type === 'password') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            }
        });
    }

    // ✅ CRÍTICO: Manejar CLICK del botón (no submit del form)
    loginButton.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔒 Click en botón de login detectado');
        
        await handleLogin();
    });

    // ✅ También manejar Enter en los inputs
    const correoInput = document.getElementById('correo');
    const contraseñaInput = document.getElementById('contraseña');
    
    if (correoInput) {
        correoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    }
    
    if (contraseñaInput) {
        contraseñaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    }

    // ✅ Función principal de login
    async function handleLogin() {
        console.log('🔐 Iniciando proceso de login...');
        
        // Limpiar mensajes previos
        limpiarErrores();
        
        // Obtener datos del formulario
        const correo = document.getElementById('correo').value.trim();
        const contraseña = document.getElementById('contraseña').value;
        
        const datos = { correo, contraseña };
        
        console.log('📧 Email ingresado:', correo);
        
        // Validar datos
        if (!validarLogin(datos)) {
            console.log('❌ Validación fallida');
            return;
        }
        
        // Mostrar estado de carga
        mostrarCargando(true);
        
        try {
            console.log('📡 Enviando petición de login...');
            
            const baseUrl = window.location.origin;
            const loginUrl = `${baseUrl}/api/auth/login`;
            
            console.log('🌐 URL:', loginUrl);
            
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(datos)
            });
            
            console.log('📨 Status de respuesta:', response.status);
            
            // Verificar tipo de contenido
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no respondió con JSON');
            }
            
            const resultado = await response.json();
            console.log('📊 Resultado:', resultado);
            
            if (resultado.success) {
                console.log('✅ Login exitoso');
                
                // Guardar usuario en localStorage
                localStorage.setItem('currentUser', JSON.stringify(resultado.usuario));
                
                // ✅ Mostrar SweetAlert de éxito
                await Swal.fire({
                    title: '¡Bienvenido!',
                    text: `Hola ${resultado.usuario.nombre}`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                console.log('🎯 Redirigiendo a home...');
                
                // Pequeño delay para asegurar que la alerta se vea
                setTimeout(() => {
                    window.location.href = '/home';
                }, 100);
                
            } else {
                console.log('❌ Login fallido:', resultado.message);
                
                mostrarCargando(false);
                
                Swal.fire({
                    title: 'Error de inicio de sesión',
                    text: resultado.message || 'Credenciales incorrectas',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
            
        } catch (error) {
            console.error('💥 Error en login:', error);
            
            mostrarCargando(false);
            
            Swal.fire({
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Verifica tu conexión.',
                icon: 'error',
                confirmButtonText: 'Reintentar'
            });
        }
    }

    // Funciones de validación
    function validarLogin(datos) {
        let esValido = true;
        
        if (!datos.correo) {
            mostrarError('correoError', 'El correo es obligatorio');
            esValido = false;
        } else if (!validarEmail(datos.correo)) {
            mostrarError('correoError', 'Ingresa un correo válido');
            esValido = false;
        }
        
        if (!datos.contraseña) {
            mostrarError('contraseñaError', 'La contraseña es obligatoria');
            esValido = false;
        } else if (datos.contraseña.length < 6) {
            mostrarError('contraseñaError', 'Mínimo 6 caracteres');
            esValido = false;
        }
        
        return esValido;
    }
    
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    function mostrarError(elementoId, mensaje) {
        const errorElement = document.getElementById(elementoId);
        if (errorElement) {
            errorElement.textContent = mensaje;
            errorElement.style.display = 'block';
        }
    }
    
    function limpiarErrores() {
        const errores = document.querySelectorAll('.error-message');
        errores.forEach(error => {
            error.textContent = '';
            error.style.display = 'none';
        });
        if (statusMessage) {
            statusMessage.className = 'status-message hidden';
        }
    }
    
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
    
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            registerModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            cerrarModal();
        });
    }
    
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                cerrarModal();
            }
        });
    }
    
    function cerrarModal() {
        if (registerModal) {
            registerModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            registerForm.reset();
            limpiarErrores();
        }
    }
    
    // ✅ Manejar CLICK del botón de registro
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            await handleRegister();
        });
    }

    async function handleRegister() {
        const datos = {
            nombre: document.getElementById('regNombre').value.trim(),
            correo: document.getElementById('regCorreo').value.trim(),
            contraseña: document.getElementById('regContraseña').value,
            institucion: document.getElementById('regInstitucion').value.trim(),
            tipoUsuario: 'escuela'
        };
        
        if (!validarRegistro(datos)) {
            return;
        }
        
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = 'Registrando...';
        
        try {
            const baseUrl = window.location.origin;
            const registerUrl = `${baseUrl}/api/auth/register`;
            
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(datos)
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                await Swal.fire({
                    title: '¡Registro exitoso!',
                    text: 'Ya puedes iniciar sesión',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                });
                
                cerrarModal();
                document.getElementById('correo').value = datos.correo;
                
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
            registerSubmitBtn.disabled = false;
            registerSubmitBtn.textContent = 'Registrarse';
        }
    }

    function validarRegistro(datos) {
        let esValido = true;
        
        if (!datos.nombre || datos.nombre.length < 3) {
            mostrarError('regNombreError', 'Mínimo 3 caracteres');
            esValido = false;
        }
        
        if (!datos.correo || !validarEmail(datos.correo)) {
            mostrarError('regCorreoError', 'Email inválido');
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

    // ✅ Registro condicional del Service Worker
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(reg => reg.unregister());
            console.log('🗑️ Service Workers anteriores eliminados');
        });
        
        setTimeout(() => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ SW registrado:', reg.scope))
                .catch(err => console.warn('⚠️ SW no disponible:', err));
        }, 2000);
    }

    console.log('✅ Sistema de login completamente inicializado');
});
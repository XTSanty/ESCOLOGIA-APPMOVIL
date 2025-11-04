// public/script.js - JavaScript para funcionalidad del login

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
        e.preventDefault(); // Prevenir envío por defecto
        
        // Limpiar mensajes de error previos
        limpiarErrores();
        
        // Obtener datos del formulario
        const formData = new FormData(loginForm);
        const datos = {
            correo: formData.get('correo'),
            contraseña: formData.get('contraseña')
        };
        
        // Validar datos antes de enviar
        if (!validarLogin(datos)) {
            return;
        }
        
        // Mostrar estado de carga
        mostrarCargando(true);
        
        try {
            // Realizar petición al servidor
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                // Login exitoso
                // Guardar información del usuario
                localStorage.setItem('currentUser', JSON.stringify(resultado.usuario));
                
                // Mostrar SweetAlert de éxito y redirigir
                Swal.fire({
                    title: '¡Inicio de sesión exitoso!',
                    text: `Bienvenido ${resultado.usuario.nombre}`,
                    icon: 'success',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = '/home';  // Redirección corregida
                });
                
            } else {
                // Error en el login
                Swal.fire({
                    title: 'Error de inicio de sesión',
                    text: resultado.message || 'Credenciales incorrectas',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            Swal.fire({
                title: 'Error de conexión',
                text: 'Error de conexión. Por favor intenta nuevamente.',
                icon: 'error',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            mostrarCargando(false);
        }
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
        } else if (!validarEmailFormatoEstricto(datos.correo)) {
            mostrarError('correoError', 'Formato de correo no permitido');
            esValido = false;
        }
        
        // Validar contraseña
        if (!datos.contraseña) {
            mostrarError('contraseñaError', 'La contraseña es obligatoria');
            esValido = false;
        } else if (datos.contraseña.length < 6) {
            mostrarError('contraseñaError', 'La contraseña debe tener al menos 6 caracteres');
            esValido = false;
        } else if (!validarContraseñaSegura(datos.contraseña)) {
            mostrarError('contraseñaError', 'La contraseña debe contener mayúsculas, minúsculas y números');
            esValido = false;
        }
        
        return esValido;
    }
    
    // Función para validar formato de email estricto
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    // Validación estricta para correos educativos
    function validarEmailFormatoEstricto(email) {
        // Verificar que sea un correo de escuela (dominio .edu.mx o similar)
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }
    
    // Validar contraseña segura
    function validarContraseñaSegura(password) {
        // Debe contener al menos una mayúscula, una minúscula y un número
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
        return regex.test(password);
    }
    
    // Función para mostrar errores específicos
    function mostrarError(elementoId, mensaje) {
        const errorElement = document.getElementById(elementoId);
        if (errorElement) {
            errorElement.textContent = mensaje;
        }
    }
    
    // Función para limpiar errores
    function limpiarErrores() {
        const errores = document.querySelectorAll('.error-message');
        errores.forEach(error => error.textContent = '');
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
        document.body.style.overflow = 'hidden'; // Prevenir scroll
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
        document.getElementById('registerStatusMessage').className = 'status-message hidden';
    }
    
    // Manejar envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const datos = {
            nombre: formData.get('nombre'),
            correo: formData.get('correo'),
            contraseña: formData.get('contraseña'),
            institucion: formData.get('institucion'),
            tipoUsuario: 'escuela'
        };
        
        const registerStatusMessage = document.getElementById('registerStatusMessage');
        const submitButton = registerForm.querySelector('button[type="submit"]');
        
        // Validar datos de registro
        if (!validarRegistro(datos)) {
            return;
        }
        
        // Mostrar carga
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                // Mostrar SweetAlert de éxito
                Swal.fire({
                    title: '¡Registro exitoso!',
                    text: 'Ya puedes iniciar sesión con tus credenciales',
                    icon: 'success',
                    confirmButtonText: 'Aceptar'
                }).then(() => {
                    cerrarModal();
                    // Llenar el formulario de login con el correo registrado
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
    });

    // Validación estricta para registro
    function validarRegistro(datos) {
        let esValido = true;
        
        // Validar nombre
        if (!datos.nombre || datos.nombre.length < 3) {
            mostrarError('regNombreError', 'Nombre debe tener al menos 3 caracteres');
            esValido = false;
        } else if (!validarNombre(datos.nombre)) {
            mostrarError('regNombreError', 'Nombre contiene caracteres no permitidos');
            esValido = false;
        }
        
        // Validar correo
        if (!datos.correo) {
            mostrarError('regCorreoError', 'Correo es obligatorio');
            esValido = false;
        } else if (!validarEmail(datos.correo)) {
            mostrarError('regCorreoError', 'Formato de correo inválido');
            esValido = false;
        } else if (!validarEmailEducacional(datos.correo)) {
            mostrarError('regCorreoError', 'Solo se permiten correos educativos');
            esValido = false;
        }
        
        // Validar contraseña
        if (!datos.contraseña) {
            mostrarError('regContraseñaError', 'Contraseña es obligatoria');
            esValido = false;
        } else if (datos.contraseña.length < 6) {
            mostrarError('regContraseñaError', 'Mínimo 6 caracteres');
            esValido = false;
        } else if (!validarContraseñaSegura(datos.contraseña)) {
            mostrarError('regContraseñaError', 'Contraseña debe tener mayúsculas, minúsculas y números');
            esValido = false;
        }
        
        // Validar institución
        if (!datos.institucion || datos.institucion.length < 5) {
            mostrarError('regInstitucionError', 'Nombre de institución debe tener al menos 5 caracteres');
            esValido = false;
        } else if (!validarNombreInstitucion(datos.institucion)) {
            mostrarError('regInstitucionError', 'Nombre de institución contiene caracteres no permitidos');
            esValido = false;
        }
        
        return esValido;
    }
    
    // Validar nombre (solo letras y espacios)
    function validarNombre(nombre) {
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,50}$/;
        return regex.test(nombre);
    }
    
    // Validar correo educacional
    function validarEmailEducacional(email) {
        const regex = /^[^\s@]+@(?:[a-zA-Z0-9-]+\.)+(?:edu|edu\.mx|edu\.com|gob\.mx)[^\s@]*$/i;
        return regex.test(email);
    }
    
    // Validar nombre de institución
    function validarNombreInstitucion(nombre) {
        const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.,]{5,100}$/;
        return regex.test(nombre);
    }

    // Validación en tiempo real para los campos de entrada
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validarCampoIndividual(this);
        });
        
        // Limpiar error cuando el usuario empieza a escribir
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(this.id + 'Error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        });
    });
    
    // Función para validar campos individuales
    function validarCampoIndividual(campo) {
        const valor = campo.value.trim();
        const errorElement = document.getElementById(campo.id + 'Error');
        
        if (!errorElement) return;
        
        let mensaje = '';
        
        switch (campo.name || campo.id) {
            case 'correo':
            case 'regCorreo':
                if (valor && !validarEmail(valor)) {
                    mensaje = 'Formato de email inválido';
                } else if (campo.name === 'correo' && valor && !validarEmailEducacional(valor)) {
                    mensaje = 'Solo se permiten correos educativos';
                }
                break;
            case 'contraseña':
            case 'regContraseña':
                if (valor && valor.length < 6) {
                    mensaje = 'Mínimo 6 caracteres';
                } else if (valor && !validarContraseñaSegura(valor)) {
                    mensaje = 'Debe tener mayúsculas, minúsculas y números';
                }
                break;
            case 'nombre':
            case 'regNombre':
                if (valor && valor.length < 3) {
                    mensaje = 'Mínimo 3 caracteres';
                } else if (valor && !validarNombre(valor)) {
                    mensaje = 'Solo letras y espacios';
                }
                break;
            case 'regInstitucion':
                if (valor && valor.length < 5) {
                    mensaje = 'Mínimo 5 caracteres';
                } else if (valor && !validarNombreInstitucion(valor)) {
                    mensaje = 'Caracteres no permitidos';
                }
                break;
        }
        
        errorElement.textContent = mensaje;
    }
    
    console.log('🚀 Sistema de login inicializado correctamente');
});
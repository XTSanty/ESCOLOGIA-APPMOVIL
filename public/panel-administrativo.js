let usuarios = [];
let proyectos = [];
let posts = [];
let sensores = [];
let historial = [];
let currentUser = null;
let isAdmin = false;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    checkAdminAccess();
    if (isAdmin) {
        loadData();
        setupEventListeners();
    } else {
        showAccessDenied();
    }
});

// Cargar información del usuario
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {
        nombre: 'Usuario Demo',
        correo: 'demo@escuela.edu.mx',
        tipoUsuario: 'escuela'
    };
    currentUser = {
        name: userData.nombre || 'Usuario Demo',
        email: userData.correo || 'demo@escuela.edu.mx',
        tipoUsuario: userData.tipoUsuario || 'escuela'
    };
    document.getElementById('adminUser').textContent = currentUser.email;
}

// Verificar acceso de administrador
function checkAdminAccess() {
    isAdmin = currentUser.email === 'admin@escuela.edu.mx' || 
              currentUser.email === 'sergio.admin@escuela.edu.mx' ||
              currentUser.tipoUsuario === 'admin';
    
    if (!isAdmin) {
        console.log('Acceso denegado: Usuario no es administrador');
    }
}

// Mostrar acceso denegado
function showAccessDenied() {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h2 style="color: #e74c3c; margin-bottom: 20px;"><i class="fas fa-lock"></i> Acceso Denegado</h2>
                <p style="color: #666; margin-bottom: 20px;">No tienes permisos de administrador para acceder a esta sección</p>
                <button onclick="goBack()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer;">Volver al Home</button>
            </div>
        </div>
    `;
}

// Event listeners
function setupEventListeners() {
    document.getElementById('searchUsuarios').addEventListener('input', () => renderUsuarios());
    document.getElementById('searchProyectos').addEventListener('input', () => renderProyectos());
    document.getElementById('searchPosts').addEventListener('input', () => renderPosts());
}

// Cargar todos los datos
async function loadData() {
    try {
        // Cargar usuarios
        const usuariosResponse = await fetch('/api/admin/users');
        if (usuariosResponse.ok) {
            usuarios = await usuariosResponse.json();
        }

        // Cargar proyectos
        const proyectosResponse = await fetch('/api/proyectos');
        if (proyectosResponse.ok) {
            proyectos = await proyectosResponse.json();
        }

        // Cargar posts
        const postsResponse = await fetch('/api/posts');
        if (postsResponse.ok) {
            posts = await postsResponse.json();
        }

        updateStats();
        renderUsuarios();
        renderProyectos();
        renderPosts();
        renderHistorial();
        renderSensores();

    } catch (error) {
        console.error('Error al cargar datos:', error);
        showErrorMessage('Error al cargar datos del sistema');
    }
}

// Actualizar estadísticas
function updateStats() {
    document.getElementById('totalUsuarios').textContent = usuarios.length;
    document.getElementById('totalProyectos').textContent = proyectos.length;
    document.getElementById('totalPosts').textContent = posts.length;
    document.getElementById('totalActivo').textContent = usuarios.filter(u => u.estado === 'activo').length || usuarios.length;
}

// Renderizar usuarios
function renderUsuarios() {
    const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
    const filteredUsuarios = usuarios.filter(usuario => 
        usuario.nombre.toLowerCase().includes(searchTerm) ||
        usuario.correo.toLowerCase().includes(searchTerm) ||
        usuario.institucion.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('usuariosTable');
    tbody.innerHTML = filteredUsuarios.map(usuario => `
        <tr>
            <td>${usuario._id || 'N/A'}</td>
            <td>${usuario.nombre || 'N/A'}</td>
            <td>${usuario.correo || 'N/A'}</td>
            <td>${usuario.institucion || 'N/A'}</td>
            <td>${usuario.tipoUsuario || 'N/A'}</td>
            <td>${formatDate(usuario.fechaRegistro || usuario.fecha)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editarUsuario('${usuario._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="eliminarUsuario('${usuario._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar proyectos
function renderProyectos() {
    const searchTerm = document.getElementById('searchProyectos').value.toLowerCase();
    const filteredProyectos = proyectos.filter(proyecto => 
        proyecto.nombre.toLowerCase().includes(searchTerm) ||
        proyecto.descripcion.toLowerCase().includes(searchTerm) ||
        proyecto.usuario.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('proyectosTable');
    tbody.innerHTML = filteredProyectos.map(proyecto => `
        <tr>
            <td>${proyecto._id}</td>
            <td>${proyecto.nombre}</td>
            <td>${proyecto.descripcion.substring(0, 50)}...</td>
            <td>${proyecto.usuario}</td>
            <td><span class="${proyecto.estado === 'terminado' ? 'success' : 'pending'}">${proyecto.estado}</span></td>
            <td>${formatDate(proyecto.fecha)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editarProyecto('${proyecto._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="eliminarProyecto('${proyecto._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar posts
function renderPosts() {
    const searchTerm = document.getElementById('searchPosts').value.toLowerCase();
    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.user.toLowerCase().includes(searchTerm) ||
        post.category.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('postsTable');
    tbody.innerHTML = filteredPosts.map(post => `
        <tr>
            <td>${post._id}</td>
            <td>${post.title}</td>
            <td>${post.content.substring(0, 50)}...</td>
            <td>${post.user}</td>
            <td>${post.category}</td>
            <td>${formatDate(post.date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editarPost('${post._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="eliminarPost('${post._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Renderizar historial
function renderHistorial() {
    const tbody = document.getElementById('historialTable');
    tbody.innerHTML = historial.map(item => `
        <tr>
            <td>${item.usuario}</td>
            <td>${item.accion}</td>
            <td>${item.descripcion}</td>
            <td>${formatDate(item.fecha)}</td>
            <td>${item.ip}</td>
        </tr>
    `).join('');
}

// Renderizar sensores
function renderSensores() {
    const tbody = document.getElementById('sensoresTable');
    tbody.innerHTML = sensores.map(sensor => `
        <tr>
            <td>${sensor._id}</td>
            <td>${sensor.nombre}</td>
            <td>${sensor.ubicacion}</td>
            <td><span class="${sensor.estado === 'activo' ? 'success' : 'pending'}">${sensor.estado}</span></td>
            <td>${formatDate(sensor.ultimaLectura)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editarSensor('${sensor._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="eliminarSensor('${sensor._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ✅ FUNCIÓN ACTUALIZADA: Editar Usuario con campo de contraseña
function editarUsuario(id) {
    const usuario = usuarios.find(u => u._id === id);
    if (!usuario) {
        showErrorMessage('Usuario no encontrado');
        return;
    }

    Swal.fire({
        title: '<i class="fas fa-user-edit"></i> Editar Usuario',
        html: `
            <style>
                .swal-form-group {
                    margin-bottom: 15px;
                    text-align: left;
                }
                .swal-form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #333;
                }
                .swal-form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                .swal-form-group input:focus {
                    outline: none;
                    border-color: #3085d6;
                    box-shadow: 0 0 0 3px rgba(48, 133, 214, 0.1);
                }
                .password-info {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                    font-size: 13px;
                    color: #856404;
                }
            </style>
            <div class="swal-form-group">
                <label><i class="fas fa-user"></i> Nombre:</label>
                <input type="text" id="editNombre" value="${usuario.nombre}" placeholder="Nombre completo">
            </div>
            <div class="swal-form-group">
                <label><i class="fas fa-envelope"></i> Correo:</label>
                <input type="email" id="editCorreo" value="${usuario.correo}" placeholder="correo@ejemplo.com">
            </div>
            <div class="swal-form-group">
                <label><i class="fas fa-school"></i> Institución:</label>
                <input type="text" id="editInstitucion" value="${usuario.institucion}" placeholder="Nombre de la institución">
            </div>
            <div class="password-info">
                <i class="fas fa-info-circle"></i> <strong>Cambiar contraseña:</strong> Deja el campo vacío para mantener la contraseña actual
            </div>
            <div class="swal-form-group">
                <label><i class="fas fa-key"></i> Nueva Contraseña:</label>
                <input type="password" id="editPassword" placeholder="Nueva contraseña (opcional)" autocomplete="new-password">
            </div>
            <div class="swal-form-group">
                <label><i class="fas fa-key"></i> Confirmar Contraseña:</label>
                <input type="password" id="editPasswordConfirm" placeholder="Confirmar nueva contraseña" autocomplete="new-password">
            </div>
        `,
        width: 600,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Guardar Cambios',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        preConfirm: () => {
            const nombre = document.getElementById('editNombre').value.trim();
            const correo = document.getElementById('editCorreo').value.trim();
            const institucion = document.getElementById('editInstitucion').value.trim();
            const password = document.getElementById('editPassword').value;
            const passwordConfirm = document.getElementById('editPasswordConfirm').value;

            // Validaciones
            if (!nombre || !correo || !institucion) {
                Swal.showValidationMessage('Por favor completa todos los campos obligatorios');
                return false;
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                Swal.showValidationMessage('Por favor ingresa un correo válido');
                return false;
            }

            // Validar contraseña solo si se ingresó
            if (password || passwordConfirm) {
                if (password !== passwordConfirm) {
                    Swal.showValidationMessage('Las contraseñas no coinciden');
                    return false;
                }
                if (password.length < 6) {
                    Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
                    return false;
                }
            }

            return {
                nombre,
                correo,
                institucion,
                password: password || null // null si no se cambió
            };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            await actualizarUsuario(id, result.value);
        }
    });
}

// ✅ NUEVA FUNCIÓN: Actualizar usuario en la base de datos
async function actualizarUsuario(id, datos) {
    try {
        Swal.fire({
            title: 'Actualizando...',
            html: 'Por favor espera mientras se actualizan los datos',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        const result = await response.json();

        if (response.ok) {
            // Actualizar el array local de usuarios
            const index = usuarios.findIndex(u => u._id === id);
            if (index !== -1) {
                usuarios[index] = { ...usuarios[index], ...datos };
                // No actualizar la contraseña en el frontend
                delete usuarios[index].password;
            }
            
            renderUsuarios();
            
            Swal.fire({
                title: '¡Éxito!',
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p><strong>Usuario actualizado correctamente:</strong></p>
                        <ul style="margin-top: 10px;">
                            <li>✅ Nombre: ${datos.nombre}</li>
                            <li>✅ Correo: ${datos.correo}</li>
                            <li>✅ Institución: ${datos.institucion}</li>
                            ${datos.password ? '<li>✅ Contraseña actualizada</li>' : ''}
                        </ul>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } else {
            throw new Error(result.message || 'Error al actualizar usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo actualizar el usuario',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

function eliminarUsuario(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/admin/users/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    usuarios = usuarios.filter(u => u._id !== id);
                    renderUsuarios();
                    updateStats();
                    Swal.fire('¡Eliminado!', 'Usuario eliminado exitosamente', 'success');
                } else {
                    throw new Error('Error al eliminar usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                showErrorMessage('Error al eliminar usuario');
            }
        }
    });
}

function editarProyecto(id) {
    const proyecto = proyectos.find(p => p._id === id);
    
    Swal.fire({
        title: 'Editar Proyecto',
        html: `
            <div class="form-group">
                <label>Nombre:</label>
                <input type="text" id="editNombre" value="${proyecto?.nombre || ''}" class="swal2-input">
            </div>
            <div class="form-group">
                <label>Descripción:</label>
                <textarea id="editDescripcion" class="swal2-textarea">${proyecto?.descripcion || ''}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });
}

function eliminarProyecto(id) {
    Swal.fire({
        title: '¿Eliminar proyecto?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/proyectos/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    proyectos = proyectos.filter(p => p._id !== id);
                    renderProyectos();
                    updateStats();
                    Swal.fire('Eliminado', 'Proyecto eliminado exitosamente', 'success');
                }
            } catch (error) {
                showErrorMessage('Error al eliminar proyecto');
            }
        }
    });
}

function editarPost(id) {
    const post = posts.find(p => p._id === id);
    
    Swal.fire({
        title: 'Editar Publicación',
        html: `
            <div class="form-group">
                <label>Título:</label>
                <input type="text" id="editTitulo" value="${post?.title || ''}" class="swal2-input">
            </div>
            <div class="form-group">
                <label>Contenido:</label>
                <textarea id="editContenido" class="swal2-textarea">${post?.content || ''}</textarea>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });
}

function eliminarPost(id) {
    Swal.fire({
        title: '¿Eliminar publicación?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/posts/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    posts = posts.filter(p => p._id !== id);
                    renderPosts();
                    updateStats();
                    Swal.fire('Eliminado', 'Publicación eliminada exitosamente', 'success');
                }
            } catch (error) {
                showErrorMessage('Error al eliminar publicación');
            }
        }
    });
}

function editarSensor(id) {
    showEditModal('sensor', id);
}

function eliminarSensor(id) {
    sensores = sensores.filter(s => s._id !== id);
    renderSensores();
}

function showEditModal(type, id) {
    console.log(`Editando ${type} con ID: ${id}`);
}

function showErrorMessage(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
    });
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function goBack() {
    window.location.href = '/home';
}
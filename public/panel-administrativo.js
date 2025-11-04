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
    // Verificar si el usuario es administrador
    isAdmin = currentUser.email === 'admin@escuela.edu.mx' || 
              currentUser.email === 'sergio.admin@escuela.edu.mx' || // Puedes añadir más emails de admin
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
    // Filtros de búsqueda
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


        // Actualizar todo
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
    const searchTerm = document.getElementById('searchHistorial').value.toLowerCase();
    const filteredHistorial = historial.filter(item => 
        item.usuario.toLowerCase().includes(searchTerm) ||
        item.accion.toLowerCase().includes(searchTerm) ||
        item.descripcion.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('historialTable');
    tbody.innerHTML = filteredHistorial.map(item => `
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
    const searchTerm = document.getElementById('searchSensores').value.toLowerCase();
    const filteredSensores = sensores.filter(sensor => 
        sensor.nombre.toLowerCase().includes(searchTerm) ||
        sensor.ubicacion.toLowerCase().includes(searchTerm)
    );

    const tbody = document.getElementById('sensoresTable');
    tbody.innerHTML = filteredSensores.map(sensor => `
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

// Funciones de edición/eliminación (simuladas por ahora)
function editarUsuario(id) {
    showEditModal('usuario', id);
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
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    usuarios = usuarios.filter(u => u._id !== id);
                    renderUsuarios();
                    updateStats();
                    Swal.fire('¡Eliminado!', 'Usuario eliminado exitosamente', 'success');
                } else {
                    throw new Error('Error al eliminar usuario');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorMessage('Error al eliminar usuario');
            });
        }
    });
}

function editarProyecto(id) {
    showEditModal('proyecto', id);
}

function eliminarProyecto(id) {
    fetch(`/api/proyectos/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            proyectos = proyectos.filter(p => p._id !== id);
            renderProyectos();
            updateStats();
        } else {
            throw new Error('Error al eliminar proyecto');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage('Error al eliminar proyecto');
    });
}

function editarPost(id) {
    showEditModal('post', id);
}

function eliminarPost(id) {
    fetch(`/api/posts/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            posts = posts.filter(p => p._id !== id);
            renderPosts();
            updateStats();
        } else {
            throw new Error('Error al eliminar post');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showErrorMessage('Error al eliminar post');
    });
}

function editarSensor(id) {
    showEditModal('sensor', id);
}

function eliminarSensor(id) {
    sensores = sensores.filter(s => s._id !== id);
    renderSensores();
}

// Modal de edición
function showEditModal(type, id) {
    let title = '';
    let fields = '';
    
    switch(type) {
        case 'usuario':
            title = 'Editar Usuario';
            fields = `
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" id="editNombre" value="${usuarios.find(u => u._id === id)?.nombre || ''}">
                </div>
                <div class="form-group">
                    <label>Correo:</label>
                    <input type="email" id="editCorreo" value="${usuarios.find(u => u._id === id)?.correo || ''}">
                </div>
                <div class="form-group">
                    <label>Institución:</label>
                    <input type="text" id="editInstitucion" value="${usuarios.find(u => u._id === id)?.institucion || ''}">
                </div>
            `;
            break;
        case 'proyecto':
            title = 'Editar Proyecto';
            fields = `
                <div class="form-group">
                    <label>Nombre:</label>
                    <input type="text" id="editNombre" value="${proyectos.find(p => p._id === id)?.nombre || ''}">
                </div>
                <div class="form-group">
                    <label>Descripción:</label>
                    <textarea id="editDescripcion">${proyectos.find(p => p._id === id)?.descripcion || ''}</textarea>
                </div>
            `;
            break;
        case 'post':
            title = 'Editar Publicación';
            fields = `
                <div class="form-group">
                    <label>Título:</label>
                    <input type="text" id="editTitulo" value="${posts.find(p => p._id === id)?.title || ''}">
                </div>
                <div class="form-group">
                    <label>Contenido:</label>
                    <textarea id="editContenido">${posts.find(p => p._id === id)?.content || ''}</textarea>
                </div>
            `;
            break;
    }

    Swal.fire({
        title: title,
        html: fields,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                nombre: document.getElementById('editNombre')?.value,
                correo: document.getElementById('editCorreo')?.value,
                institucion: document.getElementById('editInstitucion')?.value,
                descripcion: document.getElementById('editDescripcion')?.value,
                titulo: document.getElementById('editTitulo')?.value,
                contenido: document.getElementById('editContenido')?.value
            };
        }
    }).then(result => {
        if (result.isConfirmed) {
            // Aquí se haría la actualización real en la base de datos
            console.log('Datos actualizados:', result.value);
            Swal.fire('¡Actualizado!', 'Datos actualizados exitosamente', 'success');
        }
    });
}

// Mostrar mensaje de error
function showErrorMessage(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
    });
}

// Formatear fecha
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

// Mostrar pestaña
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Función para volver atrás
function goBack() {
    window.location.href = '/home';
}
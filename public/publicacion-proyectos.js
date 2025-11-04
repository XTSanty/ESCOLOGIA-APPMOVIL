let proyectos = [];
let currentUser = null;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadProyectos();
    setupEventListeners();
});

// Cargar información del usuario
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {
        nombre: 'Usuario Demo',
        correo: 'demo@escuela.edu.mx'
    };
    currentUser = {
        name: userData.nombre || 'Usuario Demo',
        email: userData.correo || 'demo@escuela.edu.mx'
    };
}

// Event listeners
function setupEventListeners() {
    // Filtro de búsqueda
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Filtros de estado
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderProyectos();
        });
    });
    
    // Formulario de proyecto
    document.getElementById('proyectoForm').addEventListener('submit', handleFormSubmit);
}

// Cargar proyectos desde MongoDB
async function loadProyectos() {
    try {
        const response = await fetch('/api/proyectos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            proyectos = await response.json();
        } else {
            throw new Error('Error al cargar proyectos');
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        proyectos = [];
    }
    
    renderProyectos();
    updateStats();
}

// Renderizar proyectos
function renderProyectos() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const estadoFilter = document.querySelector('.filter-btn.active').dataset.estado;
    
    let filteredProyectos = [...proyectos];
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filteredProyectos = filteredProyectos.filter(proyecto => 
            proyecto.nombre.toLowerCase().includes(searchTerm) ||
            proyecto.descripcion.toLowerCase().includes(searchTerm) ||
            proyecto.usuario.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrar por estado
    if (estadoFilter !== 'todos') {
        filteredProyectos = filteredProyectos.filter(proyecto => proyecto.estado === estadoFilter);
    }
    
    const grid = document.getElementById('proyectosGrid');
    
    if (filteredProyectos.length === 0) {
        grid.innerHTML = `
            <div class="no-proyectos">
                <h3>🔍 No hay proyectos</h3>
                <p>${searchTerm ? 'No se encontraron proyectos con los filtros aplicados' : 'No hay proyectos aún. Crea tu primer proyecto!'}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredProyectos.map(proyecto => createProyectoHTML(proyecto)).join('');
}

// Crear HTML de un proyecto
function createProyectoHTML(proyecto) {
    return `
        <div class="proyecto-card ${proyecto.estado}" data-id="${proyecto._id}">
            <div class="proyecto-header">
                <h4 class="proyecto-title">${proyecto.nombre}</h4>
                <label class="estado-switch">
                    <input type="checkbox" ${proyecto.estado === 'terminado' ? 'checked' : ''} 
                           onchange="toggleEstado('${proyecto._id}')">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div class="proyecto-content">
                <p class="proyecto-description">${proyecto.descripcion}</p>
            </div>
            
            <div class="proyecto-meta">
                Publicado por <strong>${proyecto.usuario}</strong> el ${formatDate(proyecto.fecha)}
            </div>
            
            <div class="proyecto-footer">
                <span>${proyecto.estado === 'terminado' ? '✅ Terminado' : '⏳ Pendiente'}</span>
                <button class="delete-btn" onclick="deleteProyecto('${proyecto._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Toggle estado de proyecto
async function toggleEstado(proyectoId) {
    const proyecto = proyectos.find(p => p._id === proyectoId);
    if (!proyecto) return;
    
    const nuevoEstado = proyecto.estado === 'pendiente' ? 'terminado' : 'pendiente';
    
    try {
        // Actualizar en MongoDB
        const response = await fetch(`/api/proyectos/${proyectoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (response.ok) {
            proyecto.estado = nuevoEstado;
            renderProyectos();
            updateStats();
        } else {
            throw new Error('Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        // Revertir el cambio visual si falla
        const checkbox = document.querySelector(`[data-id="${proyectoId}"] input[type="checkbox"]`);
        checkbox.checked = !checkbox.checked;
    }
}

// Eliminar proyecto
async function deleteProyecto(proyectoId) {
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
                const response = await fetch(`/api/proyectos/${proyectoId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    proyectos = proyectos.filter(p => p._id !== proyectoId);
                    renderProyectos();
                    updateStats();
                    
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'El proyecto ha sido eliminado',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });
                } else {
                    throw new Error('Error al eliminar proyecto');
                }
            } catch (error) {
                console.error('Error al eliminar proyecto:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al eliminar el proyecto',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }
    });
}

// Abrir modal de creación
function openCreateModal(proyecto = null) {
    const modal = document.getElementById('proyectoModal');
    const form = document.getElementById('proyectoForm');
    const title = document.getElementById('modalTitle');
    
    if (proyecto) {
        title.textContent = 'Editar Proyecto';
        document.getElementById('nombre').value = proyecto.nombre;
        document.getElementById('descripcion').value = proyecto.descripcion;
        form.dataset.editId = proyecto._id;
    } else {
        title.textContent = 'Crear Nuevo Proyecto';
        form.reset();
        delete form.dataset.editId;
    }
    
    modal.style.display = 'flex';
}

// Cerrar modal
function closeModal() {
    document.getElementById('proyectoModal').style.display = 'none';
    document.getElementById('proyectoForm').reset();
    delete document.getElementById('proyectoForm').dataset.editId;
}

// Manejar submit del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const proyecto = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        estado: 'pendiente', // Por defecto
        fecha: new Date(),
        usuario: currentUser.name,
        correo: currentUser.email
    };
    
    const editId = e.target.dataset.editId;
    
    try {
        let response;
        if (editId) {
            // Actualizar proyecto existente
            response = await fetch(`/api/proyectos/${editId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(proyecto)
            });
        } else {
            // Crear nuevo proyecto
            response = await fetch('/api/proyectos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(proyecto)
            });
        }
        
        if (response.ok) {
            const result = await response.json();
            
            if (editId) {
                // Actualizar en el array local
                const index = proyectos.findIndex(p => p._id === editId);
                if (index !== -1) {
                    proyectos[index] = result;
                }
            } else {
                // Añadir al array local
                proyectos.push(result);
            }
            
            renderProyectos();
            updateStats();
            closeModal();
            
            Swal.fire({
                title: editId ? '¡Proyecto actualizado!' : '¡Proyecto creado!',
                text: editId ? 'El proyecto ha sido actualizado exitosamente' : 'El proyecto ha sido creado exitosamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } else {
            throw new Error('Error al guardar proyecto');
        }
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar el proyecto',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Manejar búsqueda
function handleSearch(e) {
    renderProyectos();
}

// Actualizar estadísticas
function updateStats() {
    const total = proyectos.length;
    const pendientes = proyectos.filter(p => p.estado === 'pendiente').length;
    const terminados = proyectos.filter(p => p.estado === 'terminado').length;
    
    document.getElementById('totalProyectos').textContent = total;
    document.getElementById('pendientesCount').textContent = pendientes;
    document.getElementById('terminadosCount').textContent = terminados;
}

// Formatear fecha
function formatDate(date) {
    const d = new Date(date);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} - ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Función para volver atrás
function goBack() {
    window.location.href = '/home';
}
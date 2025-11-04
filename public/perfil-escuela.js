let currentUser = null;
let allPosts = [];
let allProjects = [];

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadAllData();
});

// Cargar información del usuario
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {
        nombre: 'Usuario Demo',
        correo: 'demo@escuela.edu.mx',
        institucion: 'Escuela Demo'
    };
    currentUser = {
        name: userData.nombre || 'Usuario Demo',
        email: userData.correo || 'demo@escuela.edu.mx',
        institucion: userData.institucion || 'Escuela Demo'
    };
    
    updateProfileDisplay();
}

// Actualizar visualización del perfil
function updateProfileDisplay() {
    document.getElementById('perfilNombre').textContent = currentUser.name;
    document.getElementById('perfilInstitucion').textContent = currentUser.institucion;
    document.getElementById('perfilEmail').textContent = currentUser.email;
    document.getElementById('perfilUsuario').textContent = currentUser.name;
    document.getElementById('perfilFecha').textContent = new Date().toLocaleDateString('es-ES');
}

// Cargar todos los datos
async function loadAllData() {
    try {
        // Cargar posts de otros usuarios
        const postsResponse = await fetch('/api/posts');
        if (postsResponse.ok) {
            allPosts = await postsResponse.json();
        }
        
        // Cargar proyectos
        const proyectosResponse = await fetch('/api/proyectos');
        if (proyectosResponse.ok) {
            allProjects = await proyectosResponse.json();
        }
        
        // Actualizar estadísticas y actividad
        updateStats();
        updateActivity();
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// Actualizar estadísticas
function updateStats() {
    const userPosts = allPosts.filter(post => post.email === currentUser.email);
    const userProjects = allProjects.filter(project => project.correo === currentUser.email);
    const completedProjects = userProjects.filter(project => project.estado === 'terminado');
    const activeProjects = userProjects.filter(project => project.estado === 'pendiente');
    
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${userPosts.length}</div>
            <div class="stat-label">Publicaciones</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${userProjects.length}</div>
            <div class="stat-label">Proyectos</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${completedProjects.length}</div>
            <div class="stat-label">Completados</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${activeProjects.length}</div>
            <div class="stat-label">Activos</div>
        </div>
    `;
}

// Actualizar actividad reciente
function updateActivity() {
    const userPosts = allPosts.filter(post => post.email === currentUser.email);
    const userProjects = allProjects.filter(project => project.correo === currentUser.email);
    
    // Combinar y ordenar por fecha
    const allActivities = [
        ...userPosts.map(post => ({
            type: 'post',
            title: post.title,
            description: post.content.substring(0, 50) + '...',
            date: new Date(post.date),
            icon: 'fas fa-comment'
        })),
        ...userProjects.map(project => ({
            type: 'project',
            title: project.nombre,
            description: project.descripcion.substring(0, 50) + '...',
            date: new Date(project.fecha),
            icon: 'fas fa-project-diagram'
        }))
    ].sort((a, b) => b.date - a.date).slice(0, 5); // Solo las 5 más recientes
    
    const actividadList = document.getElementById('actividadList');
    
    if (allActivities.length === 0) {
        actividadList.innerHTML = '<div class="no-actividad">No hay actividad reciente</div>';
        return;
    }
    
    actividadList.innerHTML = allActivities.map(activity => `
        <div class="actividad-item">
            <div class="actividad-title">
                <i class="${activity.icon}"></i> ${activity.title}
            </div>
            <div class="actividad-desc">${activity.description}</div>
            <div class="actividad-date">${formatDate(activity.date)}</div>
        </div>
    `).join('');
}

// Formatear fecha
function formatDate(date) {
    const d = new Date(date);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} - ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Actualizar información del usuario
async function updateUserInfo() {
    // En realidad, esta funcionalidad se manejaría en el perfil de usuario general
    // Por ahora, solo mostramos un mensaje
    Swal.fire({
        title: 'Actualizar Información',
        text: 'Para actualizar tu información de registro, ve a la sección de perfil de usuario',
        icon: 'info',
        confirmButtonText: 'Aceptar'
    });
}

// Cambiar contraseña
async function changePassword() {
    const nuevaContraseña = document.getElementById('nuevaContraseña').value;
    const confirmarContraseña = document.getElementById('confirmarContraseña').value;
    
    if (!nuevaContraseña || !confirmarContraseña) {
        Swal.fire({
            title: 'Error',
            text: 'Por favor completa ambos campos',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    if (nuevaContraseña !== confirmarContraseña) {
        Swal.fire({
            title: 'Error',
            text: 'Las contraseñas no coinciden',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    if (nuevaContraseña.length < 6) {
        Swal.fire({
            title: 'Error',
            text: 'La contraseña debe tener al menos 6 caracteres',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: currentUser.email,
                newPassword: nuevaContraseña
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Contraseña actualizada correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
            
            // Limpiar campos
            document.getElementById('nuevaContraseña').value = '';
            document.getElementById('confirmarContraseña').value = '';
        } else {
            throw new Error(result.message || 'Error al cambiar contraseña');
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        Swal.fire({
            title: 'Error',
            text: error.message || 'Hubo un problema al cambiar la contraseña',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para volver atrás
function goBack() {
    window.location.href = '/home';
}
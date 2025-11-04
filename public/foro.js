// Categorías disponibles
const categorias = [
    { id: 'all', name: 'Todas', icon: '🌍', color: '#10b981' },
    { id: 'general', name: 'General', icon: '💬', color: '#3b82f6' },
    { id: 'proyectos', name: 'Proyectos', icon: '🌱', color: '#059669' },
    { id: 'ideas', name: 'Ideas', icon: '💡', color: '#f59e0b' },
    { id: 'noticias', name: 'Noticias', icon: '📰', color: '#8b5cf6' },
    { id: 'ayuda', name: 'Ayuda', icon: '🤝', color: '#ef4444' }
];

let currentUser = null;

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    generateCategories();
    loadPosts();
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

// Generar categorías en el filtro
function generateCategories() {
    const categoriesFilter = document.getElementById('categoriesFilter');
    const postCategorySelect = document.getElementById('postCategory');
    
    categoriesFilter.innerHTML = '';
    postCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categorias.forEach(categoria => {
        if (categoria.id !== 'all') { // No mostrar "Todas" en el select de categorías
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = `${categoria.icon} ${categoria.name}`;
            postCategorySelect.appendChild(option);
        }
        
        const btn = document.createElement('button');
        btn.className = 'category-filter-btn';
        btn.dataset.category = categoria.id;
        btn.innerHTML = `${categoria.icon} ${categoria.name}`;
        btn.style.setProperty('--category-color', categoria.color);
        btn.onclick = () => filterByCategory(categoria.id);
        
        if (categoria.id === 'all') {
            btn.classList.add('active');
        }
        
        categoriesFilter.appendChild(btn);
    });
}

// Cargar posts desde MongoDB
async function loadPosts() {
    try {
        const response = await fetch('/api/posts', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            renderPostsFromMongo(posts);
        } else {
            throw new Error('Error al cargar posts');
        }
    } catch (error) {
        console.error('Error al cargar posts:', error);
        renderPostsFromMongo([]);
    }
}

// Filtrar por categoría
function filterByCategory(categoryId) {
    // Actualizar botones activos
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${categoryId}"]`).classList.add('active');
    
    // Filtrar posts
    filterPosts(categoryId);
}

// Event listeners
function setupEventListeners() {
    // Formulario de publicación
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    
    // Filtro de búsqueda
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Filtro de orden
    document.getElementById('sortSelect').addEventListener('change', handleSortChange);
}

// Manejar envío de nueva publicación
async function handlePostSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newPost = {
        title: formData.get('title'),
        content: formData.get('content'),
        category: formData.get('category'),
        user: currentUser.name,
        email: currentUser.email,
        likes: 0,
        likedBy: [],
        comments: [],
        date: new Date()
    };
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPost)
        });
        
        if (response.ok) {
            const createdPost = await response.json();
            e.target.reset();
            loadPosts(); // Recargar posts desde MongoDB
            
            // Mostrar mensaje de éxito
            Swal.fire({
                title: '¡Publicación creada!',
                text: 'Tu mensaje ha sido publicado exitosamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });
        } else {
            throw new Error('Error al crear post');
        }
    } catch (error) {
        console.error('Error al crear post:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al crear la publicación',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Manejar búsqueda
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterPosts('all', searchTerm);
}

// Manejar cambio de orden
function handleSortChange(e) {
    const sortOrder = e.target.value;
    filterPosts('all', null, sortOrder);
}

// Filtrar posts (después de cargar desde MongoDB)
function filterPosts(categoryFilter = 'all', searchTerm = '', sortOrder = 'newest') {
    // Esta función se ejecutará después de que los posts estén cargados
    // Simplemente re-renderiza con los nuevos filtros
    loadPosts();
}

// Renderizar posts desde MongoDB
function renderPostsFromMongo(posts) {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const estadoFilter = document.querySelector('.category-filter-btn.active').dataset.category;
    const sortOrder = document.getElementById('sortSelect').value;
    
    let filteredPosts = [...posts];
    
    // Aplicar filtro de categoría
    if (estadoFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === estadoFilter);
    }
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            post.user.toLowerCase().includes(searchTerm) ||
            post.email.toLowerCase().includes(searchTerm) ||
            post.comments.some(comment => 
                comment.content.toLowerCase().includes(searchTerm) ||
                comment.user.toLowerCase().includes(searchTerm) ||
                comment.email.toLowerCase().includes(searchTerm)
            )
        );
    }
    
    // Aplicar orden
    filteredPosts.sort((a, b) => {
        switch (sortOrder) {
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'popular':
                return b.likes - a.likes;
            case 'newest':
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    const postsList = document.getElementById('postsList');
    
    if (filteredPosts.length === 0) {
        postsList.innerHTML = `
            <div class="no-posts">
                <div class="no-posts-icon">💬</div>
                <h3>No hay publicaciones</h3>
                <p>${estadoFilter === 'all' ? 'No hay publicaciones aún. Sé el primero en compartir algo!' : 'No hay publicaciones en esta categoría.'}</p>
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = filteredPosts.map(post => createPostHTML(post)).join('');
}

// Crear HTML de una publicación
function createPostHTML(post) {
    const category = categorias.find(cat => cat.id === post.category) || categorias[0];
    
    return `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <div class="post-user">
                    <div class="user-avatar">${getInitials(post.user)}</div>
                    <div class="user-details">
                        <div class="username">${post.user}</div>
                        <div class="user-email">${post.email}</div>
                        <div class="post-date">${formatDate(post.date)}</div>
                    </div>
                </div>
                <div class="post-category">
                    <span class="category-tag" style="background: ${category.color};">
                        ${category.icon} ${category.name}
                    </span>
                </div>
            </div>
            
            <div class="post-content">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
            </div>
            
            <div class="post-reactions">
                <button class="reaction-btn ${post.likedBy.includes(currentUser.email) ? 'liked' : ''}" onclick="toggleLike('${post._id}')">
                    <i class="fas fa-heart"></i>
                    <span class="reactions-count">${post.likes}</span>
                </button>
                <span class="reactions-count">${post.comments.length} comentarios</span>
            </div>
            
            <div class="comments-section">
                <div class="comments-list">
                    ${post.comments.map(comment => createCommentHTML(comment, post._id)).join('')}
                </div>
                
                <div class="add-comment-form">
                    <input type="text" class="comment-input" placeholder="Escribe un comentario..." 
                           onkeypress="handleCommentSubmit(event, '${post._id}')">
                    <button class="comment-submit-btn" onclick="addComment('${post._id}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            
            <div class="post-actions">
                <button class="action-btn edit-btn" onclick="editPost('${post._id}', '${post.title}', '${post.content}', '${post.category}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" onclick="deletePost('${post._id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

// Crear HTML de un comentario
function createCommentHTML(comment, postId) {
    return `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-user">${comment.user}</div>
                <div class="comment-date">${formatDate(comment.date)}</div>
            </div>
            <div class="comment-text">${comment.content}</div>
        </div>
    `;
}

// Toggle like
async function toggleLike(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        if (response.ok) {
            loadPosts(); // Recargar posts
        } else {
            throw new Error('Error al actualizar like');
        }
    } catch (error) {
        console.error('Error al actualizar like:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al actualizar el like',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Agregar comentario
async function addComment(postId) {
    const input = document.querySelector(`[data-post-id="${postId}"] .comment-input`);
    const content = input.value.trim();
    
    if (!content) return;
    
    const comment = {
        user: currentUser.name,
        email: currentUser.email,
        content: content,
        date: new Date()
    };
    
    try {
        const response = await fetch(`/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(comment)
        });
        
        if (response.ok) {
            input.value = '';
            loadPosts(); // Recargar posts
        } else {
            throw new Error('Error al agregar comentario');
        }
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al agregar el comentario',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Manejar submit de comentario con Enter
function handleCommentSubmit(event, postId) {
    if (event.key === 'Enter') {
        addComment(postId);
    }
}

// Editar publicación (solo si es el autor)
async function editPost(postId, currentTitle, currentContent, currentCategory) {
    const post = await getPostById(postId);
    if (post.email !== currentUser.email) {
        Swal.fire({
            title: 'Acceso denegado',
            text: 'Solo puedes editar tus propias publicaciones',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    Swal.fire({
        title: 'Editar publicación',
        html: `
            <input id="editTitle" class="swal2-input" placeholder="Título" value="${currentTitle}">
            <textarea id="editContent" class="swal2-textarea" placeholder="Contenido">${currentContent}</textarea>
            <select id="editCategory" class="swal2-select">
                ${categorias.filter(cat => cat.id !== 'all').map(cat => 
                    `<option value="${cat.id}" ${currentCategory === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`
                ).join('')}
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const title = document.getElementById('editTitle').value;
            const content = document.getElementById('editContent').value;
            const category = document.getElementById('editCategory').value;
            
            if (!title || !content || !category) {
                Swal.showValidationMessage('Por favor completa todos los campos');
                return false;
            }
            
            return { title, content, category };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: result.value.title,
                        content: result.value.content,
                        category: result.value.category
                    })
                });
                
                if (response.ok) {
                    loadPosts();
                } else {
                    throw new Error('Error al actualizar post');
                }
            } catch (error) {
                console.error('Error al actualizar post:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al actualizar la publicación',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }
    });
}

// Eliminar publicación (solo si es el autor)
async function deletePost(postId) {
    const post = await getPostById(postId);
    if (post.email !== currentUser.email) {
        Swal.fire({
            title: 'Acceso denegado',
            text: 'Solo puedes eliminar tus propias publicaciones',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
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
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadPosts();
                    
                    Swal.fire({
                        title: '¡Eliminado!',
                        text: 'La publicación ha sido eliminada',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    });
                } else {
                    throw new Error('Error al eliminar post');
                }
            } catch (error) {
                console.error('Error al eliminar post:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al eliminar la publicación',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            }
        }
    });
}

// Obtener post por ID
async function getPostById(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Post no encontrado');
    } catch (error) {
        console.error('Error al obtener post:', error);
        return null;
    }
}

// Obtener iniciales para avatar
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Formatear fecha
function formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `${diffDays} días atrás`;
    } else {
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Función para volver atrás
function goBack() {
    window.location.href = '/home';
}
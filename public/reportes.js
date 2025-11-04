// public/reportes.js - VERSION CORREGIDA CON USUARIOS Y POSTS/COMENTARIOS
let proyectosData = [];
let postsData = [];
let usersData = [];
let comentariosData = [];

// Gráficos
let proyectosChart = null;
let tendenciaChart = null;
let usuariosChart = null;
let actividadChart = null;

document.addEventListener('DOMContentLoaded', function () {
    loadReportData();
});

async function loadReportData() {
    try {
        const response = await fetch('/api/reportes/charts', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.status === 401) {
            Swal.fire('Sesión expirada', 'Por favor inicia sesión nuevamente', 'warning')
                .then(() => window.location.href = '/');
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        proyectosData = Array.isArray(data.proyectos) ? data.proyectos : [];
        postsData = Array.isArray(data.posts) ? data.posts : [];
        usersData = Array.isArray(data.users) ? data.users : [];
        comentariosData = Array.isArray(data.comentarios) ? data.comentarios : [];

        updateKPIs();
        renderCharts();
        renderRanking();
        renderODSProgress();
        renderUsuariosActividad();

    } catch (error) {
        console.error('Error al cargar reportes:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos. Revisa tu conexión.', 'error');
    }
}

function updateKPIs() {
    // Obtener elementos (si existen)
    const totalProyectosEl = document.getElementById('totalProyectos');
    const proyectosTerminadosEl = document.getElementById('proyectosTerminados');
    const impactoTotalEl = document.getElementById('impactoTotal');
    const participantesEl = document.getElementById('participantes');
    const totalPostsEl = document.getElementById('totalPosts'); // Nuevo KPI

    // Actualizar solo si el elemento existe
    if (totalProyectosEl) totalProyectosEl.textContent = proyectosData.length;
    if (proyectosTerminadosEl) proyectosTerminadosEl.textContent = proyectosData.filter(p => p.estado === 'terminado').length;
    if (impactoTotalEl) impactoTotalEl.textContent = proyectosData.reduce((sum, p) => sum + (p.impacto || 0), 0);
    if (participantesEl) participantesEl.textContent = usersData.length;
    if (totalPostsEl) totalPostsEl.textContent = postsData.length;
}

function renderCharts() {
    // Destruir gráficos anteriores
    if (proyectosChart) proyectosChart.destroy();
    if (tendenciaChart) tendenciaChart.destroy();
    if (usuariosChart) usuariosChart.destroy();
    if (actividadChart) actividadChart.destroy();

    // 1. Proyectos por estado
    const ctx1 = document.getElementById('proyectosChart');
    if (ctx1) {
        const estadoCounts = {};
        proyectosData.forEach(p => {
            const estado = p.estado || 'activo';
            estadoCounts[estado] = (estadoCounts[estado] || 0) + 1;
        });

        proyectosChart = new Chart(ctx1.getContext('2d'), {
            type: 'pie',
            data: { // ✅ CORREGIDO: falta data
                labels: Object.keys(estadoCounts),
                datasets: [{
                    data: Object.values(estadoCounts),
                    backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // 2. Tendencia mensual
    const ctx2 = document.getElementById('tendenciaChart');
    if (ctx2) {
        const monthly = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('es-ES', { year: '2-digit', month: '2-digit' });
            monthly[key] = 0;
        }

        postsData.forEach(post => {
            if (post.date) {
                const d = new Date(post.date);
                const key = d.toLocaleString('es-ES', { year: '2-digit', month: '2-digit' });
                if (monthly[key] !== undefined) monthly[key]++;
            }
        });

        tendenciaChart = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: { // ✅ CORREGIDO: falta data
                labels: Object.keys(monthly),
                datasets: [{
                    label: 'Publicaciones por mes',
                    data: Object.values(monthly),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 3. Usuarios por tipo
    const ctx3 = document.getElementById('usuariosChart');
    if (ctx3) {
        const tipoCounts = {};
        usersData.forEach(u => {
            const tipo = u.tipoUsuario || 'escuela';
            tipoCounts[tipo] = (tipoCounts[tipo] || 0) + 1;
        });

        usuariosChart = new Chart(ctx3.getContext('2d'), {
            type: 'bar',
            data: { // ✅ CORREGIDO: falta data
                labels: Object.keys(tipoCounts),
                datasets: [{
                    label: 'Cantidad',
                    data: Object.values(tipoCounts),
                    backgroundColor: ['#3498db', '#9b59b6', '#e67e22', '#2ecc71']
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 4. Actividad por usuario
    const ctx4 = document.getElementById('actividadChart');
    if (ctx4) {
        const actividad = {};
        postsData.forEach(post => {
            const usuario = post.user || post.correo || 'Anónimo';
            actividad[usuario] = actividad[usuario] || { posts: 0, comentarios: 0 };
            actividad[usuario].posts++;
        });
        comentariosData.forEach(com => {
            const usuario = com.usuario || 'Anónimo';
            actividad[usuario] = actividad[usuario] || { posts: 0, comentarios: 0 };
            actividad[usuario].comentarios++;
        });

        const usuarios = Object.keys(actividad);
        const posts = usuarios.map(u => actividad[u].posts);
        const comentarios = usuarios.map(u => actividad[u].comentarios);

        actividadChart = new Chart(ctx4.getContext('2d'), {
            type: 'bar',
            data: { // ✅ CORREGIDO: falta data
                labels: usuarios,
                datasets: [
                    {
                        label: 'Publicaciones',
                        data: posts,
                        backgroundColor: '#3498db',
                        stack: 'actividad'
                    },
                    {
                        label: 'Comentarios',
                        data: comentarios,
                        backgroundColor: '#e74c3c',
                        stack: 'actividad'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }
}

function renderRanking() {
    const escuelas = {};
    proyectosData.forEach(p => {
        const inst = p.institucion || (usersData.find(u => u.correo === p.usuario)?.institucion) || 'Comunidad';
        escuelas[inst] = (escuelas[inst] || 0) + 1;
    });

    const top = Object.entries(escuelas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const list = document.getElementById('rankingList');
    list.innerHTML = top.map(([escuela, count], i) => `
        <li>
            <span class="rank">${i + 1}</span>
            <span class="school-name">${escuela}</span>
            <span class="project-count">${count} proyectos</span>
        </li>
    `).join('');
}

function renderODSProgress() {
    const odsList = [
        { id: 4, name: 'Educación de Calidad' },
        { id: 11, name: 'Ciudades Sostenibles' },
        { id: 13, name: 'Acción Climática' }
    ];

    const grid = document.getElementById('odsGrid');
    grid.innerHTML = odsList.map(ods => {
        const count = proyectosData.filter(p => 
            (Array.isArray(p.ods) && p.ods.includes(ods.id)) || p.ods == ods.id
        ).length;
        return `
            <div class="ods-card">
                <div class="ods-header">
                    <span class="ods-id">ODS ${ods.id}</span>
                    <span class="ods-count">${count}</span>
                </div>
                <div class="ods-name">${ods.name}</div>
                <div class="ods-bar">
                    <div class="ods-progress" style="width: ${Math.min(100, count * 20)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderUsuariosActividad() {
    const container = document.getElementById('usuariosActividad');
    if (!container) return;

    const usuariosConActividad = usersData.map(u => {
        const postsUsuario = postsData.filter(p => p.user === u.correo || p.correo === u.correo);
        const comentariosUsuario = comentariosData.filter(c => c.usuario === u.correo);
        return {
            usuario: u.nombre || u.correo,
            correo: u.correo,
            tipo: u.tipoUsuario || 'escuela',
            posts: postsUsuario.length,
            comentarios: comentariosUsuario.length,
            total: postsUsuario.length + comentariosUsuario.length
        };
    });

    usuariosConActividad.sort((a, b) => b.total - a.total);

    container.innerHTML = usuariosConActividad.map(u => `
        <div class="user-activity-card">
            <h4>${u.usuario}</h4>
            <p><strong>Correo:</strong> ${u.correo}</p>
            <p><strong>Tipo:</strong> ${u.tipo}</p>
            <p><i class="fas fa-comments"></i> Publicaciones: ${u.posts} | 
               <i class="fas fa-comment"></i> Comentarios: ${u.comentarios}</p>
        </div>
    `).join('');
}

function exportarExcel() {
    if (proyectosData.length === 0) {
        Swal.fire('Sin datos', 'Espera a que se carguen los reportes', 'info');
        return;
    }

    Swal.fire({
        title: 'Generando reporte comunitario...',
        text: 'Compilando datos reales de usuarios, proyectos y publicaciones',
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        willOpen: () => Swal.showLoading()
    });

    setTimeout(() => {
        try {
            let csv = '';

            // === RESUMEN ===
            csv += 'RESUMEN DE IMPACTO COMUNITARIO\n';
            csv += 'Metrica,Valor\n';
            csv += `"Proyectos Totales",${proyectosData.length}\n`;
            csv += `"Usuarios Activos",${usersData.length}\n`;
            csv += `"Publicaciones",${postsData.length}\n`;
            csv += `"Comentarios",${comentariosData.length}\n\n`;

            // === USUARIOS ===
            csv += 'USUARIOS\n';
            csv += 'ID,Nombre,Correo,Institucion,Tipo,Fecha Registro,Publicaciones,Comentarios\n';
            usersData.forEach(u => {
                const postsUsuario = postsData.filter(p => p.user === u.correo).length;
                const comentariosUsuario = comentariosData.filter(c => c.usuario === u.correo).length;
                csv += `"${u._id?.toString().replace(/"/g, '""') || ''}",` +
                       `"${(u.nombre || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(u.correo || '').replace(/"/g, '""')}",` +
                       `"${(u.institucion || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(u.tipoUsuario || '').replace(/"/g, '""')}",` +
                       `"${u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-ES') : ''}",` +
                       `"${postsUsuario}",` +
                       `"${comentariosUsuario}"\n`;
            });
            csv += '\n';

            // === PROYECTOS ===
            csv += 'PROYECTOS\n';
            csv += 'ID,Nombre,Descripcion,Usuario,Institucion,Estado,Fecha\n';
            proyectosData.forEach(p => {
                csv += `"${p._id?.toString().replace(/"/g, '""') || ''}",` +
                       `"${(p.nombre || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(p.descripcion || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(p.usuario || '').replace(/"/g, '""')}",` +
                       `"${(p.institucion || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(p.estado || '').replace(/"/g, '""')}",` +
                       `"${p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : ''}"\n`;
            });
            csv += '\n';

            // === PUBLICACIONES ===
            csv += 'PUBLICACIONES\n';
            csv += 'ID,Titulo,Contenido,Usuario,Categoria,Fecha\n';
            postsData.forEach(p => {
                csv += `"${p._id?.toString().replace(/"/g, '""') || ''}",` +
                       `"${(p.title || p.titulo || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(p.content || p.contenido || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${(p.user || p.correo || '').replace(/"/g, '""')}",` +
                       `"${(p.category || p.categoria || '').replace(/"/g, '""').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}",` +
                       `"${p.date ? new Date(p.date).toLocaleDateString('es-ES') : ''}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ESCOLOGIA_Reporte_Comunitario_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Swal.close();
            Swal.fire('¡Listo!', 'Reporte descargado con datos reales de la comunidad', 'success');

        } catch (error) {
            Swal.close();
            console.error('Error CSV:', error);
            Swal.fire('Error', 'No se pudo generar el archivo', 'error');
        }
    }, 300);
}
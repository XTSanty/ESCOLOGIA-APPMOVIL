// globalBackHandler.js - Manejo global del botón de atrás en Android
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en Capacitor (app nativa)
    if (window.Capacitor && window.Capacitor.Plugins.App) {
        const { App } = window.Capacitor.Plugins;
        
        // Lista de páginas principales (desde donde SÍ se cierra la app)
        const mainPages = ['home.html', 'Home.html', 'index.html', 'login.html'];
        
        // Obtener el nombre de la página actual
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        console.log('📱 Página actual:', currentPage);
        
        // Agregar listener para el botón de atrás
        App.addListener('backButton', ({ canGoBack }) => {
            console.log('⬅️ Botón atrás presionado');
            console.log('🔍 Puede retroceder:', canGoBack);
            console.log('📄 Página actual:', currentPage);
            
            // Si estamos en una página principal, cerrar la app
            if (mainPages.includes(currentPage)) {
                console.log('🏠 En página principal - Cerrando app');
                App.exitApp();
            } 
            // Si estamos en una página secundaria, retroceder
            else {
                console.log('🔙 En página secundaria - Retrocediendo');
                
                // Si hay historial, retroceder
                if (window.history.length > 1) {
                    window.history.back();
                } 
                // Si no hay historial, ir a Home
                else {
                    window.location.href = 'Home.html';
                }
            }
        });
        
        console.log('✅ Listener del botón atrás configurado para:', currentPage);
    } else {
        console.log('🌐 Ejecutando en navegador web (no en app nativa)');
    }
});

// Función auxiliar para navegación
function goBack() {
    console.log('🔙 goBack() llamado');
    
    // Si estamos en Capacitor
    if (window.Capacitor && window.Capacitor.Plugins.App) {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'Home.html';
        }
    } 
    // Si estamos en navegador
    else {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = 'Home.html';
        }
    }
}

// Exportar para uso global
window.goBack = goBack;
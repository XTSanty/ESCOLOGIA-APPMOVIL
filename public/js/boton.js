// boton.js
document.addEventListener("DOMContentLoaded", () => {
    // Evitar duplicados
    if (document.querySelector(".back-btn-global")) return;

    // Crear botón
    const btn = document.createElement("button");
    btn.classList.add("back-btn-global");
    btn.innerHTML = '<i class="fas fa-arrow-left"></i> Volver a Inicio';

    // Estilos
    Object.assign(btn.style, {
        position: "fixed",
        left: "20px",
        bottom: "20px",
        background: "linear-gradient(135deg, #43a047, #66bb6a)",
        color: "#fff",
        border: "none",
        borderRadius: "50px",
        padding: "12px 24px",
        fontSize: "1rem",
        fontWeight: "600",
        cursor: "pointer",
        boxShadow: "0 8px 25px rgba(76, 175, 80, 0.4)",
        zIndex: "9999",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "all 0.2s ease-in-out"
    });

    // Hover animado
    btn.addEventListener("mouseover", () => {
        btn.style.transform = "translateY(-3px)";
        btn.style.boxShadow = "0 12px 35px rgba(76, 175, 80, 0.6)";
    });
    btn.addEventListener("mouseout", () => {
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 8px 25px rgba(76, 175, 80, 0.4)";
    });

    // Acción del botón → SIEMPRE ir al home
    btn.addEventListener("click", () => {
        window.location.href = "home.html";
    });

    // Añadir al body
    document.body.appendChild(btn);

    // Manejar botón físico atrás (en Android con Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const { App } = window.Capacitor.Plugins;

        App.addListener("backButton", () => {
            // Evitar que la app se cierre
            window.location.href = "home.html";
        });
    }
});

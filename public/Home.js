// Función para redirigir con SweetAlert
function redirectTo(page, pageName) {
    Swal.fire({
        title: 'Redirigiendo...',
        text: `Redirigiendo a ${pageName}`,
        icon: 'info',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 2000,
        timerProgressBar: true,
        willOpen: () => {
            Swal.showLoading();
        }
    }).then(() => {
        // Redirigir a la página correspondiente
        window.location.href = `/${page}`;
    });
}

// Cargar información del usuario
function loadUserInfo() {
    const userData = JSON.parse(localStorage.getItem('currentUser')) || {
        nombre: 'Usuario Demo',
        institucion: 'Escuela Demo'
    };
    document.getElementById('userName').textContent = userData.nombre || 'Usuario';
}

// Formatear fecha
function formatearFecha() {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const fecha = new Date();
    const diaSemana = dias[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    
    return `${diaSemana}, ${dia} de ${mes} de ${año}`;
}

// Obtener emoji según condición del clima
function getWeatherEmoji(main) {
    const emojis = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️'
    };
    return emojis[main] || '🌤️';
}

// Traducir descripción del clima al español
function traducirDescripcion(descripcion) {
    const traducciones = {
        'clear sky': 'Cielo despejado',
        'few clouds': 'Pocas nubes',
        'scattered clouds': 'Nubes dispersas',
        'broken clouds': 'Nubes rotas',
        'overcast clouds': 'Nublado',
        'light rain': 'Lluvia ligera',
        'moderate rain': 'Lluvia moderada',
        'heavy intensity rain': 'Lluvia intensa',
        'very heavy rain': 'Lluvia muy intensa',
        'extreme rain': 'Lluvia extrema',
        'freezing rain': 'Lluvia helada',
        'light intensity shower rain': 'Chubasco ligero',
        'shower rain': 'Chubascos',
        'heavy intensity shower rain': 'Chubascos intensos',
        'ragged shower rain': 'Chubascos irregulares',
        'light snow': 'Nieve ligera',
        'snow': 'Nieve',
        'heavy snow': 'Nieve intensa',
        'sleet': 'Aguanieve',
        'light shower sleet': 'Aguanieve ligera',
        'shower sleet': 'Aguanieve',
        'light rain and snow': 'Lluvia y nieve ligera',
        'rain and snow': 'Lluvia y nieve',
        'light shower snow': 'Nevada ligera',
        'shower snow': 'Nevada',
        'heavy shower snow': 'Nevada intensa',
        'mist': 'Niebla',
        'smoke': 'Humo',
        'haze': 'Bruma',
        'sand/dust whirls': 'Remolinos de arena/polvo',
        'fog': 'Niebla',
        'sand': 'Arena',
        'dust': 'Polvo',
        'volcanic ash': 'Ceniza volcánica',
        'squalls': 'Borrascas',
        'tornado': 'Tornado',
        'thunderstorm': 'Tormenta eléctrica',
        'thunderstorm with light rain': 'Tormenta con lluvia ligera',
        'thunderstorm with rain': 'Tormenta con lluvia',
        'thunderstorm with heavy rain': 'Tormenta con lluvia intensa',
        'light thunderstorm': 'Tormenta ligera',
        'heavy thunderstorm': 'Tormenta intensa',
        'ragged thunderstorm': 'Tormenta irregular',
        'thunderstorm with drizzle': 'Tormenta con llovizna',
        'heavy intensity drizzle': 'Llovizna intensa',
        'drizzle': 'Llovizna',
        'light intensity drizzle': 'Llovizna ligera',
        'drizzle with rain': 'Llovizna con lluvia',
        'light intensity drizzle with rain': 'Llovizna ligera con lluvia',
        'shower drizzle': 'Llovizna intensa'
    };
    
    const descripcionLower = descripcion.toLowerCase();
    return traducciones[descripcionLower] || descripcion;
}

// Cargar clima con API real - usando el nombre exacto de Santa Catarina, NL
function loadWeather() {
    const API_KEY = "b49eaec69f9202b0591d390ce65bb497"; // Tu API key
    
    // Usando "Santa Catarina, MX" o "Santa Catarina, NL" - probemos ambas
    const urls = [
        `https://api.openweathermap.org/data/2.5/weather?q=Santa Catarina,NL,mx&units=metric&appid=${API_KEY}&lang=es`,
        `https://api.openweathermap.org/data/2.5/weather?q=Santa Catarina,mx&units=metric&appid=${API_KEY}&lang=es`,
        `https://api.openweathermap.org/data/2.5/weather?q=Monterrey,mx&units=metric&appid=${API_KEY}&lang=es` // Como fallback
    ];
    
    let currentIndex = 0;
    
    function tryNextUrl() {
        if (currentIndex >= urls.length) {
            document.getElementById('weatherData').innerHTML = `
                <div style="font-size: 1.1rem;">${formatearFecha()}</div>
                <div style="font-size: 0.9rem; margin-top: 5px;">🌤️ --°C • No disponible</div>
            `;
            return;
        }
        
        fetch(urls[currentIndex])
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ciudad no encontrada');
                }
                return response.json();
            })
            .then(data => {
                if (data.main) {
                    const temp = Math.round(data.main.temp);
                    const descripcion = traducirDescripcion(data.weather[0].description);
                    const weatherEmoji = getWeatherEmoji(data.weather[0].main);
                    
                    document.getElementById('weatherData').innerHTML = `
                        <div style="font-size: 1.1rem;">${formatearFecha()}</div>
                        <div style="font-size: 0.9rem; margin-top: 5px;">${weatherEmoji} ${temp}°C</div>
                        <div style="font-size: 0.8rem; margin-top: 3px; opacity: 0.9;">${descripcion}</div>
                    `;
                } else {
                    throw new Error('Datos incompletos');
                }
            })
            .catch(error => {
                console.error('Error al cargar clima:', error);
                currentIndex++;
                tryNextUrl(); // Intentar siguiente URL
            });
    }
    
    tryNextUrl();
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadWeather();
    
    console.log('Home Dashboard inicializado correctamente');
});
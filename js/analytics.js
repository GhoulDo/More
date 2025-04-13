// Módulo para gestionar el seguimiento y análisis de usuarios

// Sistema mejorado de seguimiento de intentos de login
export function logLoginAttempt(nickname1, nickname2, success) {
    try {
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
        
        return true;
    } catch (error) {
        console.error("Error al registrar intento de login:", error);
        return false;
    }
}

// Registro de interacciones con páginas
export function logPageVisit(pageName) {
    try {
        // Obtener registros existentes o inicializar un objeto vacío
        let pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
        
        // Obtener la página actual si no se proporciona
        if (!pageName) {
            pageName = window.location.pathname.split("/").pop() || 'index.html';
        }
        
        // Si no hay entrada para esta página, inicializarla
        if (!pageVisits[pageName]) {
            pageVisits[pageName] = [];
        }
        
        // Generar huella digital única para identificar dispositivos
        const fingerprint = generateDeviceFingerprint();
        
        // Añadir nueva visita con timestamp
        const visitRecord = {
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            sessionId: sessionStorage.getItem('loginTime') || 'desconocido',
            fingerprint: fingerprint
        };
        
        pageVisits[pageName].push(visitRecord);
        
        // Limitar el número de registros por página (mantener solo las últimas 50)
        if (pageVisits[pageName].length > 50) {
            pageVisits[pageName] = pageVisits[pageName].slice(-50);
        }
        
        // Guardar de vuelta en localStorage
        localStorage.setItem('pageVisits', JSON.stringify(pageVisits));
        
        return true;
    } catch (error) {
        console.error("Error al registrar visita de página:", error);
        return false;
    }
}

// Registro de interacciones con el corazón
export function logHeartInteraction(action) {
    try {
        // Obtener registros existentes o inicializar un array vacío
        let heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        
        // Generar huella digital única para identificar dispositivos
        const fingerprint = generateDeviceFingerprint();
        
        // Recopilar datos del dispositivo
        const deviceData = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            vendor: navigator.vendor,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset()
        };
        
        // Crear el objeto de interacción base
        const interaction = {
            timestamp: new Date().toISOString(),
            action: action,
            sessionId: sessionStorage.getItem('loginTime') || 'desconocido',
            fingerprint: fingerprint,
            device: deviceData,
            location: 'pendiente'
        };
        
        // Añadir la interacción a la lista
        heartInteractions.push(interaction);
        
        // Limitar el número de registros (mantener solo los últimos 50)
        if (heartInteractions.length > 50) {
            heartInteractions = heartInteractions.slice(-50);
        }
        
        // Guardar en localStorage
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
        
        // Crear un índice para esta interacción
        const interactionIndex = heartInteractions.length - 1;
        
        // Intentar obtener información de ubicación
        fetchHeartLocationData(interactionIndex);
        
        return true;
    } catch (error) {
        console.error("Error al registrar interacción con el corazón:", error);
        return false;
    }
}

// Generar una huella digital del dispositivo
function generateDeviceFingerprint() {
    try {
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
    } catch (e) {
        // En caso de error, devolver un valor aleatorio
        return Math.random().toString(16).substring(2, 12);
    }
}

// Función mejorada para obtener ubicación con múltiples fuentes para login
function fetchLocationData(attemptIndex, success) {
    try {
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
                
            // Servicio 2: geolocation-db.com (sin límite de peticiones)
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
            updateLoginLocationData(attemptIndex, locationData);
            
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
                        updateLoginPreciseLocation(attemptIndex, preciseLocation);
                    },
                    function(error) {
                        console.log("Geolocalización denegada o no disponible:", error.message);
                        updateLoginLocationError(attemptIndex, "Permiso denegado o error: " + error.message);
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
                updateLoginLocationData(attemptIndex, {
                    source: 'ipify.org',
                    ip: data.ip
                });
            })
            .catch(err => {
                updateLoginLocationError(attemptIndex, "No se pudo obtener ubicación");
            });
        });
    } catch (error) {
        console.error("Error en fetchLocationData:", error);
    }
}

// Función para obtener ubicación de interacciones con el corazón
function fetchHeartLocationData(interactionIndex) {
    try {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[interactionIndex]) return;
        
        // Similar a fetchLocationData pero para heartInteractions
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
                        latitude: data.latitude,
                        longitude: data.longitude
                    };
                }),
                
            // Servicio 2: geolocation-db.com
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
            // Actualizar el registro con los datos
            updateHeartLocationData(interactionIndex, locationData);
        })
        .catch(error => {
            // Si fallan todos los servicios, intentar con un servicio de backup
            fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                updateHeartLocationData(interactionIndex, {
                    source: 'ipify.org',
                    ip: data.ip
                });
            })
            .catch(err => {
                updateHeartLocationError(interactionIndex, "No se pudo obtener ubicación");
            });
        });
    } catch (error) {
        console.error("Error en fetchHeartLocationData:", error);
    }
}

// Funciones de actualización para login
function updateLoginLocationData(index, locationData) {
    try {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        loginAttempts[index].location = locationData;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    } catch (error) {
        console.error("Error al actualizar datos de ubicación:", error);
    }
}

function updateLoginPreciseLocation(index, preciseLocation) {
    try {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        loginAttempts[index].preciseLocation = preciseLocation;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    } catch (error) {
        console.error("Error al actualizar ubicación precisa:", error);
    }
}

function updateLoginLocationError(index, errorMessage) {
    try {
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        if (!loginAttempts[index]) return;
        
        if (!loginAttempts[index].location || loginAttempts[index].location === 'pendiente') {
            loginAttempts[index].location = { error: errorMessage };
        } else {
            loginAttempts[index].location.error = errorMessage;
        }
        
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
    } catch (error) {
        console.error("Error al registrar error de ubicación:", error);
    }
}

// Funciones para actualizar interacciones con el corazón
function updateHeartLocationData(index, locationData) {
    try {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[index]) return;
        
        heartInteractions[index].location = locationData;
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
    } catch (error) {
        console.error("Error al actualizar datos de ubicación del corazón:", error);
    }
}

function updateHeartLocationError(index, errorMessage) {
    try {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[index]) return;
        
        if (!heartInteractions[index].location || heartInteractions[index].location === 'pendiente') {
            heartInteractions[index].location = { error: errorMessage };
        } else {
            heartInteractions[index].location.error = errorMessage;
        }
        
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
    } catch (error) {
        console.error("Error al registrar error de ubicación del corazón:", error);
    }
}

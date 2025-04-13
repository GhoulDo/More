document.addEventListener('DOMContentLoaded', function() {
    // Crear partículas para la animación del corazón
    const particlesContainer = document.getElementById('heart-particles');
    const replayButton = document.getElementById('replay-animation');
    
    // Registrar interacción con la animación del corazón
    function logHeartInteraction(action) {
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
            timezoneOffset: new Date().getTimezoneOffset(),
            colorDepth: window.screen.colorDepth,
            devicePixelRatio: window.devicePixelRatio || 1
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
        
        // Intentar obtener información de ubicación utilizando múltiples métodos
        fetchLocationData(interactionIndex);
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
    function fetchLocationData(interactionIndex) {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[interactionIndex]) return;
        
        // Intentar con múltiples servicios de geolocalización IP
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
            // Actualizar el registro con los datos de ubicación
            updateLocationData(interactionIndex, locationData);
            
            // También intentamos obtener la geolocalización del navegador si está disponible
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        // Si tenemos éxito, actualizar con la ubicación precisa
                        const preciseLocation = {
                            source: 'browser-geolocation',
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: position.timestamp
                        };
                        
                        // Añadir esta información a la ubicación existente
                        updatePreciseLocation(interactionIndex, preciseLocation);
                    },
                    function(error) {
                        // Registrar que el usuario denegó el permiso
                        console.log("Geolocalización denegada:", error.message);
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        })
        .catch(error => {
            // Si fallan todos los servicios, intentar con un servicio de backup
            fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => {
                updateLocationData(interactionIndex, {
                    source: 'ipify.org',
                    ip: data.ip
                });
            })
            .catch(err => {
                updateLocationError(interactionIndex, "No se pudo obtener ubicación");
            });
        });
    }
    
    // Actualizar datos de ubicación en el registro
    function updateLocationData(index, locationData) {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[index]) return;
        
        heartInteractions[index].location = locationData;
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
    }
    
    // Añadir ubicación precisa al registro
    function updatePreciseLocation(index, preciseLocation) {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[index]) return;
        
        heartInteractions[index].preciseLocation = preciseLocation;
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
    }
    
    // Registrar error de ubicación
    function updateLocationError(index, errorMessage) {
        const heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        if (!heartInteractions[index]) return;
        
        if (!heartInteractions[index].location || heartInteractions[index].location === 'pendiente') {
            heartInteractions[index].location = { error: errorMessage };
        } else {
            heartInteractions[index].location.error = errorMessage;
        }
        
        localStorage.setItem('heartInteractions', JSON.stringify(heartInteractions));
    }
    
    // Función para crear partículas
    function createParticles() {
        // Limpiar partículas existentes
        particlesContainer.innerHTML = '';
        
        // Crear nuevas partículas
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Posición inicial en el centro
            particle.style.top = '50%';
            particle.style.left = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            
            // Color aleatorio entre rosa y morado
            const hue = Math.floor(Math.random() * 40) + 320; // Entre 320 y 360 (rosa a morado)
            const saturation = Math.floor(Math.random() * 30) + 70; // Entre 70% y 100%
            const lightness = Math.floor(Math.random() * 20) + 60; // Entre 60% y 80%
            particle.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Tamaño aleatorio
            const size = Math.random() * 6 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Dirección aleatoria
            const angle = Math.random() * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Establecer las variables CSS para la animación
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            
            // Animación con retraso aleatorio
            const delay = Math.random() * 1 + 2; // Entre 2 y 3 segundos
            const duration = Math.random() * 2 + 2; // Entre 2 y 4 segundos
            
            particle.style.animation = `particle-move ${duration}s forwards ease-out`;
            particle.style.animationDelay = `${delay}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    // Iniciar animación al cargar
    createParticles();
    logHeartInteraction('visualización inicial');
    
    // Reiniciar animación al hacer clic en el botón
    replayButton.addEventListener('click', function() {
        // Reiniciar clases para volver a ejecutar las animaciones
        const heartScene = document.querySelector('.heart-scene');
        const newHeartScene = heartScene.cloneNode(true);
        heartScene.parentNode.replaceChild(newHeartScene, heartScene);
        
        // Volver a crear partículas
        createParticles();
        
        // Registrar la interacción
        logHeartInteraction('replay animation');
        
        // Actualizar la referencia del contenedor de partículas
        const particlesContainer = document.getElementById('heart-particles');
    });
    
    // Observador de Intersección para los elementos del timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    });
    
    timelineItems.forEach(item => {
        observer.observe(item);
    });
});

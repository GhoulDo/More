import { logHeartInteraction } from './analytics.js';

document.addEventListener('DOMContentLoaded', function() {
    // Crear partículas para la animación del corazón
    const particlesContainer = document.getElementById('heart-particles');
    const replayButton = document.getElementById('replay-animation');
    
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

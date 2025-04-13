document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario ya ha iniciado sesión
    const checkLogin = () => {
        // Esta es una implementación simple. En un proyecto real usarías
        // autenticación más segura como cookies o localStorage con tokens
        
        // Si el usuario intenta acceder directamente a las páginas internas sin pasar por login
        if (document.querySelector('.login-page') === null && !sessionStorage.getItem('loggedIn')) {
            // Redireccionar al login
            window.location.href = 'index.html';
        }
    };
    
    // Marcar la navegación activa
    const setActiveNav = () => {
        const currentPage = window.location.pathname.split("/").pop();
        const navLinks = document.querySelectorAll('nav ul li a');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    };
    
    // Añadir efecto de aparición a los elementos
    const addFadeInEffect = () => {
        const fadeElements = document.querySelectorAll('.memory-card, .quote, .project-card, .preview-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        fadeElements.forEach(element => {
            observer.observe(element);
            // Añadir clase para preparar la animación
            element.classList.add('fade-element');
        });
    };
    
    // Nueva función: Registrar visita a la página
    const logPageVisit = () => {
        // Obtener la página actual
        const currentPage = window.location.pathname.split("/").pop() || 'index.html';
        
        // Obtener registros existentes o inicializar un objeto vacío
        let pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
        
        // Si no hay entrada para esta página, inicializarla
        if (!pageVisits[currentPage]) {
            pageVisits[currentPage] = [];
        }
        
        // Añadir nueva visita con timestamp
        pageVisits[currentPage].push({
            timestamp: new Date().toISOString(),
            referrer: document.referrer,
            sessionId: sessionStorage.getItem('loginTime') || 'desconocido'
        });
        
        // Limitar el número de registros por página (mantener solo las últimas 50)
        if (pageVisits[currentPage].length > 50) {
            pageVisits[currentPage] = pageVisits[currentPage].slice(-50);
        }
        
        // Guardar de vuelta en localStorage
        localStorage.setItem('pageVisits', JSON.stringify(pageVisits));
    };
    
    // Inicializar funciones
    checkLogin();
    setActiveNav();
    addFadeInEffect();
    logPageVisit(); // Registrar cada visita a la página
    
    // Añadir botón secreto de administrador
    const addSecretAdminButton = () => {
        // Solo en páginas autorizadas y después de un tiempo aleatorio
        if (Math.random() < 0.2) { // 20% de posibilidad en cada página
            setTimeout(() => {
                const adminLink = document.createElement('a');
                adminLink.href = 'index.html?admin=view';
                adminLink.textContent = '•';
                adminLink.title = 'Panel de Administración';
                adminLink.style.position = 'fixed';
                adminLink.style.bottom = '5px';
                adminLink.style.right = '5px';
                adminLink.style.color = 'rgba(255,255,255,0.05)';
                adminLink.style.textDecoration = 'none';
                document.body.appendChild(adminLink);
            }, 3000 + Math.random() * 5000);
        }
    };
    
    addSecretAdminButton();
    
    // Para páginas específicas, añadir funcionalidades adicionales
    if (document.querySelector('.memories-grid')) {
        // Aquí podrías añadir funcionalidad específica para la página de recuerdos
        // Por ejemplo, un lightbox para ver las imágenes en grande
    }
    
    if (document.querySelector('.quotes-container')) {
        // Funcionalidad específica para la página de frases
        // Por ejemplo, animaciones o desplazamiento automático de citas
    }
});

// Marcar al usuario como logueado cuando viene del login
if (document.referrer.includes('index.html')) {
    sessionStorage.setItem('loggedIn', 'true');
}

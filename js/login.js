// Importar funciones de seguimiento del archivo de analytics.js
import { logLoginAttempt } from './analytics.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    
    // Configura aquí los apodos correctos
    const correctNickname1 = "more"; // Reemplaza "apodo1" por cómo llamabas a tu ex
    const correctNickname2 = "amor"; // Reemplaza "apodo2" por cómo te llamaba tu ex
    
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

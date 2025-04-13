document.addEventListener('DOMContentLoaded', function() {
    const passwordContainer = document.getElementById('passwordContainer');
    const adminPassword = document.getElementById('adminPassword');
    const submitPassword = document.getElementById('submitPassword');
    const refreshStatsButton = document.getElementById('refreshStats');
    const exportStatsButton = document.getElementById('exportStats');
    const clearStatsButton = document.getElementById('clearStats');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const notificationArea = document.getElementById('notificationArea');
    
    // Configuración
    const ADMIN_PASSWORD = "enciso2025";
    let currentFilter = "all";
    let searchTerm = "";
    
    // Verificación de contraseña
    submitPassword.addEventListener('click', function() {
        verifyPassword();
    });
    
    adminPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    function verifyPassword() {
        if (adminPassword.value === ADMIN_PASSWORD) {
            passwordContainer.style.display = 'none';
            loadAllStats();
            showNotification("✅ Acceso concedido. Bienvenido al panel de administración.", "success");
        } else {
            adminPassword.style.borderColor = '#ff80bf';
            adminPassword.value = '';
            adminPassword.placeholder = 'Contraseña incorrecta';
            showNotification("❌ Contraseña incorrecta. Intente nuevamente.", "error");
            setTimeout(() => {
                adminPassword.placeholder = 'Ingresa la contraseña';
            }, 2000);
        }
    }
    
    // Sistema de notificaciones
    function showNotification(message, type) {
        if (!notificationArea) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        notificationArea.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Eliminar después de un tiempo
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Evento para actualizar estadísticas
    if (refreshStatsButton) {
        refreshStatsButton.addEventListener('click', function() {
            loadAllStats();
            showNotification("🔄 Estadísticas actualizadas correctamente.", "info");
        });
    }
    
    // Evento para exportar estadísticas
    if (exportStatsButton) {
        exportStatsButton.addEventListener('click', function() {
            exportAllStats();
        });
    }
    
    // Evento para limpiar estadísticas
    if (clearStatsButton) {
        clearStatsButton.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas borrar todas las estadísticas? Esta acción no se puede deshacer.')) {
                clearAllStats();
                showNotification("🗑️ Todas las estadísticas han sido eliminadas.", "warning");
            }
        });
    }
    
    // Eventos para búsqueda y filtrado
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTerm = this.value.toLowerCase();
            loadAllStats(); // Recargar con el nuevo término de búsqueda
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            currentFilter = this.value;
            loadAllStats(); // Recargar con el nuevo filtro
        });
    }
    
    // Cargar todas las estadísticas
    function loadAllStats() {
        try {
            loadLoginAttempts();
            loadPageVisits();
            loadHeartInteractions();
            
            document.getElementById('lastUpdated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
        } catch (error) {
            console.error("Error al cargar estadísticas:", error);
            showNotification("❌ Error al cargar estadísticas: " + error.message, "error");
        }
    }
    
    // Formatear fecha
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (e) {
            return "Fecha inválida";
        }
    }
    
    // Calcular tiempo transcurrido
    function timeAgo(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now - date) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " años atrás";
            
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " meses atrás";
            
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " días atrás";
            
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " horas atrás";
            
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " minutos atrás";
            
            return "justo ahora";
        } catch (e) {
            return "tiempo desconocido";
        }
    }
    
    // Cargar intentos de login
    function loadLoginAttempts() {
        const container = document.getElementById('loginAttemptsContainer');
        if (!container) return;
        
        let loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
        
        // Aplicar filtro
        if (currentFilter === "success") {
            loginAttempts = loginAttempts.filter(attempt => attempt.success);
        } else if (currentFilter === "failure") {
            loginAttempts = loginAttempts.filter(attempt => !attempt.success);
        } else if (currentFilter === "likely") {
            loginAttempts = loginAttempts.filter(attempt => isProbablyTargetPerson(attempt));
        }
        
        // Aplicar búsqueda
        if (searchTerm) {
            loginAttempts = loginAttempts.filter(attempt => 
                attempt.nickname1.toLowerCase().includes(searchTerm) || 
                attempt.nickname2.toLowerCase().includes(searchTerm) ||
                (attempt.location && attempt.location.city && 
                 attempt.location.city.toLowerCase().includes(searchTerm))
            );
        }
        
        // Actualizar contadores
        document.getElementById('loginAttemptsCount').textContent = loginAttempts.length;
        document.getElementById('successfulLoginsCount').textContent = loginAttempts.filter(a => a.success).length;
        document.getElementById('likelyPersonCount').textContent = loginAttempts.filter(a => isProbablyTargetPerson(a)).length;
        
        if (loginAttempts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ghost"></i>
                    <p>No hay datos que mostrar${searchTerm ? ' para esta búsqueda' : ''}.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Primer Apodo</th>
                        <th>Segundo Apodo</th>
                        <th>Resultado</th>
                        <th>Ubicación</th>
                        <th>Dispositivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Mostrar los intentos más recientes primero
        loginAttempts.slice().reverse().forEach((attempt, index) => {
            // Determinar si podría ser la persona buscada
            const isProbablyHer = isProbablyTargetPerson(attempt);
            
            // Marcar la fila si es probable que sea ella
            const rowClass = isProbablyHer ? 
                `${attempt.success ? 'login-attempt-success' : 'login-attempt-failure'} highlight` : 
                `${attempt.success ? 'login-attempt-success' : 'login-attempt-failure'}`;
            
            const attemptId = `attempt-${index}`;
            
            html += `
                <tr class="${rowClass}" data-attempt="${index}" id="${attemptId}-row">
                    <td>${formatDate(attempt.timestamp)}</td>
                    <td>${escapeHTML(attempt.nickname1)}</td>
                    <td>${escapeHTML(attempt.nickname2)}</td>
                    <td class="${attempt.success ? 'success' : 'failure'}">
                        <i class="fas ${attempt.success ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${attempt.success ? 'Exitoso' : 'Fallido'}
                    </td>
                    <td>${formatLocationCell(attempt, `loc-${index}`)}</td>
                    <td>${formatDeviceCell(attempt, `dev-${index}`)}</td>
                    <td>
                        <button class="admin-btn" onclick="showDetailedView('${attemptId}')">
                            <i class="fas fa-search"></i>
                        </button>
                    </td>
                </tr>
                <tr style="display: none;" id="${attemptId}-details">
                    <td colspan="7">
                        <div class="attempt-detail-panel" id="${attemptId}-panel">
                            <div class="detail-tabs">
                                <div class="detail-tab active" onclick="switchDetailTab('${attemptId}', 'overview')">Resumen</div>
                                <div class="detail-tab" onclick="switchDetailTab('${attemptId}', 'location')">Ubicación</div>
                                <div class="detail-tab" onclick="switchDetailTab('${attemptId}', 'device')">Dispositivo</div>
                                <div class="detail-tab" onclick="switchDetailTab('${attemptId}', 'raw')">Datos Brutos</div>
                            </div>
                            
                            <div id="${attemptId}-overview" class="detail-content active">
                                <h4>Resumen del Intento</h4>
                                <p>Realizado el ${formatDate(attempt.timestamp)}</p>
                                <div class="location-detail">
                                    ${getQuickLocationSummary(attempt)}
                                </div>
                                <div class="fingerprint-info">
                                    <p>Huella digital: <span class="fingerprint-tag">${attempt.fingerprint || 'No disponible'}</span></p>
                                    <p>Probabilidad de ser la persona buscada: ${isProbablyHer ? '<span style="color: #ff80bf;">Alta</span>' : '<span style="color: #aaa;">Baja</span>'}</p>
                                </div>
                            </div>
                            
                            <div id="${attemptId}-location" class="detail-content">
                                <h4>Información de Ubicación</h4>
                                ${getDetailedLocationInfo(attempt)}
                            </div>
                            
                            <div id="${attemptId}-device" class="detail-content">
                                <h4>Información del Dispositivo</h4>
                                ${getDetailedDeviceInfo(attempt)}
                            </div>
                            
                            <div id="${attemptId}-raw" class="detail-content">
                                <h4>Datos JSON</h4>
                                <pre class="json-data">${JSON.stringify(attempt, null, 2)}</pre>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    // Cargar visitas por página
    function loadPageVisits() {
        const container = document.getElementById('pageVisitsContainer');
        if (!container) return;
        
        const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
        
        let totalVisits = 0;
        Object.values(pageVisits).forEach(visits => {
            totalVisits += visits.length;
        });
        
        document.getElementById('pageVisitsCount').textContent = totalVisits;
        
        if (totalVisits === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ghost"></i>
                    <p>No se han registrado visitas a las páginas.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        html += `
            <div class="counter-grid">
        `;
        
        Object.keys(pageVisits).forEach(page => {
            let visitCount = pageVisits[page].length;
            const icon = getPageIcon(page);
            
            // Aplicar filtro si es necesario
            if (searchTerm) {
                visitCount = pageVisits[page].filter(visit => 
                    visit.referrer && visit.referrer.toLowerCase().includes(searchTerm)
                ).length;
            }
            
            html += `
                <div class="counter-box">
                    <div class="counter-label">
                        <i class="${icon}"></i> ${getPageName(page)}
                    </div>
                    <div class="counter-value">${visitCount}</div>
                </div>
            `;
        });
        
        html += `
            </div>
            <h4>Historial de visitas recientes</h4>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Página</th>
                        <th>Referencia</th>
                        <th>Huella Digital</th>
                        <th>Tiempo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let allVisits = [];
        Object.keys(pageVisits).forEach(page => {
            pageVisits[page].forEach(visit => {
                allVisits.push({
                    page: page,
                    ...visit
                });
            });
        });
        
        // Filtrar si es necesario
        if (searchTerm) {
            allVisits = allVisits.filter(visit => 
                visit.page.toLowerCase().includes(searchTerm) || 
                (visit.referrer && visit.referrer.toLowerCase().includes(searchTerm)) ||
                (visit.fingerprint && visit.fingerprint.toLowerCase().includes(searchTerm))
            );
        }
        
        // Ordenar por fecha, más reciente primero
        allVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Mostrar las 20 visitas más recientes
        allVisits.slice(0, 20).forEach(visit => {
            html += `
                <tr>
                    <td>${formatDate(visit.timestamp)}</td>
                    <td><i class="${getPageIcon(visit.page)}"></i> ${getPageName(visit.page)}</td>
                    <td>${visit.referrer || 'Directa'}</td>
                    <td><span class="fingerprint-tag">${visit.fingerprint || 'No disponible'}</span></td>
                    <td><span class="time-ago">${timeAgo(visit.timestamp)}</span></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    // Cargar interacciones con el corazón
    function loadHeartInteractions() {
        const container = document.getElementById('heartInteractionsContainer');
        if (!container) return;
        
        let heartInteractions = JSON.parse(localStorage.getItem('heartInteractions') || '[]');
        
        // Aplicar filtro si es necesario
        if (searchTerm) {
            heartInteractions = heartInteractions.filter(interaction => 
                interaction.action.toLowerCase().includes(searchTerm) || 
                (interaction.sessionId && interaction.sessionId.toLowerCase().includes(searchTerm)) ||
                (interaction.fingerprint && interaction.fingerprint.toLowerCase().includes(searchTerm))
            );
        }
        
        document.getElementById('heartInteractionsCount').textContent = heartInteractions.length;
        
        if (heartInteractions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ghost"></i>
                    <p>No se han registrado interacciones con la animación del corazón.</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Acción</th>
                        <th>ID de Sesión</th>
                        <th>Huella Digital</th>
                        <th>Ubicación</th>
                        <th>Tiempo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Mostrar las interacciones más recientes primero
        heartInteractions.slice().reverse().forEach((interaction, index) => {
            html += `
                <tr>
                    <td>${formatDate(interaction.timestamp)}</td>
                    <td>
                        <i class="fas ${interaction.action === 'replay animation' ? 'fa-redo-alt' : 'fa-eye'}"></i> 
                        ${interaction.action}
                    </td>
                    <td>${interaction.sessionId}</td>
                    <td><span class="fingerprint-tag">${interaction.fingerprint || 'No disponible'}</span></td>
                    <td>${formatSimpleLocation(interaction, `heart-${index}`)}</td>
                    <td><span class="time-ago">${timeAgo(interaction.timestamp)}</span></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    }
    
    // Formatear celda de ubicación simple para interacciones
    function formatSimpleLocation(interaction, id) {
        if (!interaction.location || interaction.location === 'pendiente') {
            return `<span class="location-status location-pending">
                    <i class="fas fa-spinner"></i> Pendiente
                </span>`;
        }
        
        if (interaction.location.error) {
            return `<span class="location-status location-error">
                    <i class="fas fa-exclamation-triangle"></i> Error
                </span>`;
        }
        
        if (interaction.location.city) {
            return `<span class="location-status location-success">
                    <i class="fas fa-map-marker-alt"></i> ${interaction.location.city}
                </span>`;
        }
        
        if (interaction.location.ip) {
            return `<span class="location-status">
                    <i class="fas fa-globe"></i> IP registrada
                </span>`;
        }
        
        return `<span class="location-status">
                <i class="fas fa-question-circle"></i> Limitado
            </span>`;
    }
    
    // Funciones para determinar si es probablemente la persona buscada
    function isProbablyTargetPerson(attempt) {
        if (!attempt) return false;
        
        // Comprobar patrones en los apodos (adaptado para "more" y "amor")
        const nicknameMatch = (
            attempt.nickname1.toLowerCase().includes("mo") || 
            attempt.nickname2.toLowerCase().includes("am")
        );
        
        // Comprobar si ya ha intentado antes desde el mismo dispositivo
        let deviceMatch = false;
        if (attempt.fingerprint) {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
            const sameDeviceAttempts = attempts.filter(a => 
                a.fingerprint === attempt.fingerprint && 
                a.timestamp !== attempt.timestamp
            );
            deviceMatch = sameDeviceAttempts.length > 0;
        }
        
        // Comprobar la ubicación para ver si coincide con lugares frecuentados anteriormente
        let locationMatch = false;
        if (attempt.location && attempt.location.city) {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
            const successfulAttempts = attempts.filter(a => a.success);
            
            for (const successAttempt of successfulAttempts) {
                if (successAttempt.location && successAttempt.location.city === attempt.location.city) {
                    locationMatch = true;
                    break;
                }
            }
        }
        
        // Combinar factores para determinar probabilidad
        return nicknameMatch || (deviceMatch && locationMatch);
    }
    
    // Formatear celda de ubicación
    function formatLocationCell(attempt, id) {
        let html = '';
        
        if (!attempt.location || attempt.location === 'pendiente') {
            html += `
                <span class="location-status location-pending">
                    <i class="fas fa-spinner"></i> Pendiente
                </span>
            `;
        } else if (attempt.location.error) {
            html += `
                <span class="location-status location-error">
                    <i class="fas fa-exclamation-triangle"></i> Error
                </span>
            `;
        } else {
            // Determinar qué información de ubicación mostrar
            if (attempt.location.city) {
                html += `
                    <button class="location-btn" onclick="toggleLocationData('${id}')">
                        <i class="fas fa-map-marker-alt"></i> 
                        ${attempt.location.city}, ${attempt.location.country || ''}
                    </button>
                    <div id="${id}" class="location-data" style="display: none;">
                        ${attempt.location.ip ? 
                          `<div class="ip-info"><span><i class="fas fa-globe"></i> IP: ${attempt.location.ip}</span></div>` : ''}
                        <div>
                            <i class="fas fa-map-pin"></i> 
                            ${attempt.location.city}, ${attempt.location.region || ''}, ${attempt.location.country || ''}
                            ${attempt.location.latitude ? 
                                `<a href="https://www.google.com/maps?q=${attempt.location.latitude},${attempt.location.longitude}" 
                                target="_blank" class="maps-link">
                                <i class="fas fa-external-link-alt"></i> Ver en mapa</a>` 
                                : ''}
                        </div>
                        ${attempt.location.isp ? 
                          `<div><i class="fas fa-building"></i> ISP: ${attempt.location.isp}</div>` : ''}
                    </div>
                `;
            } else if (attempt.location.ip) {
                html += `
                    <div class="ip-info">
                        <i class="fas fa-globe"></i> IP: ${attempt.location.ip}
                    </div>
                `;
            } else if (attempt.location.latitude) {
                html += `
                    <button class="location-btn" onclick="toggleLocationData('${id}')">
                        <i class="fas fa-map-marker-alt"></i> Ubicación GPS
                    </button>
                    <div id="${id}" class="location-data" style="display: none;">
                        <div>
                            <i class="fas fa-map-pin"></i> 
                            Lat: ${attempt.location.latitude.toFixed(6)}, 
                            Lng: ${attempt.location.longitude.toFixed(6)}
                            <a href="https://www.google.com/maps?q=${attempt.location.latitude},${attempt.location.longitude}" 
                            target="_blank" class="maps-link">
                            <i class="fas fa-external-link-alt"></i> Ver en mapa</a>
                        </div>
                        ${attempt.location.accuracy ? 
                          `<div><i class="fas fa-crosshairs"></i> Precisión: ±${Math.round(attempt.location.accuracy)}m</div>` : ''}
                    </div>
                `;
            } else {
                html += `<span>Información limitada</span>`;
            }
        }
        
        return html;
    }
    
    // Formatear celda de dispositivo
    function formatDeviceCell(attempt, id) {
        let html = '';
        
        if (attempt.device) {
            const deviceType = detectDeviceType(attempt.device.userAgent);
            const icon = getDeviceIcon(deviceType);
            
            html += `
                <div>
                    <i class="${icon}"></i> ${deviceType}
                    <button class="expand-btn" onclick="toggleDeviceData('${id}')">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <div id="${id}" class="device-info" style="display: none;">
                    ${attempt.device.platform ? `<div class="device-tag">${attempt.device.platform}</div>` : ''}
                    ${attempt.device.screenSize ? `<div class="device-tag">${attempt.device.screenSize}</div>` : ''}
                    ${attempt.device.timezone ? `<div class="device-tag">${attempt.device.timezone}</div>` : ''}
                    ${attempt.device.userAgent ? `<div class="user-agent">${truncateUserAgent(attempt.device.userAgent)}</div>` : ''}
                </div>
            `;
        } else {
            html += `<span>No disponible</span>`;
        }
        
        return html;
    }
    
    // Obtener resumen rápido de ubicación para el panel de detalles
    function getQuickLocationSummary(attempt) {
        if (!attempt.location || attempt.location === 'pendiente') {
            return `<div class="detail-item"><i class="fas fa-map-marker-alt"></i> Ubicación no disponible</div>`;
        }
        
        let summary = '';
        
        if (attempt.location.city) {
            summary += `<div class="detail-item"><i class="fas fa-city"></i> ${attempt.location.city}, ${attempt.location.country || ''}</div>`;
        }
        
        if (attempt.location.ip) {
            summary += `<div class="detail-item"><i class="fas fa-globe"></i> IP: ${attempt.location.ip}</div>`;
        }
        
        if (attempt.device) {
            const deviceType = detectDeviceType(attempt.device.userAgent);
            summary += `<div class="detail-item"><i class="${getDeviceIcon(deviceType)}"></i> ${deviceType}</div>`;
        }
        
        return summary || `<div class="detail-item"><i class="fas fa-question-circle"></i> Información limitada</div>`;
    }
    
    // Obtener información detallada de ubicación para el panel
    function getDetailedLocationInfo(attempt) {
        if (!attempt.location || attempt.location === 'pendiente') {
            return `<p>No hay información de ubicación disponible.</p>`;
        }
        
        if (attempt.location.error) {
            return `<p>Error al obtener ubicación: ${attempt.location.error}</p>`;
        }
        
        let html = '<div class="location-detail">';
        
        // Información basada en IP
        if (attempt.location.ip) {
            html += `
                <div class="detail-item"><i class="fas fa-globe"></i> IP: ${attempt.location.ip}</div>
            `;
            
            if (attempt.location.city) {
                html += `
                    <div class="detail-item"><i class="fas fa-city"></i> Ciudad: ${attempt.location.city}</div>
                    <div class="detail-item"><i class="fas fa-map"></i> Región: ${attempt.location.region || 'N/A'}</div>
                    <div class="detail-item"><i class="fas fa-flag"></i> País: ${attempt.location.country || 'N/A'}</div>
                `;
            }
            
            if (attempt.location.isp) {
                html += `<div class="detail-item"><i class="fas fa-building"></i> ISP: ${attempt.location.isp}</div>`;
            }
        }
        
        // Información basada en GPS
        if (attempt.location.latitude) {
            html += `
                <div class="detail-item"><i class="fas fa-map-pin"></i> Coordenadas: ${attempt.location.latitude.toFixed(6)}, ${attempt.location.longitude.toFixed(6)}</div>
            `;
            
            if (attempt.location.accuracy) {
                html += `<div class="detail-item"><i class="fas fa-crosshairs"></i> Precisión: ±${Math.round(attempt.location.accuracy)}m</div>`;
            }
            
            html += `
                <div class="map-container">
                    <a href="https://www.google.com/maps?q=${attempt.location.latitude},${attempt.location.longitude}" 
                       target="_blank" class="btn-link">
                       <i class="fas fa-map"></i> Ver en Google Maps
                    </a>
                </div>
            `;
        }
        
        html += '</div>';
        
        return html;
    }
    
    // Obtener información detallada del dispositivo para el panel
    function getDetailedDeviceInfo(attempt) {
        if (!attempt.device) {
            return `<p>No hay información del dispositivo disponible.</p>`;
        }
        
        const deviceType = detectDeviceType(attempt.device.userAgent);
        
        let html = `
            <div class="device-info">
                <h5><i class="${getDeviceIcon(deviceType)}"></i> ${deviceType}</h5>
                <div class="location-detail">
        `;
        
        if (attempt.device.platform) {
            html += `<div class="detail-item"><i class="fas fa-laptop"></i> Sistema: ${attempt.device.platform}</div>`;
        }
        
        if (attempt.device.screenSize) {
            html += `<div class="detail-item"><i class="fas fa-desktop"></i> Pantalla: ${attempt.device.screenSize}</div>`;
        }
        
        if (attempt.device.windowSize) {
            html += `<div class="detail-item"><i class="fas fa-window-restore"></i> Ventana: ${attempt.device.windowSize}</div>`;
        }
        
        if (attempt.device.timezone) {
            html += `<div class="detail-item"><i class="fas fa-clock"></i> Zona horaria: ${attempt.device.timezone}</div>`;
        }
        
        if (attempt.device.language) {
            html += `<div class="detail-item"><i class="fas fa-language"></i> Idioma: ${attempt.device.language}</div>`;
        }
        
        html += `
                </div>
                <div class="fingerprint-info">
                    ${attempt.fingerprint ? `<p>Huella digital: <span class="fingerprint-tag">${attempt.fingerprint}</span></p>` : ''}
                </div>
                <div style="margin-top: 15px;">
                    <h5>User Agent</h5>
                    <div class="user-agent-box">
                        ${attempt.device.userAgent || 'No disponible'}
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Funciones auxiliares para detectar el tipo de dispositivo
    function detectDeviceType(userAgent) {
        if (!userAgent) return "Desconocido";
        
        const ua = userAgent.toLowerCase();
        if (ua.includes("iphone") || ua.includes("ipod")) return "iPhone";
        if (ua.includes("ipad")) return "iPad";
        if (ua.includes("android") && ua.includes("mobile")) return "Android Phone";
        if (ua.includes("android") && !ua.includes("mobile")) return "Android Tablet";
        if (ua.includes("windows phone")) return "Windows Phone";
        if (ua.includes("macintosh") || ua.includes("mac os")) return "Mac";
        if (ua.includes("windows")) return "Windows";
        if (ua.includes("linux")) return "Linux";
        return "Desconocido";
    }
    
    function getDeviceIcon(deviceType) {
        switch (deviceType) {
            case "iPhone": return "fas fa-mobile-alt";
            case "iPad": return "fas fa-tablet-alt";
            case "Android Phone": return "fab fa-android";
            case "Android Tablet": return "fab fa-android";
            case "Windows Phone": return "fab fa-windows";
            case "Mac": return "fab fa-apple";
            case "Windows": return "fab fa-windows";
            case "Linux": return "fab fa-linux";
            default: return "fas fa-desktop";
        }
    }
    
    function truncateUserAgent(ua) {
        return ua.length > 70 ? ua.substring(0, 70) + '...' : ua;
    }
    
    // Obtener icono para páginas
    function getPageIcon(page) {
        const icons = {
            'index.html': 'fas fa-sign-in-alt',
            'home.html': 'fas fa-home',
            'recuerdos.html': 'fas fa-camera-retro',
            'frases.html': 'fas fa-quote-left',
            'proyectos.html': 'fas fa-project-diagram',
            'carta.html': 'fas fa-envelope',
            'ultimas-palabras.html': 'fas fa-heartbeat',
            'admin.html': 'fas fa-shield-alt'
        };
        
        return icons[page] || 'fas fa-file';
    }
    
    // Obtener nombre para páginas
    function getPageName(page) {
        const names = {
            'index.html': 'Login',
            'home.html': 'Inicio',
            'recuerdos.html': 'Recuerdos',
            'frases.html': 'Frases',
            'proyectos.html': 'Proyectos',
            'carta.html': 'Carta',
            'ultimas-palabras.html': 'Últimas Palabras',
            'admin.html': 'Administración'
        };
        
        return names[page] || page;
    }
    
    // Exportar todas las estadísticas
    function exportAllStats() {
        const data = {
            loginAttempts: JSON.parse(localStorage.getItem('loginAttempts') || '[]'),
            pageVisits: JSON.parse(localStorage.getItem('pageVisits') || '{}'),
            heartInteractions: JSON.parse(localStorage.getItem('heartInteractions') || '[]'),
            exportDate: new Date().toISOString(),
            exportVersion: '1.1'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.download = 'estadisticas-visitas-' + new Date().toISOString().split('T')[0] + '.json';
        a.href = url;
        a.click();
        
        URL.revokeObjectURL(url);
        
        showNotification("📊 Datos exportados correctamente.", "success");
    }
    
    // Limpiar todas las estadísticas
    function clearAllStats() {
        // Hacer una copia de seguridad antes de borrar
        const backupData = {
            loginAttempts: JSON.parse(localStorage.getItem('loginAttempts') || '[]'),
            pageVisits: JSON.parse(localStorage.getItem('pageVisits') || '{}'),
            heartInteractions: JSON.parse(localStorage.getItem('heartInteractions') || '[]'),
            backupDate: new Date().toISOString()
        };
        
        localStorage.setItem('statsBackup', JSON.stringify(backupData));
        
        // Borrar los datos
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('pageVisits');
        localStorage.removeItem('heartInteractions');
        
        // Recargar estadísticas
        loadAllStats();
    }
    
    // Función de seguridad para escapar HTML
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Exponer funciones necesarias globalmente
    window.showDetailedView = function(attemptId) {
        const detailsRow = document.getElementById(`${attemptId}-details`);
        const detailsPanel = document.getElementById(`${attemptId}-panel`);
        
        if (detailsRow.style.display === 'none') {
            // Ocultar cualquier otro panel que esté abierto
            document.querySelectorAll('[id$="-details"]').forEach(row => {
                if (row.id !== `${attemptId}-details`) row.style.display = 'none';
            });
            
            detailsRow.style.display = '';
            detailsPanel.style.display = 'block';
        } else {
            detailsRow.style.display = 'none';
        }
    };
    
    window.switchDetailTab = function(attemptId, tab) {
        // Desactivar todas las pestañas
        document.querySelectorAll(`#${attemptId}-panel .detail-tab`).forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Ocultar todos los contenidos
        document.querySelectorAll(`#${attemptId}-panel .detail-content`).forEach(content => {
            content.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        document.querySelector(`.detail-tab[onclick="switchDetailTab('${attemptId}', '${tab}')"]`).classList.add('active');
        
        // Mostrar el contenido seleccionado
        document.getElementById(`${attemptId}-${tab}`).classList.add('active');
    };
    
    window.toggleLocationData = function(id) {
        const element = document.getElementById(id);
        if (element.style.display === 'none') {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    };
    
    window.toggleDeviceData = function(id) {
        const element = document.getElementById(id);
        if (element.style.display === 'none') {
            element.style.display = 'block';
            element.previousElementSibling.querySelector('.expand-btn i').className = 'fas fa-chevron-up';
        } else {
            element.style.display = 'none';
            element.previousElementSibling.querySelector('.expand-btn i').className = 'fas fa-chevron-down';
        }
    };
});

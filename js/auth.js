// Variable para almacenar el estado de autenticación
let currentUser = null;

// Función para manejar el estado de autenticación
function setAuthState(isAuthenticated, userData = null) {
    console.log('setAuthState llamado con:', { isAuthenticated, userData });
    
    if (isAuthenticated && userData) {
        currentUser = userData;
        // Guardar en localStorage para persistencia entre páginas
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Disparar un evento personalizado cuando el estado de autenticación cambia
        const authEvent = new CustomEvent('authStateChanged', { 
            detail: { isAuthenticated: true, user: userData } 
        });
        window.dispatchEvent(authEvent);
        
        // Actualizar la interfaz de usuario
        updateUserProfileUI(userData);
    } else {
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Disparar un evento personalizado cuando el usuario cierra sesión
        const authEvent = new CustomEvent('authStateChanged', { 
            detail: { isAuthenticated: false, user: null } 
        });
        window.dispatchEvent(authEvent);
    }
    
    // Actualizar la interfaz de usuario en todas las páginas
    updateAuthUI(isAuthenticated);
    // Actualizar secciones de reseñas en función del estado de autenticación
    updateAllReviewSectionsUI();
}

// Función para actualizar las secciones de reseñas en toda la aplicación
function updateAllReviewSectionsUI() {
    const isAuthenticated = !!getCurrentUser();
    const reviewSections = document.querySelectorAll('.review-section, .reviews-container');
    
    reviewSections.forEach(section => {
        const reviewForm = section.querySelector('.review-form');
        const loginPrompt = section.querySelector('.login-prompt');
        
        if (reviewForm) {
            reviewForm.style.display = isAuthenticated ? 'block' : 'none';
        }
        
        if (loginPrompt) {
            loginPrompt.style.display = isAuthenticated ? 'none' : 'block';
        }
        
        // Actualizar botones de acción en reseñas existentes
        const reviewActions = section.querySelectorAll('.review-actions');
        reviewActions.forEach(actions => {
            actions.style.display = isAuthenticated ? 'block' : 'none';
        });
    });
}

// Función para actualizar la interfaz de usuario según el estado de autenticación
function updateAuthUI(isAuthenticated) {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.getElementById('userProfile');
    const adminPlacesBtn = document.getElementById('adminPlacesBtn');
    
    console.log('Actualizando UI de autenticación. Usuario autenticado:', isAuthenticated);
    
    if (isAuthenticated) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userProfile) userProfile.style.display = 'flex';

        const user = getCurrentUser();
        console.log('Usuario actual:', user);
        const isAdmin = user && (user.role === 'admin' || (user.username && user.username.toLowerCase().includes('admin')) || (user.email && user.email.toLowerCase().includes('admin')));
        console.log('¿Es administrador?', isAdmin);
        
        // Mostrar u ocultar botón de administración
        const adminBtn = document.getElementById('adminBtn');
        console.log('Botón admin encontrado en el DOM:', !!adminBtn);
        
        if (adminBtn) {
            adminBtn.style.display = isAdmin ? 'inline-block' : 'none';
            console.log('Visibilidad del botón admin establecida a:', isAdmin ? 'visible' : 'oculto');
        } else if (isAdmin) {
            console.log('Creando botón de administración...');
            createAdminButton();
        }
        
        if (adminPlacesBtn) {
            adminPlacesBtn.style.display = isAdmin ? 'inline-block' : 'none';
        }
        
        // Cerrar el modal si está abierto
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
        
        console.log('Interfaz actualizada: usuario autenticado');
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'none';
        if (adminPlacesBtn) adminPlacesBtn.style.display = 'none';
        
        // Ocultar botón de administración si existe
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) adminBtn.style.display = 'none';
        
        console.log('Interfaz actualizada: usuario no autenticado');
    }
    
    // Forzar una actualización del perfil de usuario
    const user = getCurrentUser();
    if (user) {
        updateUserProfileUI(user);
        
        // Mostrar el formulario de reseñas si existe
        const reviewForm = document.getElementById('form-reseña');
        const loginRequiredMessage = document.getElementById('login-required-message');
        
        if (reviewForm && loginRequiredMessage) {
            loginRequiredMessage.style.display = 'none';
            reviewForm.style.display = 'block';
            
            // Verificar si ya tiene una reseña
            const existingReview = document.querySelector(`.reseña-tarjeta[data-user-id="${user.id || user._id}"]`);
            if (existingReview) {
                reviewForm.style.display = 'none';
                loginRequiredMessage.innerHTML = '<p>Ya has publicado una reseña. Gracias por compartir tu experiencia.</p>';
                loginRequiredMessage.style.display = 'block';
            }
        }
    } else {
        // Ocultar el formulario de reseñas si el usuario no está autenticado
        const reviewForm = document.getElementById('form-reseña');
        const loginRequiredMessage = document.getElementById('login-required-message');
        
        if (reviewForm && loginRequiredMessage) {
            reviewForm.style.display = 'none';
            loginRequiredMessage.style.display = 'block';
            loginRequiredMessage.innerHTML = '<p>Para publicar una reseña, por favor <a href="#" id="show-login-lugares" class="auth-link u-form-link">inicia sesión</a> o <a href="#" id="show-register-lugares" class="auth-link u-form-link">regístrate</a>.</p>';
            
            // Reasignar los event listeners para los enlaces de autenticación
            const showLogin = document.getElementById('show-login-lugares');
            const showRegister = document.getElementById('show-register-lugares');
            
            if (showLogin) {
                showLogin.onclick = function(e) {
                    e.preventDefault();
                    const modal = document.getElementById('loginModal');
                    if (modal) modal.style.display = 'block';
                };
            }
            
            if (showRegister) {
                showRegister.onclick = function(e) {
                    e.preventDefault();
                    const modal = document.getElementById('loginModal');
                    const registerForm = document.getElementById('registerFormContainer');
                    const loginForm = document.getElementById('loginFormContainer');
                    
                    if (modal && registerForm && loginForm) {
                        modal.style.display = 'block';
                        loginForm.style.display = 'none';
                        registerForm.style.display = 'block';
                    }
                };
            }
        }
    }
}

// Función para crear dinámicamente el botón de administración
function createAdminButton() {
    console.log('Ejecutando createAdminButton...');
    // Verificar si ya existe un botón de administración
    if (document.getElementById('adminBtn')) {
        console.log('El botón admin ya existe, no se creará otro');
        return;
    }
    
    // Verificar si ya existe un botón de administración de lugares y usarlo si está presente
    const adminPlacesBtn = document.getElementById('adminPlacesBtn');
    if (adminPlacesBtn) {
        console.log('Botón de administración de lugares encontrado, no es necesario crear otro');
        return;
    }

    // Crear el botón de administración
    const adminBtn = document.createElement('a');
    adminBtn.id = 'adminBtn';
    adminBtn.href = 'admin-lugares.html';
    adminBtn.className = 'admin-btn';
    adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin';
    adminBtn.style.display = 'inline-block';
    adminBtn.style.marginLeft = '10px';
    adminBtn.style.padding = '8px 15px';
    adminBtn.style.backgroundColor = '#4a6baf';
    adminBtn.style.color = 'white';
    adminBtn.style.borderRadius = '20px';
    adminBtn.style.textDecoration = 'none';
    adminBtn.style.transition = 'all 0.3s ease';
    adminBtn.style.fontSize = '0.9rem';
    adminBtn.style.fontWeight = '500';
    
    // Agregar efecto hover
    adminBtn.onmouseover = function() {
        this.style.backgroundColor = '#3a5a9f';
        this.style.transform = 'translateY(-2px)';
    };
    adminBtn.onmouseout = function() {
        this.style.backgroundColor = '#4a6baf';
        this.style.transform = 'translateY(0)';
    };

    // Intentar encontrar el contenedor de botones de autenticación
    const loginButtonContainer = document.getElementById('loginButtonContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 1. Intentar insertar después del botón de cierre de sesión
    if (logoutBtn && logoutBtn.parentNode) {
        console.log('Insertando botón admin junto al botón de cierre de sesión');
        logoutBtn.parentNode.insertBefore(adminBtn, logoutBtn.nextSibling);
        console.log('Botón admin insertado junto al botón de cierre de sesión');
        return;
    }
    
    // 2. Si no se pudo insertar junto al botón de cierre, buscar el contenedor de botones
    if (loginButtonContainer) {
        console.log('Insertando botón admin en el contenedor de botones de autenticación');
        loginButtonContainer.appendChild(adminBtn);
        return;
    }
    
    // 3. Si hay un botón de login, insertar antes de él
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && loginBtn.parentNode) {
        console.log('Insertando botón admin antes del botón de inicio de sesión');
        loginBtn.parentNode.insertBefore(adminBtn, loginBtn);
        return;
    }
    
    // 4. Buscar la barra de navegación
    const nav = document.querySelector('nav');
    if (nav) {
        console.log('Insertando botón admin en la barra de navegación');
        nav.appendChild(adminBtn);
        return;
    }
    
    // 5. Último recurso: insertar en el header
    const header = document.querySelector('header');
    if (header) {
        console.log('Insertando botón admin en el encabezado');
        header.appendChild(adminBtn);
        return;
    }
    
    // Si no se encontró ningún lugar adecuado, mostrar un error
    console.error('No se pudo encontrar un lugar adecuado para insertar el botón de administración');
}

// Función para actualizar la interfaz del perfil de usuario
function updateUserProfileUI(userData) {
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userProfile) userProfile.style.display = 'flex';
    
    if (userName && userData) {
        // Mostrar las primeras letras del nombre o email
        const displayName = userData.name || userData.email || 'Usuario';
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        userName.textContent = displayName.split(' ')[0]; // Solo el primer nombre
        
        // Si hay un avatar, mostrarlo, de lo contrario mostrar iniciales
        if (userAvatar) {
            if (userData.avatar) {
                userAvatar.src = userData.avatar;
                userAvatar.alt = displayName;
                userAvatar.style.display = 'block';
            } else {
                // Si no hay avatar, mostrar iniciales
                userAvatar.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="32" rx="16" fill="#4a90e2"/>
                        <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
                    </svg>
                `);
            }
        }
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return currentUser !== null || localStorage.getItem('currentUser') !== null;
}

// Función para obtener el usuario actual
function getCurrentUser() {
    // Primero verificar el estado en memoria
    if (currentUser) {
        console.log('Usuario encontrado en memoria:', currentUser);
        return currentUser;
    }
    
    // Si no está en memoria, buscar en localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            console.log('Usuario cargado desde localStorage:', currentUser);
            return currentUser;
        } catch (e) {
            console.error('Error al analizar datos del usuario:', e);
            return null;
        }
    }
    
    console.log('No se encontró usuario autenticado');
    return null;
}

// Configurar el botón de cierre de sesión
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Eliminar cualquier event listener previo para evitar duplicados
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Mostrar confirmación con SweetAlert2
            const result = await Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que deseas cerrar tu sesión?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            });
            
            if (result.isConfirmed) {
                // Cerrar sesión
                setAuthState(false);
                
                // Mostrar mensaje de éxito
                await Swal.fire({
                    icon: 'success',
                    title: 'Sesión cerrada',
                    text: 'Has cerrado sesión correctamente',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Redirigir a la página de inicio si estamos en una página que requiere autenticación
                if (window.location.pathname.includes('perfil.html') || 
                    window.location.pathname.includes('reservas.html')) {
                    window.location.href = '../index.html';
                } else {
                    // Recargar la página para actualizar la interfaz
                    window.location.reload();
                }
            }
        });
    }
}
async function handleReviewSubmission(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        Swal.fire({
            title: 'Inicio de sesión requerido',
            text: 'Debes iniciar sesión para publicar una reseña.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Iniciar sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                const modal = document.getElementById('loginModal');
                if (modal) modal.style.display = 'block';
            }
        });
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    
    // Obtener y validar los valores del formulario
    const rating = formData.get('calificacion') || '3';
    const title = formData.get('titulo')?.toString().trim() || '';
    const comment = formData.get('comentario')?.toString().trim() || '';
    
    console.log('Datos del formulario:', {
        calificacion: rating,
        titulo: title,
        comentario: comment
    });
    
    // Validar campos requeridos
    if (!title) {
        showAlert('error', 'Campo requerido', 'Por favor ingresa un título para tu reseña');
        return;
    }
    
    if (!comment) {
        showAlert('error', 'Campo requerido', 'Por favor ingresa tu comentario');
        return;
    }
    
    // Verificar si ya existe una reseña de este usuario
    const existingReview = document.querySelector(`.reseña-tarjeta[data-user-id="${user.id || user._id}"]`);
    if (existingReview) {
        showAlert('warning', 'Ya publicaste una reseña', 'Solo se permite una reseña por usuario');
        return;
    }

    // Mostrar carga
    const loadingAlert = Swal.fire({
        title: 'Publicando reseña...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Preparar los datos para enviar
        // Determine the experience type based on the current page
        let experience = 'general';
        if (window.location.pathname.includes('lugares.html')) {
            experience = 'lugares';
        } else if (window.location.pathname.includes('gastronomia.html')) {
            experience = 'gastronomia';
        } else if (window.location.pathname.includes('eventos.html')) {
            experience = 'eventos';
        }

        const reviewData = {
            userEmail: user.email,
            userName: user.name || user.username || 'Usuario',
            rating: Math.min(5, Math.max(1, parseInt(rating) || 3)),
            comment: comment,
            experience: experience,
            title: title  // Including title if needed, though not in the server schema
        };
        
        console.log('Enviando reseña al servidor:', JSON.stringify(reviewData, null, 2));

        // Enviar la reseña al servidor
        const response = await fetch('http://localhost:27017/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token || ''}`
            },
            body: JSON.stringify(reviewData)
        });

        const result = await response.json();
        console.log('Respuesta del servidor:', { status: response.status, result });

        if (!response.ok) {
            // Si es un error de "ya existe reseña", mostramos el mensaje específico
            if (result.message && result.message.includes('Ya has enviado una reseña')) {
                throw new Error(result.message);
            }
            // Para otros errores, mostramos un mensaje genérico
            const errorMessage = result.message || result.error || 'Error al publicar la reseña';
            throw new Error(errorMessage);
        }

        // Cerrar el mensaje de carga
        loadingAlert.close();

        // Mostrar mensaje de éxito
        await showAlert('success', '¡Reseña publicada!', 'Gracias por compartir tu experiencia');
        
        // Limpiar el formulario
        form.reset();
        
        // Actualizar la interfaz con la nueva reseña
        const reviewSection = document.querySelector('.grid-reseñas');
        if (reviewSection) {
            const newReview = document.createElement('article');
            newReview.className = 'reseña-tarjeta';
            newReview.dataset.userId = user.id || user._id;
            newReview.dataset.reviewId = result.reviewId || Date.now();
            
            const formattedDate = new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            newReview.innerHTML = `
                <div class="reseña-cabecera">
                    <div class="reseña-avatar">
                        ${user.avatar ? 
                          `<img src="${user.avatar}" alt="${user.name || 'Usuario'}">` :
                          `<i class="fas fa-user-circle"></i>`
                        }
                    </div>
                    <div class="reseña-info">
                        <h4>${user.name || 'Usuario'}</h4>
                        <div class="reseña-estrellas" data-rating="${rating}">
                            ${'★'.repeat(parseInt(rating))}${'☆'.repeat(5 - parseInt(rating))}
                        </div>
                        <p class="reseña-fecha">${formattedDate}</p>
                    </div>
                </div>
                <div class="reseña-contenido">
                    <h5>${formData.get('titulo') || 'Sin título'}</h5>
                    <p>${formData.get('comentario') || 'Sin comentario'}</p>
                </div>
                <div class="reseña-acciones">
                    <button class="like-btn" data-review-id="${result.reviewId || ''}">
                        <i class="far fa-thumbs-up"></i> <span>0</span>
                    </button>
                    <button class="comment-btn">
                        <i class="far fa-comment"></i> <span>0</span>
                    </button>
                </div>
            `;
            
            // Insertar la nueva reseña al principio
            reviewSection.prepend(newReview);
            
            // Actualizar contadores
            updateReviewCounts();
        }
    } catch (error) {
        console.error('Error al publicar la reseña:', error);
        loadingAlert.close();
        showAlert('error', 'Error', error.message || 'No se pudo publicar la reseña. Inténtalo de nuevo.');
    }
}

// Función para actualizar los contadores de reseñas
function updateReviewCounts() {
    const reviewSections = document.querySelectorAll('.review-section');
    reviewSections.forEach(section => {
        const count = section.querySelectorAll('.reseña-tarjeta').length;
        const countElement = section.querySelector('.review-count');
        if (countElement) {
            countElement.textContent = `(${count})`;
        }
    });
}

// Función para cargar reseñas desde el servidor
async function loadReviews() {
    try {
        const response = await fetch('/api/reviews');
        if (!response.ok) {
            throw new Error('Error al cargar las reseñas');
        }
        
        const reviews = await response.json();
        const reviewSection = document.querySelector('.grid-reseñas');
        
        if (!reviewSection) return;
        
        // Limpiar reseñas existentes
        reviewSection.innerHTML = '';
        
        // Ordenar por fecha (más recientes primero)
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Agregar cada reseña al DOM
        reviews.forEach(review => {
            const formattedDate = new Date(review.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            const reviewElement = document.createElement('article');
            reviewElement.className = 'reseña-tarjeta';
            reviewElement.dataset.reviewId = review._id || review.id;
            reviewElement.dataset.userId = review.userId;
            
            reviewElement.innerHTML = `
                <div class="reseña-cabecera">
                    <div class="reseña-avatar">
                        ${review.userAvatar ? 
                          `<img src="${review.userAvatar}" alt="${review.userName}">` :
                          `<i class="fas fa-user-circle"></i>`
                        }
                    </div>
                    <div class="reseña-info">
                        <h4>${review.userName || 'Usuario'}</h4>
                        <div class="reseña-estrellas" data-rating="${review.rating || 3}">
                            ${'★'.repeat(review.rating || 3)}${'☆'.repeat(5 - (review.rating || 3))}
                        </div>
                        <p class="reseña-fecha">${formattedDate}</p>
                    </div>
                </div>
                <div class="reseña-contenido">
                    <h5>${review.title || 'Sin título'}</h5>
                    <p>${review.comment || 'Sin comentario'}</p>
                </div>
                <div class="reseña-acciones">
                    <button class="like-btn" data-review-id="${review._id || review.id}">
                        <i class="far fa-thumbs-up"></i> <span>${review.likes?.length || 0}</span>
                    </button>
                    <button class="comment-btn">
                        <i class="far fa-comment"></i> <span>${review.comments?.length || 0}</span>
                    </button>
                </div>
            `;
            
            reviewSection.appendChild(reviewElement);
        });
        
        // Actualizar contadores
        updateReviewCounts();
        
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        showAlert('error', 'Error', 'No se pudieron cargar las reseñas. Inténtalo de nuevo más tarde.');
    }
}

// Función para mostrar notificaciones con SweetAlert2
function showAlert(icon, title, text, timer = 3000) {
    return Swal.fire({
        icon: icon,
        title: title,
        text: text,
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true
    });
}

// Función para inicializar la autenticación
function initializeAuth() {
    console.log('Inicializando autenticación...');
    
    // Configurar el botón de cierre de sesión
    setupLogoutButton();
    
    // Verificar si hay un usuario autenticado
    const user = getCurrentUser();
    console.log('Usuario recuperado al cargar la página:', user);
    
    if (user) {
        console.log('Usuario autenticado encontrado, actualizando estado...');
        setAuthState(true, user);
    } else {
        console.log('No se encontró usuario autenticado');
        setAuthState(false);
    }
}

// Verificar estado de autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM completamente cargado, verificando autenticación...');
    initializeAuth();
    
        // Escuchar cambios en el almacenamiento local para sincronizar entre pestañas
    window.addEventListener('storage', function(event) {
        console.log('Evento de almacenamiento detectado:', event);
        if (event.key === 'currentUser') {
            if (event.newValue) {
                try {
                    const user = JSON.parse(event.newValue);
                    console.log('Usuario actualizado desde otra pestaña:', user);
                    setAuthState(true, user);
                } catch (e) {
                    console.error('Error al analizar datos del usuario:', e);
                    setAuthState(false);
                }
            } else {
                console.log('Usuario cerró sesión desde otra pestaña');
                setAuthState(false);
            }
        }
    });

    // Verificar autenticación también cuando la página se muestra (útil para cuando se navega atrás/adelante)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('Página visible, verificando estado de autenticación...');
            initializeAuth();
        }
    });

    // Verificar autenticación cuando la página se muestra desde el caché (navegación atrás/adelante)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log('Página mostrada desde el caché, verificando autenticación...');
            initializeAuth();
        }
    });
    
    // Mostrar formulario de registro
    const showRegisterBtn = document.getElementById('showRegister');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const loginForm = document.getElementById('loginFormContainer');
            const registerForm = document.getElementById('registerFormContainer');
            
            if (loginForm && registerForm) {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
            }
        });
    }

    // Mostrar formulario de inicio de sesión
    const showLoginBtn = document.getElementById('showLogin');
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const loginForm = document.getElementById('loginFormContainer');
            const registerForm = document.getElementById('registerFormContainer');
            
            if (loginForm && registerForm) {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            }
        });
    }
    
    // Configurar el formulario de reseñas si existe
    const reviewForm = document.getElementById('form-reseña');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }
    
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    // Manejar el registro de usuarios
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const role = 'user'; // Rol por defecto

            // Validar que las contraseñas coincidan
            if (password !== confirmPassword) {
                showAlert('error', 'Error', 'Las contraseñas no coinciden');
                return;
            }

            // Validar formato de correo electrónico
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAlert('error', 'Correo no válido', 'Por favor ingresa un correo electrónico válido.');
                return;
            }

            const loadingAlert = Swal.fire({
                title: 'Registrando...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch('http://localhost:27017/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        username,
                        password,
                        role // Incluir el rol en la solicitud
                    })
                });

                console.log('Respuesta del servidor:', response); // Para depuración

                const data = await response.json().catch(error => {
                    console.error('Error al analizar la respuesta JSON:', error);
                    throw new Error('Error al procesar la respuesta del servidor');
                });

                if (!response.ok) {
                    loadingAlert.close();

                    // Si el usuario ya existe, invitar a iniciar sesión
                    if (response.status === 400 && data.message) {
                        await showAlert('info', 'Usuario ya registrado', (data.message || 'Este usuario ya existe.') + ' Inicia sesión para continuar.');
                        const registerContainer = document.getElementById('registerFormContainer');
                        const loginContainer = document.getElementById('loginFormContainer');
                        if (registerContainer && loginContainer) {
                            registerContainer.style.display = 'none';
                            loginContainer.style.display = 'block';
                        }
                        return;
                    }

                    throw new Error(data.message || 'Error en el registro');
                }

                loadingAlert.close();
                await showAlert('success', '¡Registro exitoso!', 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');

                // Cambiar al formulario de inicio de sesión
                const registerContainer = document.getElementById('registerFormContainer');
                const loginContainer = document.getElementById('loginFormContainer');
                if (registerContainer && loginContainer) {
                    registerContainer.style.display = 'none';
                    loginContainer.style.display = 'block';
                }

                // Limpiar el formulario
                registerForm.reset();
            } catch (error) {
                loadingAlert.close();
                console.error('Error:', error);
                showAlert('error', 'Error al registrar', error.message || 'Intenta de nuevo más tarde');
            }
        });
    }

    // Manejar el inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const loadingAlert = Swal.fire({
                title: 'Iniciando sesión...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await fetch('http://localhost:27017/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json().catch(error => {
                    console.error('Error al analizar la respuesta JSON de login:', error);
                    throw new Error('Error al procesar la respuesta del servidor');
                });

                loadingAlert.close();

                if (!response.ok) {
                    // Usuario no encontrado -> invitar a registrarse
                    if (response.status === 404) {
                        await showAlert('info', 'Usuario no encontrado', data.message || 'No encontramos una cuenta con esos datos. Regístrate para crear una.');
                        const loginContainer = document.getElementById('loginFormContainer');
                        const registerContainer = document.getElementById('registerFormContainer');
                        if (loginContainer && registerContainer) {
                            loginContainer.style.display = 'none';
                            registerContainer.style.display = 'block';
                        }
                        return;
                    }

                    // Contraseña incorrecta
                    if (response.status === 401) {
                        await showAlert('error', 'Contraseña incorrecta', data.message || 'Verifica tus datos e inténtalo de nuevo.');
                        return;
                    }

                    throw new Error(data.message || 'Error al iniciar sesión');
                }

                // Login exitoso
                await showAlert('success', '¡Bienvenido!', data.message || 'Has iniciado sesión correctamente');

                const modal = document.getElementById('loginModal');
                if (modal) modal.style.display = 'none';

                if (data.user) {
                    setAuthState(true, data.user);
                } else {
                    setAuthState(true);
                }

            } catch (error) {
                loadingAlert.close();
                console.error('Error al iniciar sesión:', error);
                showAlert('error', 'Error', error.message || 'No se pudo iniciar sesión. Intenta de nuevo más tarde.');
            }
        });
    }

    // Toggle entre formularios de login y registro
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');

    if (showRegister && showLogin) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginFormContainer.style.display = 'none';
            registerFormContainer.style.display = 'block';
        });

        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerFormContainer.style.display = 'none';
            loginFormContainer.style.display = 'block';
        });
    }
});

/* Login Page JavaScript */

// Initialize login page
window.addEventListener('load', () => {
    initializeLoginPage();
});

async function initializeLoginPage() {
    // Check if user is already logged in
    try {
        const data = await checkUserSession();
        if (data.logged_in) {
            window.location.href = '/frontend/pages/index.html';
        }
    } catch (error) {
        console.log('No active session');
    }

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Enter key support
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (!document.getElementById('loginForm').classList.contains('hidden')) {
                handleLogin();
            } else {
                handleRegister();
            }
        }
    });
}

function switchToRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginWelcome').classList.add('hidden');
    document.getElementById('registerWelcome').classList.remove('hidden');
    clearMessages();
}

function switchToLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginWelcome').classList.remove('hidden');
    document.getElementById('registerWelcome').classList.add('hidden');
    clearMessages();
}

function clearMessages() {
    document.getElementById('loginMessage').innerHTML = '';
    document.getElementById('registerMessage').innerHTML = '';
}

function showMessage(elementId, message, isError = true) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="${isError ? 'error-message' : 'success-message'}">${message}</div>`;
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showMessage('loginMessage', 'Моля, попълнете всички полета!');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('loginMessage', 'Моля, въведете валиден имейл адрес!');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Зареждане...';

    try {
        const data = await fetchJSON('/backend/api/login.php', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            showMessage('loginMessage', data.message, false);
            setTimeout(() => {
                window.location.href = '/frontend/pages/index.html';
            }, 1000);
        } else {
            showMessage('loginMessage', data.message);
            btn.disabled = false;
            btn.textContent = 'Влез';
        }
    } catch (error) {
        showMessage('loginMessage', 'Грешка при свързване със сървъра!');
        btn.disabled = false;
        btn.textContent = 'Влез';
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('registerBtn');
    
    // Validation
    if (!name || !email || !username || !password) {
        showMessage('registerMessage', 'Моля, попълнете всички полета!');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('registerMessage', 'Моля, въведете валиден имейл адрес!');
        return;
    }

    if (password.length < 6) {
        showMessage('registerMessage', 'Паролата трябва да е поне 6 символа!');
        return;
    }

    if (username.length < 3) {
        showMessage('registerMessage', 'Потребителското име трябва да е поне 3 символа!');
        return;
    }

    // Check for valid username (only letters, numbers, underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showMessage('registerMessage', 'Потребителското име може да съдържа само букви, цифри и долна черта!');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Зареждане...';

    try {
        const data = await fetchJSON('/backend/api/register.php', {
            method: 'POST',
            body: JSON.stringify({ name, email, username, password })
        });

        if (data.success) {
            showMessage('registerMessage', data.message + ' Пренасочване към вход...', false);
            setTimeout(() => {
                switchToLogin();
                document.getElementById('loginEmail').value = email;
            }, 2000);
        } else {
            showMessage('registerMessage', data.message);
            btn.disabled = false;
            btn.textContent = 'Регистрирай се';
        }
    } catch (error) {
        showMessage('registerMessage', 'Грешка при свързване със сървъра!');
        btn.disabled = false;
        btn.textContent = 'Регистрирай се';
    }
}

// Export functions to global scope for inline event handlers
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

// Login page JavaScript functionality

function switchToRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginWelcome').classList.add('hidden');
    document.getElementById('registerWelcome').classList.remove('hidden');
}

function switchToLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerWelcome').classList.add('hidden');
    document.getElementById('loginWelcome').classList.remove('hidden');
}

function showMessage(elementId, message, type = 'error') {
    const messageEl = document.getElementById(elementId);
    messageEl.innerHTML = `<div class="${type === 'error' ? 'error-message' : 'success-message'}">${message}</div>`;
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
        messageEl.innerHTML = '';
    }, 5000);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showMessage('loginMessage', 'Моля, попълнете всички полета!', 'error');
        return;
    }
    
    // Disable button during request
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Влизане...';
    
    try {
        const response = await fetch('/backend/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email, // Can login with email or username
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('loginMessage', 'Успешен вход! Пренасочване...', 'success');
            setTimeout(() => {
                window.location.href = '/frontend/pages/index.html';
            }, 1500);
        } else {
            showMessage('loginMessage', data.message || 'Грешка при вход. Моля, опитайте отново.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Грешка при свързване със сървъра. Моля, опитайте отново.', 'error');
    } finally {
        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Влез';
    }
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    
    if (!name || !email || !username || !password) {
        showMessage('registerMessage', 'Моля, попълнете всички полета!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('registerMessage', 'Паролата трябва да бъде поне 6 символа!', 'error');
        return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('registerMessage', 'Моля, въведете валиден имейл адрес!', 'error');
        return;
    }
    
    // Disable button during request
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистриране...';
    
    try {
        const response = await fetch('/backend/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                username: username,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('registerMessage', 'Успешна регистрация! Пренасочване...', 'success');
            setTimeout(() => {
                window.location.href = '/frontend/pages/index.html';
            }, 1500);
        } else {
            showMessage('registerMessage', data.message || 'Грешка при регистрация. Моля, опитайте отново.', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('registerMessage', 'Грешка при свързване със сървъра. Моля, опитайте отново.', 'error');
    } finally {
        // Re-enable button
        registerBtn.disabled = false;
        registerBtn.innerHTML = 'Регистрирай се';
    }
}

// Allow Enter key to submit forms
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginInputs = document.querySelectorAll('#loginForm input');
    loginInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    });
    
    // Register form
    const registerInputs = document.querySelectorAll('#registerForm input');
    registerInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleRegister();
            }
        });
    });
});
/* Utility Functions */

// Date and time utilities
function formatTimeRemaining(seconds) {
    if (seconds <= 0) return 'Приключил';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}д ${hours}ч ${mins}м ${secs}с`;
    if (hours > 0) return `${hours}ч ${mins}м ${secs}с`;
    if (mins > 0) return `${mins}м ${secs}с`;
    return `${secs}с`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('bg-BG');
}

// Text utilities
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

// Category utilities
function getCategoryName(category) {
    const categories = {
        'electronics': 'Електроника',
        'fashion': 'Мода',
        'home': 'Дом и градина',
        'sports': 'Спорт',
        'cars': 'Автомобили',
        'others': 'Други'
    };
    return categories[category] || 'Други';
}

// API utilities
async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// Session management utilities
async function checkUserSession() {
    try {
        const response = await fetch('/backend/api/check_session.php');
        const data = await response.json();
        return data;
    } catch (error) {
        console.log('No active session');
        return { logged_in: false };
    }
}

// DOM utilities
function hideElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.add('hidden');
    }
}

function showElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.remove('hidden');
    }
}

function toggleElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.toggle('hidden');
    }
}

// Validation utilities
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPrice(price) {
    return !isNaN(price) && parseFloat(price) > 0 && parseFloat(price) <= 99999999.99;
}

// URL parameter utilities
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function setURLParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// Local storage utilities
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// Debounce utility
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* Create Auction Page JavaScript */

// Initialize create auction page
window.addEventListener('load', () => {
    initializeCreateAuctionPage();
});

async function initializeCreateAuctionPage() {
    await checkUserSessionForAuction();
    setupEventListeners();
}

async function checkUserSessionForAuction() {
    try {
        const data = await checkUserSession();
        if (!data.logged_in) {
            showToast('Грешка', 'Трябва да влезете в профила си за да създадете търг.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        showToast('Грешка', 'Не можахме да проверим статуса на профила ви.', 'error');
    }
}

function setupEventListeners() {
    // Form submission
    const auctionForm = document.getElementById('auctionForm');
    if (auctionForm) {
        auctionForm.addEventListener('submit', handleFormSubmission);
    }

    // Auction type change
    const auctionType = document.getElementById('auction_type');
    if (auctionType) {
        auctionType.addEventListener('change', handleAuctionTypeChange);
    }

    // Logout functionality
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }

    // Price validation
    const startingPrice = document.getElementById('starting_price');
    const buyNowPrice = document.getElementById('buy_now_price');
    
    if (startingPrice) {
        startingPrice.addEventListener('input', validatePrices);
    }
    
    if (buyNowPrice) {
        buyNowPrice.addEventListener('input', validatePrices);
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const form = document.getElementById('auctionForm');
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Disable form and show loading
    submitBtn.disabled = true;
    loading.style.display = 'block';
    form.style.opacity = '0.7';
    
    try {
        const formData = new FormData(form);
        const auctionData = {};
        
        for (let [key, value] of formData.entries()) {
            auctionData[key] = value;
        }

        const data = await fetchJSON('/backend/api/create_auction.php', {
            method: 'POST',
            body: JSON.stringify(auctionData)
        });
        
        if (data.success) {
            showToast('Успех!', data.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showToast('Грешка', data.message, 'error');
        }
    } catch (error) {
        showToast('Грешка', 'Възникна проблем при създаването на търга. Моля, опитайте отново.', 'error');
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
        form.style.opacity = '1';
    }
}

function validateForm() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const startingPrice = parseFloat(document.getElementById('starting_price').value);
    const category = document.getElementById('category').value;
    const durationHours = document.getElementById('duration_hours').value;
    const auctionType = document.getElementById('auction_type').value;
    const buyNowPrice = document.getElementById('buy_now_price').value;
    const imageUrl = document.getElementById('image_url').value.trim();

    // Required field validation
    if (!title) {
        showToast('Грешка', 'Моля, въведете заглавие на търга.', 'warning');
        document.getElementById('title').focus();
        return false;
    }

    if (title.length < 5) {
        showToast('Грешка', 'Заглавието трябва да е поне 5 символа.', 'warning');
        document.getElementById('title').focus();
        return false;
    }

    if (!description) {
        showToast('Грешка', 'Моля, въведете описание на търга.', 'warning');
        document.getElementById('description').focus();
        return false;
    }

    if (description.length < 20) {
        showToast('Грешка', 'Описанието трябва да е поне 20 символа.', 'warning');
        document.getElementById('description').focus();
        return false;
    }

    if (!isValidPrice(startingPrice)) {
        showToast('Грешка', 'Моля, въведете валидна начална цена (между 0.01 и 99,999,999.99 лв.).', 'warning');
        document.getElementById('starting_price').focus();
        return false;
    }

    if (!category) {
        showToast('Грешка', 'Моля, изберете категория.', 'warning');
        document.getElementById('category').focus();
        return false;
    }

    if (!durationHours) {
        showToast('Грешка', 'Моля, изберете продължителност на търга.', 'warning');
        document.getElementById('duration_hours').focus();
        return false;
    }

    if (!auctionType) {
        showToast('Грешка', 'Моля, изберете тип търг.', 'warning');
        document.getElementById('auction_type').focus();
        return false;
    }

    // Buy now price validation
    if (auctionType === 'both' && buyNowPrice) {
        const buyNowPriceNum = parseFloat(buyNowPrice);
        if (!isValidPrice(buyNowPriceNum)) {
            showToast('Грешка', 'Моля, въведете валидна цена "Купи сега" (между 0.01 и 99,999,999.99 лв.).', 'warning');
            document.getElementById('buy_now_price').focus();
            return false;
        }

        if (buyNowPriceNum <= startingPrice) {
            showToast('Грешка', 'Цената "Купи сега" трябва да е по-висока от началната цена.', 'warning');
            document.getElementById('buy_now_price').focus();
            return false;
        }
    }

    // Image URL validation
    if (imageUrl && !isValidImageUrl(imageUrl)) {
        showToast('Грешка', 'Моля, въведете валиден URL на снимка.', 'warning');
        document.getElementById('image_url').focus();
        return false;
    }

    return true;
}

function isValidImageUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function validatePrices() {
    const startingPrice = parseFloat(document.getElementById('starting_price').value);
    const buyNowPrice = parseFloat(document.getElementById('buy_now_price').value);
    const auctionType = document.getElementById('auction_type').value;

    if (auctionType === 'both' && buyNowPrice && startingPrice) {
        if (buyNowPrice <= startingPrice) {
            document.getElementById('buy_now_price').setCustomValidity('Цената "Купи сега" трябва да е по-висока от началната цена');
        } else {
            document.getElementById('buy_now_price').setCustomValidity('');
        }
    }
}

function handleAuctionTypeChange(e) {
    const buyNowGroup = document.getElementById('buyNowPriceGroup');
    const buyNowInput = document.getElementById('buy_now_price');
    
    if (e.target.value === 'both') {
        showElement(buyNowGroup);
        buyNowInput.required = false; // Optional field
    } else {
        hideElement(buyNowGroup);
        buyNowInput.value = ''; // Clear the field when hidden
        buyNowInput.setCustomValidity(''); // Clear any validation errors
    }
}

async function handleLogout(e) {
    e.preventDefault();
    try {
        await fetch('/backend/api/logout.php');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Export functions to global scope for inline event handlers if needed
window.handleFormSubmission = handleFormSubmission;
window.handleAuctionTypeChange = handleAuctionTypeChange;
window.handleLogout = handleLogout;

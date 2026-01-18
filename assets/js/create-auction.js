// Create Auction Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('auctionForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingDiv = document.getElementById('loading');

    // Check if user is logged in
    checkUserSession();

    // Handle auction type change to show/hide buy now price
    const auctionTypeSelect = document.getElementById('auction_type');
    const buyNowPriceGroup = document.getElementById('buyNowPriceGroup');
    
    if (auctionTypeSelect && buyNowPriceGroup) {
        auctionTypeSelect.addEventListener('change', function() {
            if (this.value === 'both') {
                buyNowPriceGroup.classList.remove('hidden');
            } else {
                buyNowPriceGroup.classList.add('hidden');
                document.getElementById('buy_now_price').value = '';
            }
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        submitBtn.disabled = true;
        loadingDiv.style.display = 'block';
        
        const formData = new FormData(form);
        
        // Convert form data to JSON
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            starting_price: parseFloat(formData.get('starting_price')),
            buy_now_price: formData.get('auction_type') === 'both' && formData.get('buy_now_price') ? parseFloat(formData.get('buy_now_price')) : null,
            category: formData.get('category'),
            location: formData.get('location'),
            duration_hours: parseFloat(formData.get('duration_hours')),
            image_url: formData.get('image_url')
        };

        try {
            const response = await fetch('/backend/create_auction.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showToast('Успех!', result.message, 'success');
                // Redirect to main page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showToast('Грешка', result.message, 'error');
                submitBtn.disabled = false;
            }
        } catch (error) {
            showToast('Грешка', 'Възникна проблем при свързването със сървъра.', 'error');
            submitBtn.disabled = false;
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    // Validation helpers
    const startingPriceInput = document.getElementById('starting_price');
    const buyNowPriceInput = document.getElementById('buy_now_price');

    buyNowPriceInput.addEventListener('input', function() {
        const startingPrice = parseFloat(startingPriceInput.value) || 0;
        const buyNowPrice = parseFloat(this.value) || 0;
        
        if (buyNowPrice > 0 && buyNowPrice <= startingPrice) {
            showToast('Внимание', 'Цената "Купи сега" трябва да е по-висока от началната цена.', 'warning');
        }
    });

    async function checkUserSession() {
        try {
            const response = await fetch('/backend/check_session.php');
            const data = await response.json();
            
            if (!data.logged_in) {
                showToast('Неоторизиран достъп', 'Трябва да сте влезли в профила си, за да създавате търгове.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            showToast('Грешка', 'Не можахме да проверим вашия статус.', 'error');
        }
    }
});
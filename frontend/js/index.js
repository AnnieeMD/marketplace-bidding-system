let currentAuctions = [];
let currentSearch = '';
let currentCategory = '';
let currentPriceSort = '';
let currentUser = null;
let currentPage = 1;
const auctionsPerPage = 6;
let totalAuctions = 0;

function showToast(title, message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle', 
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">
                <i class="${icons[type]}"></i>
                ${title}
            </div>
            <button class="toast-close" onclick="closeToast(this)">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        if (toast.parentNode) {
            closeToast(toast.querySelector('.toast-close'));
        }
    }, duration);
}

function closeToast(closeButton) {
    const toast = closeButton.closest('.toast');
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

window.addEventListener('load', () => {
    checkUserSession();
    loadAuctions();
    startCountdownTimer();
    startAuctionPolling();

    setInterval(checkUserSession, 30000);
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        checkUserSession();
    }
});

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchAuctions();
});

async function checkUserSession() {
    try {
        const response = await fetch(`${BASE_URL}/backend/check_session.php`);
        const data = await response.json();

        const previousUser = currentUser;
        currentUser = data.logged_in ? data.user : null;
        
        if (data.logged_in) {
            document.getElementById('loginLink').style.display = 'none';
            document.getElementById('createAuctionLink').classList.remove('hidden');
            document.getElementById('userMenu').classList.remove('hidden');
            document.getElementById('logoutLink').classList.remove('hidden');
            document.getElementById('userName').textContent = data.user.username;
        } else {
            document.getElementById('loginLink').style.display = 'block';
            document.getElementById('createAuctionLink').classList.add('hidden');
            document.getElementById('userMenu').classList.add('hidden');
            document.getElementById('logoutLink').classList.add('hidden');
        }

        if (previousUser?.id !== currentUser?.id) {
            renderAuctions();
        }
    } catch (error) { 
        console.log('No active session');
        currentUser = null;
    }
}

async function loadAuctions(page = 1) {
    try {
        const offset = (page - 1) * auctionsPerPage;
        let url = `${BASE_URL}/backend/auctions.php?search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}&status=all&limit=${auctionsPerPage}&offset=${offset}`;

        if (currentPriceSort) {
            url += `&price_sort=${encodeURIComponent(currentPriceSort)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            currentAuctions = data.auctions;
            totalAuctions = data.total;
            currentPage = page;
            renderAuctions();
            renderPagination();
        } else {
            document.getElementById('auctionsContainer').innerHTML = `
                <div class="no-results"><h3>Грешка при зареждане</h3><p>${data.message}</p></div>`;
        }
    } catch (error) {
        document.getElementById('auctionsContainer').innerHTML = `
            <div class="no-results"><h3>Грешка при свързване</h3></div>`;
    }
}

function renderAuctions() {
    const container = document.getElementById('auctionsContainer');
    
    if (currentAuctions.length === 0) {
        container.innerHTML = '<div class="no-results"><h3>Няма намерени търгове</h3></div>';
        return;
    }

    const auctionsHTML = currentAuctions.map(auction => {
        const isActive = auction.actual_status === 'active';
        const timeLeft = isActive ? formatTimeRemaining(auction.time_remaining) : 'Приключил';
        const currentPrice = auction.current_price || auction.starting_price;
        const truncatedDescription = truncateText(auction.description || 'Няма описание', 100);
        const isOwner = currentUser && currentUser.id == auction.user_id;
        const hasBids = auction.total_bids > 0;
        
        return `
            <div class="auction-card" data-auction-id="${auction.id}">
                <div class="auction-image">
                    ${auction.image_url ? 
                        `<img src="${auction.image_url}" alt="${auction.title}" style="width: 100%; height: 100%; object-fit: cover;">` : 
                        '<i class="fas fa-image"></i>'
                    }
                    <div class="auction-badge ${isActive ? '' : 'ended'}">${isActive ? 'Активен' : 'Приключил'}</div>
                    ${isOwner && !hasBids && isActive ? '<div class="owner-controls"><button class="delete-btn" onclick="deleteAuction(' + auction.id + ')" title="Изтрий търг"><i class="fas fa-trash"></i></button></div>' : ''}
                </div>
                <div class="auction-content">
                    <div class="auction-title">${auction.title}</div>
                    <div class="auction-price-line">
                        <div class="auction-price">${currentPrice} лв.</div>
                        <div class="auction-time"><i class="fas fa-clock"></i> <span class="auction-time-remaining" data-auction-id="${auction.id}">${timeLeft}</span></div>
                    </div>
                    <div class="auction-stats">
                        <div class="top-bidders">
                            ${auction.top_bidders && auction.top_bidders.length > 0 ? 
                                `<div class="bidders-list">
                                    <div class="bidders-header">${isActive ? 'Текущ победител:' : 'Купено от:'}</div>
                                    <div class="bidder-item winner">🏆 ${auction.top_bidders[0].username}: ${auction.top_bidders[0].bid_amount} лв.</div>
                                </div>` :
                                `<span><i class="fas fa-gavel"></i> Няма наддавания</span>`
                            }
                        </div>
                    </div>
                    <div class="auction-description">${truncatedDescription}</div>
                    <button class="auction-details-btn" onclick="showAuctionDetails(${auction.id})">Виж детайли</button>
                    
                    ${isActive ? `
                        <div class="bidding-section">
                            <div class="bid-form">
                                <input type="number" class="bid-input" placeholder="Наддайте..." min="${parseFloat(currentPrice) + 1}" max="99999999.99" step="0.01">
                                <button class="bid-btn" onclick="placeBid(${auction.id})">Наддай</button>
                            </div>
                            ${auction.buy_now_price ? `<button class="buy-now-btn" onclick="buyNow(${auction.id}, ${auction.buy_now_price})">Купи сега за ${auction.buy_now_price} лв.</button>` : ''}
                        </div>
                    ` : ''}
                    
                    <div id="recentBids${auction.id}" style="margin: 5px 0;"></div>
                    
                    <div class="auction-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${auction.location || 'Не е посочено'}</span>
                        <span>${formatDate(auction.created_at)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="auctions-grid">${auctionsHTML}</div>
        <div id="paginationContainer"></div>
    `;
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = Math.ceil(totalAuctions / auctionsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination">';

    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(${currentPage - 1})">← Предишна</button>`;
    }

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="loadAuctions(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(${totalPages})">${totalPages}</button>`;
    }

    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(${currentPage + 1})">Следваща →</button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Страница ${currentPage} от ${totalPages} • Общо ${totalAuctions} търга</div>`;
    
    container.innerHTML = paginationHTML;
}

function updateAuctionAfterBid(auctionId, newPrice, totalBids, topBidders) {
    const auctionIndex = currentAuctions.findIndex(auction => auction.id == auctionId);
    if (auctionIndex !== -1) {
        currentAuctions[auctionIndex].current_price = newPrice;
        currentAuctions[auctionIndex].total_bids = totalBids;
        if (topBidders) {
            currentAuctions[auctionIndex].top_bidders = topBidders;
        }

        const auctionCard = document.querySelector(`[data-auction-id="${auctionId}"]`);
        if (auctionCard) {
            const priceElement = auctionCard.querySelector('.auction-price');
            if (priceElement) {
                priceElement.textContent = `${newPrice} лв.`;
            }

            const bidInput = auctionCard.querySelector('.bid-input');
            if (bidInput) {
                bidInput.min = parseFloat(newPrice) + 1;
                bidInput.placeholder = "Наддайте...";
            }

            if (topBidders) {
                const topBiddersElement = auctionCard.querySelector('.top-bidders');
                if (topBiddersElement) {
                    const biddersHTML = topBidders.length > 0 ? 
                        `<div class="bidders-list">
                            <div class="bidders-header"><i class="fas fa-crown"></i> Текущ водещ:</div>
                            <div class="bidder-item winner">🏆 ${topBidders[0].username}: ${topBidders[0].bid_amount} лв.</div>
                        </div>` :
                        `<span><i class="fas fa-gavel"></i> Няма наддавания</span>`;
                    
                    topBiddersElement.innerHTML = biddersHTML;
                }
            }
        }
    }
}

function searchAuctions() {
    currentSearch = document.getElementById('searchInput').value.trim();
    currentCategory = document.getElementById('categorySelect').value;
    currentPriceSort = document.getElementById('priceSort').value;
    currentPage = 1;
    loadAuctions(1);
}

async function placeBid(auctionId) {
    if (!currentUser) {
        showToast('Необходим вход', 'Трябва да сте влезли в профила си, за да наддавате!', 'warning');
        return;
    }
    
    const bidInput = document.querySelector(`[data-auction-id="${auctionId}"] .bid-input`);
    const bidAmount = parseFloat(bidInput.value);
    
    if (!bidAmount) { 
        showToast('Невалидна сума', 'Моля, въведете валидна сума за наддаване!', 'warning');
        return; 
    }

    if (bidAmount > 99999999.99) {
        showToast('Твърде голяма сума', 'Максималната възможна наддавка е 99,999,999.99 лв.!', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/backend/auctions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: auctionId, bid_amount: bidAmount })
        });
        
        const data = await response.json();
        if (data.success) {
            bidInput.value = '';

            updateAuctionAfterBid(auctionId, data.new_price, data.total_bids, data.top_bidders);
            
        } else {
            showToast('Грешка при наддаване', data.message || 'Възникна проблем при наддаването.', 'error');
        }
    } catch (error) { 
        showToast('Грешка при свързване', 'Не можахме да се свържем със сървъра. Моля, опитайте отново.', 'error');
    }
}

async function buyNow(auctionId, price) {
    if (!currentUser) {
        showToast('Необходим вход', 'Трябва да сте влезли в профила си, за да купувате!', 'warning');
        return;
    }

    if (!confirm(`Искате ли да купите този артикул сега за ${price} лв.? Това действие не може да бъде отменено.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/backend/auctions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'buy_now', 
                auction_id: auctionId 
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showToast('Успешна покупка!', `Успешно закупихте артикула за ${data.final_price} лв.!`, 'success');

            const auctionCard = document.querySelector(`[data-auction-id="${auctionId}"]`);
            if (auctionCard) {
                auctionCard.querySelector('.auction-badge').textContent = 'Приключил';
                auctionCard.querySelector('.auction-badge').classList.add('ended');

                const biddingSection = auctionCard.querySelector('.bidding-section');
                if (biddingSection) {
                    biddingSection.remove();
                }

                const priceElement = auctionCard.querySelector('.auction-price');
                if (priceElement) {
                    priceElement.textContent = `${data.final_price} лв.`;
                }

                const topBiddersElement = auctionCard.querySelector('.top-bidders');
                if (topBiddersElement && data.winner) {
                    topBiddersElement.innerHTML = `
                        <div class="bidders-list">
                            <div class="bidders-header">Купено от:</div>
                            <div class="bidder-item winner">🏆 ${data.winner.username}: ${data.winner.bid_amount} лв.</div>
                        </div>
                    `;
                }

                const timeElement = auctionCard.querySelector('.auction-time-remaining');
                if (timeElement) {
                    timeElement.textContent = 'Приключил';
                }
            }

            const modal = document.getElementById('auctionModal');
            if (modal && modal.style.display !== 'none') {
                closeModal();
            }
            
        } else {
            showToast('Грешка при покупка', data.message || 'Възникна проблем при покупката.', 'error');
        }
    } catch (error) {
        showToast('Грешка при свързване', 'Не можахме да се свържем със сървъра. Моля, опитайте отново.', 'error');
    }
}

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

function startCountdownTimer() {
    setInterval(() => {
        const timeElements = document.querySelectorAll('.auction-time-remaining, .modal-time-remaining');
        let auctionsEnded = false;
        const processedAuctions = new Set();

        currentAuctions.forEach(auction => {
            if (auction.actual_status === 'active' && auction.time_remaining > 0) {
                auction.time_remaining -= 1;
                
                if (auction.time_remaining <= 0) {
                    auction.actual_status = 'ended';
                    auctionsEnded = true;
                }
            }
        });

        timeElements.forEach(element => {
            const auctionId = element.getAttribute('data-auction-id');
            const auction = currentAuctions.find(a => a.id == auctionId);
            if (auction) {
                if (auction.actual_status === 'ended') {
                    element.textContent = 'Приключил';
                } else {
                    element.textContent = formatTimeRemaining(auction.time_remaining);
                }

                if (auction.time_remaining <= 0 && element.classList.contains('auction-time-remaining')) {
                    const card = document.querySelector(`[data-auction-id="${auctionId}"]`);
                    if (card) {
                        const badge = card.querySelector('.auction-badge');
                        if (badge) {
                            badge.textContent = 'Приключил';
                            badge.classList.add('ended');
                        }
                        const biddingSection = card.querySelector('.bidding-section');
                        if (biddingSection) {
                            biddingSection.style.display = 'none';
                        }
                        const deleteBtn = card.querySelector('.delete-btn');
                        if (deleteBtn) {
                            deleteBtn.style.display = 'none';
                        }
                    }
                }
            }
        });

        if (auctionsEnded) {
            processEndedAuctions();
        }
    }, 1000);
}

let lastEndedAuctionsProcessed = 0;
async function processEndedAuctions() {
    const now = Date.now();
    if (now - lastEndedAuctionsProcessed < 5000) {
        return;
    }
    lastEndedAuctionsProcessed = now;
    
    try {
        const response = await fetch(`${BASE_URL}/backend/end_auctions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success && data.processed > 0) {
            setTimeout(() => {
                loadAuctions();
            }, 3000);
        }
    } catch (error) {
        console.error('Error processing ended auctions:', error);
    }
}

function startAuctionPolling() {
    setInterval(async () => {
        await checkForAuctionUpdates();
    }, 5000);
}

async function checkForAuctionUpdates() {
    if (currentPage !== 1) return;
    
    try {
        let url = `${BASE_URL}/backend/auctions.php?search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}&status=all&limit=${auctionsPerPage}&offset=0`;

        if (currentPriceSort) {
            url += `&price_sort=${encodeURIComponent(currentPriceSort)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.auctions) {
            const newAuctions = data.auctions;
            let hasUpdates = false;
            let hasNewAuctions = false;

            newAuctions.forEach(newAuction => {
                const existingAuction = currentAuctions.find(a => a.id === newAuction.id);
                if (!existingAuction) {
                    currentAuctions.unshift(newAuction);
                    hasUpdates = true;
                    hasNewAuctions = true;
                }
            });

            const currentAuctionIds = newAuctions.map(a => a.id);
            const deletedAuctions = currentAuctions.filter(auction => !currentAuctionIds.includes(auction.id));
            if (deletedAuctions.length > 0) {
                currentAuctions = currentAuctions.filter(auction => currentAuctionIds.includes(auction.id));
                hasUpdates = true;
            }

            newAuctions.forEach(newAuction => {
                const existingAuction = currentAuctions.find(a => a.id === newAuction.id);
                if (existingAuction) {
                    if (existingAuction.current_price !== newAuction.current_price ||
                        existingAuction.total_bids !== newAuction.total_bids ||
                        existingAuction.actual_status !== newAuction.actual_status ||
                        existingAuction.last_updated !== newAuction.last_updated) {

                        const auctionIndex = currentAuctions.findIndex(a => a.id === newAuction.id);
                        currentAuctions[auctionIndex] = newAuction;

                        if (existingAuction.actual_status !== newAuction.actual_status && newAuction.actual_status === 'ended') {
                            hasUpdates = true;
                        } else {
                            updateAuctionUI(newAuction);
                        }
                    }
                }
            });

            if (hasNewAuctions || deletedAuctions.length > 0 || hasUpdates) {
                renderAuctions();
            }
        }
    } catch (error) {
        console.error('Error checking for auction updates:', error);
    }
}

function updateAuctionUI(auction) {
    const auctionCard = document.querySelector(`[data-auction-id="${auction.id}"]`);
    if (auctionCard) {
        const priceElement = auctionCard.querySelector('.auction-price');
        if (priceElement) {
            priceElement.textContent = `${auction.current_price} лв.`;
        }

        const timeElement = auctionCard.querySelector('.auction-time-remaining');
        const badgeElement = auctionCard.querySelector('.auction-badge');
        
        if (auction.actual_status === 'ended') {
            if (timeElement) {
                timeElement.textContent = 'Приключил';
            }
            if (badgeElement) {
                badgeElement.textContent = 'Приключил';
                badgeElement.classList.add('ended');
            }
            const biddingSection = auctionCard.querySelector('.bidding-section');
            if (biddingSection) {
                biddingSection.remove();
            }
        } else {
            if (timeElement) {
                timeElement.textContent = formatTimeRemaining(auction.time_remaining);
            }
        }

        const bidInput = auctionCard.querySelector('.bid-input');
        if (bidInput && auction.actual_status === 'active') {
            bidInput.min = parseFloat(auction.current_price) + 1;
        }

        if (auction.top_bidders) {
            const topBiddersElement = auctionCard.querySelector('.top-bidders');
            if (topBiddersElement) {
                const isEnded = auction.actual_status === 'ended';
                const headerText = isEnded ? 'Купено от:' : 'Текущ победител:';
                const biddersHTML = auction.top_bidders.length > 0 ? 
                    `<div class="bidders-list">
                        <div class="bidders-header">${headerText}</div>
                        <div class="bidder-item winner">🏆 ${auction.top_bidders[0].username}: ${auction.top_bidders[0].bid_amount} лв.</div>
                    </div>` :
                    `<span><i class="fas fa-gavel"></i> Няма наддавания</span>`;
                
                topBiddersElement.innerHTML = biddersHTML;
            }
        }
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('bg-BG');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

function showAuctionDetails(auctionId) {
    const auction = currentAuctions.find(a => a.id === auctionId);
    if (!auction) return;

    const timeLeft = formatTimeRemaining(auction.time_remaining);
    const isActive = auction.actual_status === 'active';
    const currentPrice = auction.current_price || auction.starting_price;

    if (!isActive) {
        showAuctionResults(auctionId);
        return;
    }

    const modalHTML = `
        <div class="modal-overlay" id="auctionModal" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${auction.title}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-image">
                        ${auction.image_url ? 
                            `<img src="${auction.image_url}" alt="${auction.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                            '<i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>'
                        }
                    </div>
                    ${auction.top_bidders && auction.top_bidders.length > 0 ? `
                        <div class="modal-bidders-container">
                            <div class="modal-bidders-title">
                                <i class="fas fa-trophy"></i> Топ наддаващи
                            </div>
                            <div class="modal-bidders-list">
                                ${auction.top_bidders.map((bidder, index) => 
                                    `<div class="modal-bidder-item ${index === 0 ? 'winner' : ''}">
                                        ${index === 0 ? '<i class="fas fa-crown" style="color: #ffc107; margin-right: 5px;"></i>' : ''}
                                        <strong>${bidder.username}</strong>: ${bidder.bid_amount} лв.
                                    </div>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="modal-price">${currentPrice} лв.</div>
                    <div class="modal-description">${auction.description || 'Няма описание за този търг.'}</div>
                    <div class="modal-meta">
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Статус:</span> 
                            <span style="color: ${isActive ? '#28a745' : '#dc3545'}">${isActive ? 'Активен търг' : 'Приключил търг'}</span>
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Оставащо време:</span> <span class="modal-time-remaining" data-auction-id="${auction.id}">${timeLeft}</span>
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Начална цена:</span> ${auction.starting_price} лв.
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Брой наддавания:</span> ${auction.total_bids || 0}
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Местоположение:</span> ${auction.location || 'Не е посочено'}
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Категория:</span> ${getCategoryName(auction.category)}
                        </div>
                        <div class="modal-meta-item">
                            <span class="modal-meta-label">Продавач:</span> ${auction.username || 'Неизвестен'}
                        </div>
                        ${auction.buy_now_price ? `
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Цена "Купи сега":</span> ${auction.buy_now_price} лв.
                            </div>
                        ` : ''}
                    </div>
                    ${isActive ? `
                        <div class="modal-actions">
                            <div class="bid-form" style="margin-bottom: 10px;">
                                <input type="number" class="bid-input" id="modalBidInput" placeholder="Въведете сума..." min="${parseFloat(currentPrice) + 1}" max="99999999.99" step="0.01">
                                <button class="bid-btn" onclick="placeBidFromModal(${auction.id})">Наддай</button>
                            </div>
                            ${auction.buy_now_price ? `<button class="buy-now-btn" onclick="buyNow(${auction.id}, ${auction.buy_now_price})">Купи сега за ${auction.buy_now_price} лв.</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('auctionModal').style.display = 'flex';
}

async function showAuctionResults(auctionId) {
    try {
        const response = await fetch(`${BASE_URL}/backend/auction_results.php?auction_id=${auctionId}`);
        const data = await response.json();
        
        if (!data.success) {
            showToast('Грешка', data.message, 'error');
            return;
        }
        
        const auction = data.auction;
        const winner = data.winner;
        const bids = data.bids;
        
        const modalHTML = `
            <div class="modal-overlay" id="auctionModal" onclick="closeModal(event)">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2 class="modal-title">🏆 Резултати от търга</h2>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-image">
                            ${auction.image_url ? 
                                `<img src="${auction.image_url}" alt="${auction.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : 
                                '<i class="fas fa-image" style="font-size: 3rem; color: #ccc;"></i>'
                            }
                        </div>
                        <h3>${auction.title}</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            ${winner ? `
                                <div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">
                                    <i class="fas fa-trophy"></i> Победител: ${winner.username}
                                </div>
                                <div style="font-size: 1.2rem; color: #11998e;">
                                    <strong>Печеливша цена: ${winner.winning_bid} лв.</strong>
                                </div>
                            ` : `
                                <div style="color: #666;">
                                    <i class="fas fa-info-circle"></i> Няма наддавания за този търг
                                </div>
                                <div style="color: #999;">
                                    Начална цена: ${auction.starting_price} лв.
                                </div>
                            `}
                        </div>
                        
                        <div class="modal-meta">
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Статус:</span> 
                                <span style="color: #dc3545">Приключил търг</span>
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Приключен на:</span> ${formatDate(auction.end_time)}
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Начална цена:</span> ${auction.starting_price} лв.
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Общо наддавания:</span> ${auction.total_bids}
                            </div>
                            <div class="modal-meta-item">
                                <span class="modal-meta-label">Продавач:</span> ${auction.seller_username}
                            </div>
                        </div>
                        
                        ${auction.description ? `
                            <div style="margin: 15px 0;">
                                <h4>Описание:</h4>
                                <p style="color: #666; line-height: 1.5;">${auction.description}</p>
                            </div>
                        ` : ''}
                        
                        ${bids.length > 0 ? `
                            <div style="margin-top: 20px;">
                                <h4>История на наддаванията:</h4>
                                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 5px; padding: 10px;">
                                    ${bids.map(bid => `
                                        <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f5f5f5; ${bid.is_winning ? 'background: #e8f5e8; font-weight: bold;' : ''}">
                                            <span>${bid.username} ${bid.is_winning ? '🏆' : ''}</span>
                                            <span>${bid.bid_amount} лв.</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('auctionModal').style.display = 'flex';
        
    } catch (error) {
        showToast('Грешка', 'Не можахме да заредим резултатите от търга.', 'error');
    }
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('auctionModal') || document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
    }
}

async function showMyProfile() {
    if (!currentUser) {
        alert('Моля, влезте в профила си първо');
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/backend/user_profile.php`);
        const data = await response.json();
        
        if (!data.success) {
            alert('Грешка: ' + data.message);
            return;
        }
        
        let html = `
            <div class="modal-overlay" id="userModal" onclick="closeModal(event)">
                <div class="modal" onclick="event.stopPropagation()" style="max-width: 800px; max-height: 85vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2 class="modal-title">👤 ${data.user.username}</h2>
                        <button class="modal-close" onclick="closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="background: linear-gradient(135deg, #11998e, #38d9a9); color: white; padding: 20px; border-radius: 10px; margin-bottom: 25px; text-align: center;">
                            <h3 style="margin: 0; color: white;">${data.user.full_name || data.user.username}</h3>
                            <p style="margin: 5px 0; opacity: 0.9;">📧 ${data.user.email || 'Не е посочен имейл'}</p>
                            <p style="margin: 5px 0; opacity: 0.9;">📅 Член от: ${formatDate(data.user.created_at)}</p>
                        </div>
                        
                        <!-- Statistics Overview -->
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
                            <div style="background: white; border: 2px solid #11998e; border-radius: 10px; padding: 15px; text-align: center;">
                                <div style="font-size: 2rem; font-weight: bold; color: #11998e;">${data.stats.auctions_created}</div>
                                <div style="color: #666; font-size: 0.9rem;">Създадени търгове</div>
                            </div>
                            <div style="background: white; border: 2px solid #17a2b8; border-radius: 10px; padding: 15px; text-align: center;">
                                <div style="font-size: 2rem; font-weight: bold; color: #17a2b8;">${data.stats.total_bids_placed}</div>
                                <div style="color: #666; font-size: 0.9rem;">Общо наддавания</div>
                            </div>
                            <div style="background: white; border: 2px solid #28a745; border-radius: 10px; padding: 15px; text-align: center;">
                                <div style="font-size: 2rem; font-weight: bold; color: #28a745;">${data.stats.auctions_won}</div>
                                <div style="color: #666; font-size: 0.9rem;">Спечелени търгове</div>
                            </div>
                        </div>
                        
                        <!-- Additional Stats -->
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 25px;">
                            <h4 style="margin: 0 0 10px 0; color: #495057;">📊 Детайлна статистика</h4>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>📈 Участия в търгове:</span>
                                    <strong>${data.stats.auctions_participated}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>💰 Средно наддаване:</span>
                                    <strong>${parseFloat(data.stats.avg_bid_amount).toFixed(2)} лв.</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span>🏪 Стойност на търгове:</span>
                                    <strong>${parseFloat(data.stats.total_auction_value).toFixed(2)} лв.</strong>
                                </div>
                            </div>
                        </div>
        
                        <!-- Recent Activity -->
                        <div style="margin-bottom: 25px;">
                            <h4 style="color: #11998e; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; margin-bottom: 15px;">
                                🕐 Последна активност
                            </h4>
        `;
        
        if (data.recentBids.length > 0) {
            html += '<div>';
            data.recentBids.forEach(bid => {
                const isWinning = bid.is_winning;
                const bgColor = isWinning ? '#e8f5e8' : '#fff';
                const borderColor = isWinning ? '#28a745' : '#e9ecef';
                html += `
                    <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${bid.title}</strong> ${isWinning ? '👑' : ''}<br>
                                <small style="color: #666;">${formatDate(bid.bid_time)} • ${bid.status === 'active' ? '🟢 Активен' : '🔴 Приключил'}</small>
                            </div>
                            <div style="font-weight: bold; color: ${isWinning ? '#28a745' : '#11998e'};">${bid.bid_amount} лв.</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 8px;">Няма скорошна активност</div>';
        }
        
        html += `
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <h4 style="color: #11998e; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; margin-bottom: 15px;">
                                🏪 Създадени търгове (${data.created.length})
                            </h4>
        `;
        
        if (data.created.length > 0) {
            html += '<div>';
            data.created.forEach(auction => {
                const statusColor = auction.actual_status === 'active' ? '#28a745' : '#6c757d';
                const statusText = auction.actual_status === 'active' ? 'Активен' : 'Приключил';
                const currentPrice = auction.current_price || auction.starting_price;
                html += `
                    <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #333;">${auction.title}</strong><br>
                                <small style="color: #666;">Създаден: ${formatDate(auction.created_at)} • ${auction.bid_count} наддавания</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #11998e;">${currentPrice} лв.</div>
                                <small style="color: #666;">от ${auction.starting_price} лв.</small><br>
                                <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 8px;">Няма създадени търгове</div>';
        }
        
        html += `
                        </div>
                        
                        <div>
                            <h4 style="color: #11998e; border-bottom: 2px solid #e9ecef; padding-bottom: 5px; margin-bottom: 15px;">
                                🏆 Спечелени търгове (${data.won.length})
                            </h4>
        `;
        
        if (data.won.length > 0) {
            html += '<div>';
            data.won.forEach(auction => {
                html += `
                    <div style="background: linear-gradient(135deg, #f8fff8, #e8f5e8); border: 1px solid #d4edda; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #333;">${auction.title} 🏆</strong><br>
                                <small style="color: #666;">Спечелен: ${formatDate(auction.end_time)} • срещу ${auction.total_bidders} участници</small>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #28a745; font-size: 1.2rem;">${auction.bid_amount} лв.</div>
                                <small style="color: #28a745;">💰 Печеливша цена</small>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 8px;">Няма спечелени търгове</div>';
        }
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('userModal').style.display = 'flex';
        
    } catch (error) {
        alert('Грешка при зареждането на профила');
    }
}

function placeBidFromModal(auctionId) {
    if (!currentUser) {
        showToast('Необходим вход', 'Трябва да сте влезли в профила си, за да наддавате!', 'warning');
        return;
    }
    
    const bidInput = document.getElementById('modalBidInput');
    const bidAmount = parseFloat(bidInput.value);
    
    if (!bidAmount) { 
        showToast('Невалидна сума', 'Моля, въведете валидна сума за наддаване!', 'warning');
        return; 
    }

    if (bidAmount > 99999999.99) {
        showToast('Твърде голяма сума', 'Максималната възможна наддавка е 99,999,999.99 лв.!', 'warning');
        return;
    }

    fetch(`${BASE_URL}/backend/auctions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auction_id: auctionId, bid_amount: bidAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();

            updateAuctionAfterBid(auctionId, data.new_price, data.total_bids, data.top_bidders);
            
        } else {
            showToast('Грешка при наддаване', data.message || 'Възникна проблем при наддаването.', 'error');
        }
    })
    .catch(error => {
        showToast('Грешка при свързване', 'Не можахме да се свържем със сървъра. Моля, опитайте отново.', 'error');
    });
}

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

async function deleteAuction(auctionId) {
    if (!confirm('Сигурни ли сте, че искате да изтриете този търг? Това действие не може да бъде отменено.')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/backend/delete_auction.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auction_id: auctionId })
        });

        const data = await response.json();
        
        if (data.success) {
            showToast('Успех!', data.message, 'success');
            currentAuctions = currentAuctions.filter(auction => auction.id != auctionId);
            renderAuctions();
        } else {
            showToast('Грешка', data.message, 'error');
        }
    } catch (error) {
        showToast('Грешка', 'Възникна проблем при изтриването на търга. Моля, опитайте отново.', 'error');
    }
}

document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = `${BASE_URL}/frontend/pages/login.html`;
});

document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch(`${BASE_URL}/backend/logout.php`);
        window.location.reload();
    } catch (error) { console.error('Logout error:', error); }
});
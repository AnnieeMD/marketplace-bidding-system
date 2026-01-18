/* Main Application JavaScript - Index Page */

// Application state
let currentAuctions = [];
let currentSearch = '';
let currentCategory = '';
let currentPriceSort = '';
let currentUser = null;
let currentPage = 1;
const auctionsPerPage = 6;
let totalAuctions = 0;

// Initialize application
window.addEventListener('load', () => {
    initializeApp();
});

async function initializeApp() {
    await updateUserSession();
    loadAuctions();
    startCountdownTimer();
    startAuctionPolling();
    setupEventListeners();
    
    // Check session every 30 seconds to detect user changes
    setInterval(updateUserSession, 30000);
}

// Also check session when page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateUserSession();
    }
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchAuctions();
        });
    }

    // Login/Logout links
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/frontend/pages/login.html';
        });
    }

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/backend/api/logout.php');
                window.location.reload();
            } catch (error) { 
                console.error('Logout error:', error); 
            }
        });
    }
}

async function updateUserSession() {
    try {
        const data = await checkUserSession();
        
        // Always update currentUser, even if logged out
        const previousUser = currentUser;
        currentUser = data.logged_in ? data.user : null;
        
        updateUIForUser(data);
        
        // If user changed, re-render auctions to update ownership
        if (previousUser?.id !== currentUser?.id) {
            renderAuctions();
        }
    } catch (error) { 
        console.log('No active session');
        currentUser = null;
    }
}

function updateUIForUser(data) {
    const loginLink = document.getElementById('loginLink');
    const createAuctionLink = document.getElementById('createAuctionLink');
    const userMenu = document.getElementById('userMenu');
    const logoutLink = document.getElementById('logoutLink');
    const userName = document.getElementById('userName');

    if (data.logged_in) {
        hideElement(loginLink);
        showElement(createAuctionLink);
        showElement(userMenu);
        showElement(logoutLink);
        if (userName) userName.textContent = data.user.username;
    } else {
        showElement(loginLink);
        hideElement(createAuctionLink);
        hideElement(userMenu);
        hideElement(logoutLink);
    }
}

async function loadAuctions(page = 1) {
    try {
        const offset = (page - 1) * auctionsPerPage;
        let url = `/backend/api/auctions.php?search=${encodeURIComponent(currentSearch)}&category=${encodeURIComponent(currentCategory)}&status=all&limit=${auctionsPerPage}&offset=${offset}`;
        
        if (currentPriceSort) {
            url += `&price_sort=${encodeURIComponent(currentPriceSort)}`;
        }
        
        const data = await fetchJSON(url);
        
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
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(${currentPage - 1})">← Предишна</button>`;
    }
    
    // Page numbers
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
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="loadAuctions(${currentPage + 1})">Следваща →</button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Страница ${currentPage} от ${totalPages} • Общо ${totalAuctions} търга</div>`;
    
    container.innerHTML = paginationHTML;
}

function updateAuctionAfterBid(auctionId, newPrice, totalBids, topBidders) {
    // Update the auction in the currentAuctions array
    const auctionIndex = currentAuctions.findIndex(auction => auction.id == auctionId);
    if (auctionIndex !== -1) {
        currentAuctions[auctionIndex].current_price = newPrice;
        currentAuctions[auctionIndex].total_bids = totalBids;
        if (topBidders) {
            currentAuctions[auctionIndex].top_bidders = topBidders;
        }
        
        // Update the DOM elements immediately
        const auctionCard = document.querySelector(`[data-auction-id="${auctionId}"]`);
        if (auctionCard) {
            // Update the price
            const priceElement = auctionCard.querySelector('.auction-price');
            if (priceElement) {
                priceElement.textContent = `${newPrice} лв.`;
            }
            
            // Update bid input minimum value
            const bidInput = auctionCard.querySelector('.bid-input');
            if (bidInput) {
                bidInput.min = parseFloat(newPrice) + 1;
                bidInput.placeholder = "Наддайте...";
            }
            
            // Update top bidders display if topBidders data is provided
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
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categorySelect');
    const priceSort = document.getElementById('priceSort');

    currentSearch = searchInput ? searchInput.value.trim() : '';
    currentCategory = categorySelect ? categorySelect.value : '';
    currentPriceSort = priceSort ? priceSort.value : '';
    currentPage = 1; // Reset to first page on search
    loadAuctions(1);
}

async function placeBid(auctionId) {
    const bidInput = document.querySelector(`[data-auction-id="${auctionId}"] .bid-input`);
    const bidAmount = parseFloat(bidInput.value);
    
    if (!bidAmount) { 
        showToast('Невалидна сума', 'Моля, въведете валидна сума за наддаване!', 'warning');
        return; 
    }
    
    // Validate maximum bid amount
    if (bidAmount > 99999999.99) {
        showToast('Твърде голяма сума', 'Максималната възможна наддавка е 99,999,999.99 лв.!', 'warning');
        return;
    }
    
    try {
        const data = await fetchJSON('/backend/api/auctions.php', {
            method: 'POST',
            body: JSON.stringify({ auction_id: auctionId, bid_amount: bidAmount })
        });
        
        if (data.success) {
            bidInput.value = '';
            
            // Update the auction data in memory and UI immediately
            updateAuctionAfterBid(auctionId, data.new_price, data.total_bids, data.top_bidders);
            
        } else {
            showToast('Грешка при наддаване', data.message || 'Възникна проблем при наддаването.', 'error');
        }
    } catch (error) { 
        showToast('Грешка при свързване', 'Не можахме да се свържем със сървъра. Моля, опитайте отново.', 'error');
    }
}

// Export functions to global scope for inline event handlers
window.searchAuctions = searchAuctions;
window.placeBid = placeBid;
window.loadAuctions = loadAuctions;

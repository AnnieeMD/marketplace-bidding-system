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
                                            <div class="bidders-header"><i class="fas fa-crown"></i> Текущ водещ:</div>
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
                                        <input type="number" class="bid-input" placeholder="Наддайте..." min="${parseFloat(currentPrice) + 1}" step="0.01">
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
let allEventItems = []; 
let modal, modalContentBody, closeButton;
let allClickableEventItems = []; // To store all .event-item elements

// Extracts a readable date from event element
function extractDate(itemElement) {
    const d = new Date(itemElement.dataset.eventDate || '');
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    // Try to find a date in <p><strong>...</strong></p> or <b>Date: </b>
    const strong = itemElement.querySelector('p > strong');
    if (strong && strong.textContent.includes('-')) {
        return strong.textContent.split('-')[1].trim();
    }
    for (let b of itemElement.querySelectorAll('b')) {
        if (b.textContent.trim().toLowerCase() === 'date:' && b.nextSibling?.nodeType === Node.TEXT_NODE) {
            return b.nextSibling.textContent.trim();
        }
    }
    return 'Date N/A';
}

// Returns icon HTML for event type
function getEventIcon(eventType) {
    const icons = {
        workshop: ['construction', '#ff6b6b', 'Workshop'],
        speaker: ['campaign', '#a991ff', 'Speaker'],
        competition: ['emoji_events', '#6ec6ff', 'Competition'],
        intro: ['lightbulb', '#ffe066', 'Intro'],
    };
    const [icon, color, label] = icons[eventType] || ['event', '#b0b0b0', 'Other'];
    return `<i class="material-icons" style="vertical-align:middle;color:${color};margin-right:8px;">${icon}</i>`;
}

// Returns tag HTML for event type
function getEventTag(eventType) {
    const tags = {
        workshop: ['Workshop', '#ff6b6b'],
        speaker: ['Speaker', '#a991ff'],
        competition: ['Competition', '#6ec6ff'],
        intro: ['Intro', '#ffe066'],
    };
    const [label, color] = tags[eventType] || ['Other', '#b0b0b0'];
    return `<span class="event-type-tag" style="background:${color};">${label}</span>`;
}

// Converts event item to preview card and stores original content
function processEventItem(item) {
    item.dataset.originalContent = item.innerHTML;
    const img = item.querySelector('img');
    const title = (item.querySelector('h1,h3')?.textContent || 'Event Title').trim();
    const dateStr = extractDate(item);
    const eventType = item.dataset.eventType || '';
    let desc = Array.from(item.querySelectorAll('p')).find(p => p.textContent.trim().length > 30) || item.querySelector('p');
    desc = desc ? desc.textContent.trim() : 'No description available.';
    item.innerHTML = `
        <div class="event-header">
            <div class="event-title">${getEventIcon(eventType)}${title}</div>
            <div class="event-date">${dateStr}</div>
        </div>
        <div class="event-preview-content-row">
            <img src="${img?.src || 'https://via.placeholder.com/150x150.png?text=No+Image'}" alt="${title} event image" class="event-preview-image">
            <div class="event-preview-description-container">
                <p class="event-preview-description">${desc}</p>
            </div>
        </div>
    `;
}

// Modal open/close helpers
function openModalWithContent(htmlContent) {
    modalContentBody.innerHTML = htmlContent;
    modal.style.display = "block";
    document.body.classList.add('no-scroll');
    setTimeout(() => closeButton?.focus(), 10);
    openModalWithContent.lastFocused = document.activeElement;
}
function closeModal() {
    modal.style.display = "none";
    modalContentBody.innerHTML = "";
    document.body.classList.remove('no-scroll');
    openModalWithContent.lastFocused?.focus();
}

// Modal event listeners
function setupModalEventListeners() {
    modal = document.getElementById("eventModal");
    modalContentBody = document.getElementById("modalContentBody");
    closeButton = document.querySelector(".close-button");
    closeButton.tabIndex = 0;
    closeButton.role = 'button';
    closeButton.setAttribute('aria-label', 'Close modal');
    closeButton.onclick = closeModal;
    closeButton.onkeydown = e => ['Enter',' '].includes(e.key) && (e.preventDefault(), closeModal());
    window.onclick = e => { if (e.target == modal) closeModal(); };
    window.addEventListener('keydown', e => { if (modal.style.display === 'block' && e.key === 'Escape') closeModal(); });
}

// Make event items clickable and keyboard accessible
function addClickListenersToEvents(items) {
    // Only include visible items for keyboard navigation
    items.forEach(item => {
        item.tabIndex = 0;
        item.role = 'button';
        item.setAttribute('aria-label', item.querySelector('.event-title')?.textContent || 'Event');
        item.onclick = function() {
            openModalWithContent(this.dataset.originalContent || this.innerHTML);
        };
        item.onkeydown = e => {
            if (["Enter", " "].includes(e.key)) {
                e.preventDefault();
                item.click();
            }
            // Let Tab, Shift+Tab, Arrow keys, etc. use browser default for focus navigation
        };
    });
}

let currentSearchTerm = '';
// Filters and sorts events in the grid based on type, search term, and sort order.
function filterEvents(eventType) {
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.classList.remove('active');
    });
    // Set active button by eventType
    const activeButton = Array.from(filterButtons).find(btn => {
        if (eventType === 'all') return btn.classList.contains('all');
        return btn.classList.contains(eventType);
    });
    if (activeButton) {
        activeButton.classList.add('active');
    }
    // Use sort order from toggle
    const sortOrder = window.eventSortOrder || 'desc';
    const sortedEvents = Array.from(allEventItems).sort((a, b) => {
        const dateA = new Date(a.dataset.eventDate);
        const dateB = new Date(b.dataset.eventDate);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    const grid = document.querySelector('.events-grid');
    // Remove any previous empty message
    let emptyMsg = grid.querySelector('.no-events-message');
    if (emptyMsg) emptyMsg.remove();
    // Detach all items first to reorder them correctly.
    sortedEvents.forEach(item => item.remove());
    let anyVisible = false;
    sortedEvents.forEach(item => {
        // Search filter: match title or description
        const titleDiv = item.querySelector('.event-title');
        const descDiv = item.querySelector('.event-preview-description');
        const titleText = titleDiv ? titleDiv.textContent.toLowerCase() : '';
        const descText = descDiv ? descDiv.textContent.toLowerCase() : '';
        const searchMatch = !currentSearchTerm || titleText.includes(currentSearchTerm) || descText.includes(currentSearchTerm);
        if ((eventType === 'all' || item.dataset.eventType === eventType) && searchMatch) {
            grid.appendChild(item);
            anyVisible = true;
        }
    });
    if (!anyVisible) {
        const msg = document.createElement('div');
        msg.className = 'no-events-message';
        msg.style.cssText = 'text-align:center; color:#bbb; font-size:1.2em; padding:40px 0;';
        msg.textContent = 'Whoops, no matching events found!';
        grid.appendChild(msg);
    }
}

// Sets up click and keyboard handlers for filter buttons.
function setupFilterButtonClicks() {
    document.querySelectorAll('.filter-button').forEach(btn => {
        btn.setAttribute('tabindex', '0');
        btn.onclick = function() {
            let type = 'all';
            if (btn.classList.contains('workshop')) type = 'workshop';
            else if (btn.classList.contains('speaker')) type = 'speaker';
            else if (btn.classList.contains('competition')) type = 'competition';
            else if (btn.classList.contains('intro')) type = 'intro';
            filterEvents(type);
        };
        btn.onkeydown = function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        };
    });
}

// --- Main Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Get all items that should be treated as events (grid + featured)
    allClickableEventItems = Array.from(document.querySelectorAll('.event-item'));
    
    // Get grid items specifically for filtering logic
    allEventItems = Array.from(document.querySelectorAll('.events-grid .event-item'));

    // Process all clickable items to generate previews and store original content
    allClickableEventItems.forEach(processEventItem);
    
    setupModalEventListeners();
    addClickListenersToEvents(allClickableEventItems); // Add click listeners to all processed items
    setupFilterButtonClicks();

    // Add date sort toggle button to filter bar
    (function addSortToggleButton() {
        const filterBar = document.querySelector('.filter-bar');
        if (!filterBar) return;
        const sortBtn = document.createElement('button');
        sortBtn.className = 'sort-toggle-button';
        sortBtn.setAttribute('aria-label', 'Toggle event date sort order');
        sortBtn.setAttribute('tabindex', '0');
        sortBtn.innerHTML = '<span class="material-icons" style="vertical-align:middle;">swap_vert</span> Newest First';
        filterBar.appendChild(sortBtn);
        sortBtn.addEventListener('click', function() {
            window.eventSortOrder = (window.eventSortOrder === 'asc') ? 'desc' : 'asc';
            updateSortButtonText();
            // Keep current filter (active button)
            const activeBtn = document.querySelector('.filter-button.active');
            let filterType = 'all';
            if (activeBtn) {
                if (activeBtn.classList.contains('workshop')) filterType = 'workshop';
                else if (activeBtn.classList.contains('speaker')) filterType = 'speaker';
                else if (activeBtn.classList.contains('competition')) filterType = 'competition';
                else if (activeBtn.classList.contains('intro')) filterType = 'intro';
            }
            filterEvents(filterType);
        });
        sortBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        function updateSortButtonText() {
            if (window.eventSortOrder === 'asc') {
                sortBtn.innerHTML = '<span class="material-icons" style="vertical-align:middle;">swap_vert</span> Oldest First';
            } else {
                sortBtn.innerHTML = '<span class="material-icons" style="vertical-align:middle;">swap_vert</span> Newest First';
            }
        }
        window.eventSortOrder = 'desc'; // Default: newest first
        updateSortButtonText();
    })();

    // Setup search bar
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.trim().toLowerCase();
            // Keep current filter (active button)
            const activeBtn = document.querySelector('.filter-button.active');
            let filterType = 'all';
            if (activeBtn) {
                if (activeBtn.classList.contains('workshop')) filterType = 'workshop';
                else if (activeBtn.classList.contains('speaker')) filterType = 'speaker';
                else if (activeBtn.classList.contains('competition')) filterType = 'competition';
                else if (activeBtn.classList.contains('intro')) filterType = 'intro';
                else if (activeBtn.classList.contains('all')) filterType = 'all';
            }
            filterEvents(filterType);
        });
    }

    // Center single event in upcoming-events-row
    document.querySelectorAll('.upcoming-events-row').forEach(row => {
        const events = row.querySelectorAll('.event-item.featured-event');
        if (events.length === 1) {
            events[0].style.marginLeft = 'auto';
            events[0].style.marginRight = 'auto';
        } else {
            events.forEach(ev => {
                ev.style.marginLeft = '';
                ev.style.marginRight = '';
            });
        }
    });
    // Center single event in events-grid (grid layout)
    document.querySelectorAll('.events-grid').forEach(grid => {
        const events = grid.querySelectorAll('.event-item');
        if (events.length === 1) {
            events[0].style.marginLeft = 'auto';
            events[0].style.marginRight = 'auto';
            events[0].style.maxWidth = '50%';
        } else {
            events.forEach(ev => {
                ev.style.marginLeft = '';
                ev.style.marginRight = '';
                ev.style.maxWidth = '';
            });
        }
    });

    // Show message if no upcoming events
    document.querySelectorAll('.upcoming-events-row').forEach(row => {
        const events = row.querySelectorAll('.event-item.featured-event');
        let emptyMsg = row.querySelector('.no-events-message');
        if (emptyMsg) emptyMsg.remove();
        if (events.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'no-events-message';
            msg.style.cssText = 'text-align:center; color:#bbb; font-size:1.2em; padding:40px 0; width:100%';
            msg.textContent = 'No upcoming events right now, come back later!';
            row.appendChild(msg);
        }
    });

    // Setup upcoming events row arrows
    document.querySelectorAll('.upcoming-events-row-wrapper').forEach(wrapper => {
        const row = wrapper.querySelector('.upcoming-events-row');
        const leftArrow = wrapper.querySelector('.upcoming-events-arrow.left');
        const rightArrow = wrapper.querySelector('.upcoming-events-arrow.right');
        function updateArrows() {
            // Show arrows only if scrollable
            if (row.scrollWidth > row.clientWidth + 5) {
                leftArrow.style.display = 'flex';
                rightArrow.style.display = 'flex';
                // Hide left if at start, right if at end
                leftArrow.style.opacity = row.scrollLeft > 5 ? '0.85' : '0.3';
                rightArrow.style.opacity = (row.scrollLeft + row.clientWidth < row.scrollWidth - 5) ? '0.85' : '0.3';
            } else {
                leftArrow.style.display = 'none';
                rightArrow.style.display = 'none';
            }
        }
        leftArrow.onclick = () => {
            row.scrollBy({ left: -row.clientWidth * 0.8, behavior: 'smooth' });
        };
        rightArrow.onclick = () => {
            row.scrollBy({ left: row.clientWidth * 0.8, behavior: 'smooth' });
        };
        row.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);
        setTimeout(updateArrows, 200); // Initial update after layout
    });

    // On initial load, apply the 'all' filter.
    filterEvents('all');
});
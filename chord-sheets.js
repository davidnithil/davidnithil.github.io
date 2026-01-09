// ============================================
// CHORD SHEETS APP - JavaScript
// ============================================

// Storage Keys
const STORAGE_KEYS = {
    SONGS: 'chordSheets_songs',
    FAVORITES: 'chordSheets_favorites',
    USAGE_STATS: 'chordSheets_usageStats'
};

// Initialize data
function initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.SONGS)) {
        localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USAGE_STATS)) {
        localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify({}));
    }
}

// Get all songs
function getSongs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SONGS) || '[]');
}

// Save songs
function saveSongs(songs) {
    localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
}

// Get favorites
function getFavorites() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
}

// Toggle favorite
function toggleFavorite(songId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(songId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(songId);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites.includes(songId);
}

// Check if favorite
function isFavorite(songId) {
    return getFavorites().includes(songId);
}

// Get usage stats
function getUsageStats() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USAGE_STATS) || '{}');
}

// Update usage stats
function updateUsageStats(songId) {
    const stats = getUsageStats();
    if (!stats[songId]) {
        stats[songId] = {
            count: 0,
            lastUsed: null
        };
    }
    stats[songId].count++;
    stats[songId].lastUsed = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
    return stats[songId];
}

// Get usage stat for a song
function getUsageStat(songId) {
    const stats = getUsageStats();
    return stats[songId] || { count: 0, lastUsed: null };
}

// Add new song
function addSong(songData) {
    const songs = getSongs();
    const newSong = {
        id: Date.now().toString(),
        name: songData.name,
        artist: songData.artist || '',
        key: songData.key || '',
        image: songData.image, // Base64 encoded image
        dateAdded: new Date().toISOString()
    };
    songs.push(newSong);
    saveSongs(songs);
    return newSong;
}

// Delete song
function deleteSong(songId) {
    const songs = getSongs();
    const filtered = songs.filter(s => s.id !== songId);
    saveSongs(filtered);
    
    // Remove from favorites
    const favorites = getFavorites();
    const favIndex = favorites.indexOf(songId);
    if (favIndex > -1) {
        favorites.splice(favIndex, 1);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
    
    // Remove usage stats
    const stats = getUsageStats();
    delete stats[songId];
    localStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
}

// Convert image to base64
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// Display songs
function displaySongs(filter = 'all', searchQuery = '') {
    const grid = document.getElementById('songs-grid');
    const emptyState = document.getElementById('empty-state');
    const songCount = document.getElementById('song-count');
    const songsTitle = document.getElementById('songs-title');
    
    let songs = getSongs();
    const favorites = getFavorites();
    const stats = getUsageStats();
    
    // Apply filter
    if (filter === 'favorites') {
        songs = songs.filter(s => favorites.includes(s.id));
        songsTitle.textContent = 'Favorite Songs';
    } else if (filter === 'recent') {
        songs = songs.filter(s => stats[s.id] && stats[s.id].lastUsed)
            .sort((a, b) => {
                const aDate = stats[a.id]?.lastUsed || '';
                const bDate = stats[b.id]?.lastUsed || '';
                return bDate.localeCompare(aDate);
            });
        songsTitle.textContent = 'Recently Used';
    } else if (filter === 'popular') {
        songs = songs.filter(s => stats[s.id])
            .sort((a, b) => {
                const aCount = stats[a.id]?.count || 0;
                const bCount = stats[b.id]?.count || 0;
                return bCount - aCount;
            });
        songsTitle.textContent = 'Most Used Songs';
    } else {
        songsTitle.textContent = 'All Songs';
    }
    
    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        songs = songs.filter(s => 
            s.name.toLowerCase().includes(query) ||
            (s.artist && s.artist.toLowerCase().includes(query)) ||
            (s.key && s.key.toLowerCase().includes(query))
        );
    }
    
    // Update count
    songCount.textContent = `${songs.length} song${songs.length !== 1 ? 's' : ''}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    if (songs.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    // Display songs
    songs.forEach(song => {
        const card = createSongCard(song);
        grid.appendChild(card);
    });
}

// Create song card
function createSongCard(song) {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.dataset.songId = song.id;
    
    const stats = getUsageStat(song.id);
    const isFav = isFavorite(song.id);
    
    card.innerHTML = `
        <div class="song-card-image">
            <img src="${song.image}" alt="${song.name}">
            <div class="song-card-overlay">
                <button class="song-card-btn" onclick="viewSong('${song.id}')">
                    👁️ View
                </button>
            </div>
            ${isFav ? '<span class="favorite-badge">⭐</span>' : ''}
        </div>
        <div class="song-card-info">
            <h3 class="song-card-name">${escapeHtml(song.name)}</h3>
            ${song.artist ? `<p class="song-card-artist">${escapeHtml(song.artist)}</p>` : ''}
            <div class="song-card-meta">
                ${song.key ? `<span class="song-key">Key: ${escapeHtml(song.key)}</span>` : ''}
                ${stats.count > 0 ? `<span class="song-usage">Used ${stats.count}x</span>` : ''}
            </div>
        </div>
    `;
    
    return card;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// View song
function viewSong(songId) {
    const songs = getSongs();
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    
    // Update usage stats
    const stats = updateUsageStats(songId);
    
    // Update modal
    document.getElementById('view-song-name').textContent = song.name;
    document.getElementById('view-song-details').textContent = 
        `${song.artist || 'Unknown Artist'}${song.key ? ` • Key: ${song.key}` : ''}`;
    document.getElementById('view-chord-image').src = song.image;
    document.getElementById('view-usage-count').textContent = stats.count;
    document.getElementById('view-last-used').textContent = formatDate(stats.lastUsed);
    
    // Update favorite button
    const favoriteBtn = document.getElementById('favorite-btn');
    const isFav = isFavorite(songId);
    favoriteBtn.classList.toggle('active', isFav);
    favoriteBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
    
    // Set up event handlers
    favoriteBtn.onclick = () => {
        const newFavState = toggleFavorite(songId);
        favoriteBtn.classList.toggle('active', newFavState);
        favoriteBtn.title = newFavState ? 'Remove from favorites' : 'Add to favorites';
        displaySongs(getCurrentFilter(), getCurrentSearch());
    };
    
    document.getElementById('delete-btn').onclick = () => {
        if (confirm(`Are you sure you want to delete "${song.name}"?`)) {
            deleteSong(songId);
            closeViewModal();
            displaySongs(getCurrentFilter(), getCurrentSearch());
            showNotification('Song deleted', 'success');
        }
    };
    
    // Show modal
    document.getElementById('view-modal').classList.add('active');
}

// Close view modal
function closeViewModal() {
    document.getElementById('view-modal').classList.remove('active');
}

// Get current filter
function getCurrentFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// Get current search
function getCurrentSearch() {
    return document.getElementById('search-input').value;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize upload form
function initUploadForm() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('chord-image');
    const fileUploadArea = document.getElementById('file-upload-area');
    const filePreview = document.getElementById('file-preview');
    const previewImage = document.getElementById('preview-image');
    const removePreview = document.getElementById('remove-preview');
    const uploadModal = document.getElementById('upload-modal');
    
    // File input change
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await imageToBase64(file);
                previewImage.src = base64;
                fileUploadArea.querySelector('.file-upload-preview').style.display = 'none';
                filePreview.style.display = 'block';
            } catch (error) {
                showNotification('Error loading image', 'error');
            }
        }
    });
    
    // Remove preview
    removePreview.addEventListener('click', () => {
        fileInput.value = '';
        filePreview.style.display = 'none';
        fileUploadArea.querySelector('.file-upload-preview').style.display = 'block';
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            fileInput.files = e.dataTransfer.files;
            try {
                const base64 = await imageToBase64(file);
                previewImage.src = base64;
                fileUploadArea.querySelector('.file-upload-preview').style.display = 'none';
                filePreview.style.display = 'block';
            } catch (error) {
                showNotification('Error loading image', 'error');
            }
        }
    });
    
    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const file = fileInput.files[0];
        
        if (!file) {
            showNotification('Please select an image', 'error');
            return;
        }
        
        try {
            const base64 = await imageToBase64(file);
            const songData = {
                name: formData.get('songName'),
                artist: formData.get('artistName'),
                key: formData.get('songKey'),
                image: base64
            };
            
            addSong(songData);
            showNotification('Song uploaded successfully!', 'success');
            form.reset();
            filePreview.style.display = 'none';
            fileUploadArea.querySelector('.file-upload-preview').style.display = 'block';
            uploadModal.classList.remove('active');
            displaySongs(getCurrentFilter(), getCurrentSearch());
        } catch (error) {
            showNotification('Error uploading song', 'error');
        }
    });
}

// Initialize modals
function initModals() {
    const uploadModal = document.getElementById('upload-modal');
    const viewModal = document.getElementById('view-modal');
    const uploadBtn = document.getElementById('upload-btn');
    const closeUploadModal = document.getElementById('close-upload-modal');
    const cancelUpload = document.getElementById('cancel-upload');
    
    // Open upload modal
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
    });
    
    // Close upload modal
    closeUploadModal.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });
    
    cancelUpload.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });
    
    // Close view modal
    const closeViewModalBtn = document.getElementById('close-view-modal');
    closeViewModalBtn.addEventListener('click', () => {
        closeViewModal();
    });
    
    // Close on backdrop click
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.remove('active');
        }
    });
    
    viewModal.addEventListener('click', (e) => {
        // Only close if clicking the backdrop (modal itself), not the modal content
        if (e.target === viewModal) {
            closeViewModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            uploadModal.classList.remove('active');
            closeViewModal();
        }
    });
}

// Initialize filters
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displaySongs(btn.dataset.filter, getCurrentSearch());
        });
    });
}

// Initialize search
function initSearch() {
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            displaySongs(getCurrentFilter(), e.target.value);
        }, 300);
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    initUploadForm();
    initModals();
    initFilters();
    initSearch();
    displaySongs();
});

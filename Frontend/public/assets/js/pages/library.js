import Auth from '../auth.js';
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

export async function init() {
    console.log("Initializing Library...");
    
    // Check if user is logged in
    const user = await Auth.getCurrentUser();
    if (!user) {
        // Show guest view or redirect? 
        // For now, let's assume we show a "Login" prompt in the grid or similar.
        // But the router usually allows access.
        // We will just show empty state or guest message.
        document.getElementById('library-grid').innerHTML = `
            <div class="col-span-full text-center py-20 text-text-secondary">
                <h2 class="text-xl text-white font-bold mb-2">Log in to view your library</h2>
                <p>Save songs, create playlists, and follow artists.</p>
                <div class="mt-6">
                    <a href="/login" class="bg-primary text-white font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform inline-block">Log in</a>
                </div>
            </div>
        `;
        return;
    }

    loadLikedSongsStats();
    loadUserPlaylists();
    setupCreatePlaylist();
}

async function loadLikedSongsStats() {
    try {
        const response = await api.request('/users/liked-tracks'); 
        // Should use a lighter endpoint if available, but this works for now. 
        // If the list is huge, we might want a stats endpoint.
        // But let's assume pagination or list return.
        // Wait, liked-tracks returns the list.
        const likedTracks = response.data.likedTracks || response.data || [];
        
        const count = likedTracks.length;
        document.getElementById('liked-songs-count').textContent = `${count} liked songs`;
        
        // Preview text: "Artist1, Artist2..."
        if (count > 0) {
            const artists = likedTracks.slice(0, 3).map(t => t.artist?.name || t.artist?.username || "Unknown").join(", ");
            document.getElementById('liked-songs-preview-text').textContent = artists + (count > 3 ? "..." : "");
        } else {
            document.getElementById('liked-songs-preview-text').textContent = "No songs yet";
        }
    } catch (error) {
        console.error("Failed to load liked stats", error);
    }
}

async function loadUserPlaylists() {
    const grid = document.getElementById('library-grid');
    // Keep the first 2 static items (Liked Songs + Create Card)
    // We can query them to preserve or just append.
    // Easier to clear and rebuild or just append.
    
    // Identify where static ends. 
    // I made the static items part of the HTML. 
    // I will append new items after them.
    
    // Actually, on re-init we don't want to duplicate.
    // Let's remove any previously loaded playlists (elements with data-type="playlist-card")
    const existing = document.querySelectorAll('[data-type="playlist-card"]');
    existing.forEach(e => e.remove());

    try {
        const response = await api.request('/playlists/me');
        const playlists = response.data || [];

        playlists.forEach(playlist => {
            const card = createPlaylistCard(playlist);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Failed to load playlists", error);
    }
}

function createPlaylistCard(playlist) {
    const div = document.createElement('div');
    div.className = "group cursor-pointer bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 relative";
    div.setAttribute('data-type', 'playlist-card');
    div.onclick = () => window.navigateToPlaylist(playlist._id);

    // Image logic: if playlist has special cover or default
    const image = playlist.coverImage || 'assets/images/album/default_album.png'; 
    // Actually for playlists usually we generate a collage or use a placeholder
    
    div.innerHTML = `
        <div class="relative w-full aspect-square mb-4 rounded-lg overflow-hidden shadow-lg bg-[#282828] flex items-center justify-center">
            ${ playlist.coverImage 
                ? `<img src="${playlist.coverImage}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                : `<svg class="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`
            }
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                 <button class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95">
                     <svg class="w-6 h-6 ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 </button>
            </div>
        </div>
        <h3 class="text-white font-bold truncate mb-1">${playlist.name}</h3>
        <p class="text-sm text-text-secondary truncate">By ${playlist.owner?.username || "You"}</p>
    `;
    return div;
}

function setupCreatePlaylist() {
    const confirmBtn = document.getElementById('create-playlist-confirm');
    const input = document.getElementById('new-playlist-name');
    
    if (confirmBtn) {
        // Remove old listeners to prevent dupes (if init called multiple times)
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.onclick = async () => {
            const name = input.value.trim();
            if (!name) return displayMessage("Please enter a playlist name", "error");
            
            toggleLoader(true);
            try {
                await api.request('/playlists', {
                    method: 'POST',
                    body: { name, description: "Created via Beatify Web" }
                });
                displayMessage("Playlist created!", "success");
                document.getElementById('create-playlist-modal').classList.add('hidden');
                input.value = '';
                loadUserPlaylists(); // Refresh
            } catch (error) {
                console.error("Create playlist failed", error);
                displayMessage("Failed to create playlist", "error");
            } finally {
                toggleLoader(false);
            }
        };
    }
}

// Global Nav Helper
window.navigateToPlaylist = (id) => {
    window.navigateTo(`/playlist?id=${id}`);
};

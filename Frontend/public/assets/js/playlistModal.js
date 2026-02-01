
import api from './api.js';
import { displayMessage, toggleLoader } from './utils.js';

/**
 * Handles "Add to Playlist" functionality
 */

let currentTrackIdToAdd = null;

export async function openAddToPlaylistModal(trackId) {
    if (!trackId) return;
    currentTrackIdToAdd = trackId;

    const modal = document.getElementById('add-to-playlist-modal');
    const listContainer = document.getElementById('add-to-playlist-list');
    
    if (!modal || !listContainer) return;

    modal.classList.remove('hidden');
    listContainer.innerHTML = '<div class="text-center text-text-secondary py-8"><div class="spinner border-2 border-primary border-t-transparent rounded-full w-6 h-6 animate-spin mx-auto mb-2"></div>Loading...</div>';

    try {
        // Fetch user playlists
        // Assuming we have an endpoint for 'my-playlists' or similar filter
        const response = await api.request('/playlists/me');
        const playlists = response.data || [];

        if (playlists.length === 0) {
             listContainer.innerHTML = `
                <div class="text-center text-text-secondary py-8 px-4">
                    <p class="mb-4">You don't have any playlists yet.</p>
                    <a href="/library" class="text-primary font-bold hover:underline">Create one in Library</a>
                </div>
             `;
             return;
        }

        listContainer.innerHTML = playlists.map(playlist => `
            <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition-colors group" onclick="window.addToPlaylistConfirm('${playlist._id}')">
                <div class="w-12 h-12 bg-[#333] rounded overflow-hidden flex-shrink-0">
                    ${playlist.coverImage 
                        ? `<img src="${playlist.coverImage}" class="w-full h-full object-cover">`
                        : `<svg class="w-6 h-6 text-white/20 m-auto mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-white font-medium truncate group-hover:text-primary transition-colors">${playlist.name}</h4>
                    <p class="text-xs text-text-secondary truncate">${playlist.tracks ? playlist.tracks.length : 0} songs</p>
                </div>
                <div class="text-white/20 group-hover:text-primary">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Failed to load playlists", error);
        listContainer.innerHTML = '<div class="text-center text-red-500 py-8">Failed to load playlists</div>';
    }
}

// Global handler for the click
window.addToPlaylistConfirm = async (playlistId) => {
    if (!currentTrackIdToAdd || !playlistId) return;

    const modal = document.getElementById('add-to-playlist-modal');
    // Show spinner/loading state on the clicked item? 
    // Or global loader. Global loader is easier.
    toggleLoader(true);

    try {
        await api.request(`/playlists/${playlistId}/tracks`, {
            method: 'POST',
            body: { trackId: currentTrackIdToAdd }
        });
        
        displayMessage("Added to playlist", "success");
        modal.classList.add('hidden');
        currentTrackIdToAdd = null;

    } catch (error) {
        console.error("Failed to add to playlist", error);
        if (error.status === 409 || error.message?.includes("already")) {
            displayMessage("Song already in playlist", "info");
        } else {
            displayMessage("Failed to add song", "error");
        }
    } finally {
        toggleLoader(false);
    }
};

// Expose open function
window.openAddToPlaylistModal = openAddToPlaylistModal;

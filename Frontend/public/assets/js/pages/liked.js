
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const tracksContainer = document.getElementById('playlist-tracks');
const playlistStatsCount = document.getElementById('playlist-stats-count');

async function renderLikedTracks() {
    toggleLoader(true);
    try {
        const response = await api.request('/users/liked-tracks'); 
        // Assuming backend endpoint exists: GET /api/v1/users/liked-tracks 
        // If not, we might need to fetch user profile or similar.
        // For now let's hope this endpoint is or will be available.
        // If not available, we might need to create it in backend step.
        
        const tracks = response.data || [];

        // Update stats
        if (playlistStatsCount) playlistStatsCount.textContent = `${tracks.length} songs`;

        // Render Tracks
        if (tracks.length === 0) {
            tracksContainer.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center text-text-secondary">
                        <div class="flex flex-col items-center justify-center">
                             <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">No liked songs yet</h3>
                            <p class="mb-6">Save songs you love by tapping the heart icon.</p>
                            <a href="/discover" class="px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Find Songs</a>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tracksContainer.innerHTML = tracks.map((track, index) => `
            <tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick="window.playTrack('${track._id}')">
                <td class="px-4 py-3 text-center text-text-secondary group-hover:text-white">
                    <span class="group-hover:hidden">${index + 1}</span>
                    <button class="hidden group-hover:inline-block text-white" onclick="event.stopPropagation(); window.playTrack('${track._id}')">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                        <img src="${track.coverImage || 'assets/images/default-track.png'}" class="w-10 h-10 rounded object-cover" alt="${track.title}">
                        <div>
                            <div class="text-white font-medium truncate">${track.title}</div>
                            <div class="text-text-secondary text-xs hover:underline">${track.artist || 'Unknown Artist'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-right">
                    <button class="text-primary hover:scale-110 transition-transform" onclick="event.stopPropagation(); toggleLike('${track._id}')">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Auto-queue these tracks so next/prev works
        if (window.player) {
            window.player.setQueue(tracks);
        }

    } catch (error) {
        console.error('Error fetching liked tracks:', error);
        displayMessage('Failed to load liked songs', 'error');
    } finally {
        toggleLoader(false);
    }
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    renderLikedTracks();
});

// Expose for usage
window.toggleLike = async (trackId) => {
    // Logic to unlike. 
    // This would likely call an API to toggle like, then re-render the list or remove the row locally.
    try {
        await api.request(`/tracks/${trackId}/like`, { method: 'POST' }); 
        // Assuming toggle endpoint. If we are on liked page, toggling usually means unliking.
        displayMessage("Removed from Liked Songs", "success");
        renderLikedTracks(); // Refresh list
    } catch(e) {
        console.error(e);
        displayMessage("Failed to update like status", "error");
    }
};

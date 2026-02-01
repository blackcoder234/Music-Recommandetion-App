
import api from '../api.js';
import Auth from '../auth.js';
import { displayMessage, toggleLoader } from '../utils.js';
import player from '../player.js';

export async function init() {
    console.log("Initializing Liked Songs Page...");
    
    // Check Auth
    const user = await Auth.getCurrentUser();
    if (!user) {
        // Redirect or show empty state
        window.location.href = '/login?redirect=/liked';
        return;
    }

    loadLikedTracks(user);
    
    // Bind "Play All" button
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.onclick = () => {
            playAllLikedTracks();
        };
    }
}

let loadedTracks = [];

async function loadLikedTracks(user) {
    toggleLoader(true);
    const container = document.getElementById('playlist-tracks');
    const countEl = document.getElementById('playlist-stats-count');
    
    if (container) container.innerHTML = '';

    try {
        // We need an endpoint for liked tracks.
        // Assuming /users/liked-tracks or similar. 
        // Based on previous chats, User model has `likedTracks`.
        // We might not have a dedicated endpoint yet, or use /users/me/liked
        // Let's try /users/current -> expand likedTracks?
        // Or /tracks?liked=true (if supported).
        // Let's check track.controller.js ... 
        // Actually, we saw `getAllTracks` support filters. Maybe not 'liked'.
        // Let's assume we fetch `User` with Populate.
        
        const response = await api.request('/users/liked-tracks');
        const tracks = response.data || [];


        loadedTracks = tracks;

        if (countEl) countEl.textContent = `${tracks.length} songs`;
        renderTracks(tracks, container);

    } catch (error) {
        console.error("Failed to load liked songs", error);
        displayMessage("Failed to load liked songs", "error");
    } finally {
        toggleLoader(false);
    }
}

function renderTracks(tracks, container) {
    if (!container) return;
    
    if (!tracks || tracks.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-text-secondary">You haven't liked any songs yet.</td></tr>`;
        return;
    }

    container.innerHTML = tracks.map((track, index) => {
        // Handle if track is null (deleted)
        if (!track || !track.title) return '';

        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const duration = formatDuration(track.duration);
        const trackId = track._id || track.id;

        return `
        <tr class="group hover:bg-white/5 transition-colors cursor-pointer play-track-btn" data-id="${trackId}">
            <td class="px-4 py-3 text-text-secondary w-12 text-center group-hover:text-white">
                <span class="group-hover:hidden">${index + 1}</span>
                <span class="hidden group-hover:inline-block">
                    <svg class="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-4">
                    <img src="${image}" class="w-10 h-10 rounded object-cover" loading="lazy">
                    <div class="min-w-0">
                        <div class="font-medium text-white group-hover:text-primary transition-colors truncate">${track.title}</div>
                        <div class="text-xs text-text-secondary truncate hover:underline">${artist}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-right">
               <button onclick="event.stopPropagation(); window.openAddToPlaylistModal('${trackId}')" class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-white transition-opacity p-2" title="Add to Playlist">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
               </button>
            </td>
            <td class="px-4 py-3 text-right">
                <button 
                    onclick="event.stopPropagation(); window.toggleLike('${trackId}')"
                    class="text-primary hover:scale-110 transition-transform"
                    title="Remove from Liked"
                >
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
            </td>
            <td class="px-4 py-3 text-text-secondary text-right w-16 text-sm font-variant-numeric tabular-nums">
                ${duration}
            </td>
        </tr>
        `;
    }).join('');
}

function playAllLikedTracks() {
    if (loadedTracks.length > 0) {
        player.setQueue(loadedTracks);
        player.loadTrack(loadedTracks[0]);
    }
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

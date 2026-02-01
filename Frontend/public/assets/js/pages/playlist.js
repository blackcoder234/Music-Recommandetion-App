import Auth from '../auth.js';
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';
import player from '../player.js';

let currentPlaylist = null;
let playlistTracks = [];
let currentUser = null;

export async function init() {
    console.log("Initializing Playlist Page...");
    currentUser = await Auth.getCurrentUser();
    
    // Check URL params
    const query = new URLSearchParams(window.location.search);
    const playlistId = query.get('id');

    if (playlistId) {
        loadPlaylistDetails(playlistId);
    } else {
        // Redirect to library if no id
        window.location.href = '/library';
    }
}

async function loadPlaylistDetails(id) {
    toggleLoader(true);
    
    // Elements
    const imgEl = document.getElementById('playlist-image');
    const placeholderIcon = document.getElementById('playlist-placeholder-icon');
    const titleEl = document.getElementById('playlist-title');
    const descEl = document.getElementById('playlist-description');
    const statsEl = document.getElementById('hero-stats-row');
    const tracksContainer = document.getElementById('playlist-tracks');
    const playAllBtn = document.getElementById('play-all-btn');
    const deleteBtn = document.getElementById('delete-playlist-btn');

    if (tracksContainer) tracksContainer.innerHTML = '';

    try {
        const response = await api.request(`/playlists/${id}`, { suppressAuthRedirect: true });
        currentPlaylist = response.data;
        
        // Metadata
        if (currentPlaylist.coverImage) {
             if(imgEl) {
                 imgEl.src = currentPlaylist.coverImage;
                 imgEl.classList.remove('hidden');
             }
             if(placeholderIcon) placeholderIcon.classList.add('hidden');
        } else {
             if(imgEl) imgEl.classList.add('hidden');
             if(placeholderIcon) placeholderIcon.classList.remove('hidden');
        }

        if(titleEl) titleEl.textContent = currentPlaylist.name;
        if(descEl) descEl.textContent = currentPlaylist.description || "Public Playlist";
        
        const ownerName = currentPlaylist.owner?.username || "Admin";
        const trackCount = currentPlaylist.tracks ? currentPlaylist.tracks.length : 0;
        const totalDuration = calculateTotalDuration(currentPlaylist.tracks);

        if (statsEl) {
            statsEl.innerHTML = `
                <span class="font-semibold text-white">${ownerName}</span>
                <span>•</span>
                <span>${trackCount} songs, ${totalDuration}</span>
            `;
        }

        // Show/Hide Delete Button
        // We need robust user check. currentUser._id vs playlist.owner._id
        if (deleteBtn && currentUser && currentPlaylist.owner && (currentUser._id === currentPlaylist.owner._id || currentUser.id === currentPlaylist.owner.id || currentUser._id === currentPlaylist.owner)) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.onclick = () => confirmDeletePlaylist(currentPlaylist._id);
        } else {
            if(deleteBtn) deleteBtn.classList.add('hidden');
        }

        // Tracks
        playlistTracks = currentPlaylist.tracks || [];
        renderTracks(playlistTracks, tracksContainer, currentPlaylist.owner);
        
        // Bind Play All
        if (playAllBtn) {
            playAllBtn.onclick = () => {
                if (playlistTracks.length > 0) {
                     // We should map playlistTracks to pure track objects if they are populated weirdly, 
                     // but usually they are full track objects or close to it.
                     player.setQueue(playlistTracks);
                     player.loadTrack(playlistTracks[0]);
                }
            };
        }

    } catch (error) {
        console.error("Failed to load playlist details", error);
        displayMessage("Failed to load playlist.", "error");
        if(titleEl) titleEl.textContent = "Playlist Not Found";
    } finally {
        toggleLoader(false);
    }
}

function renderTracks(tracks, container, owner) {
    if (!container) return;
    
    if (tracks.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-text-secondary">No tracks in this playlist.</td></tr>`;
        return;
    }

    const isOwner = currentUser && owner && (currentUser._id === owner._id || currentUser.id === owner.id || currentUser._id === owner);

    container.innerHTML = tracks.map((track, index) => {
        const duration = formatDuration(track.duration);
        const trackId = track._id || track.id;
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist";
        const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';

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
                     <img src="${image}" class="w-10 h-10 rounded object-cover">
                     <div>
                        <div class="font-medium text-white group-hover:text-primary transition-colors truncate text-base">${track.title}</div>
                        <div class="text-xs text-text-secondary truncate">${artist}</div>
                     </div>
                </div>
            </td>
            <td class="px-4 py-3 text-text-secondary text-right w-16 text-sm font-variant-numeric tabular-nums">
                ${duration}
            </td>
             <td class="px-4 py-3 text-right">
                ${ isOwner ? `
                <button class="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2" onclick="event.stopPropagation(); removeTrackFromPlaylist('${trackId}')" title="Remove from playlist">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                ` : ''}
            </td>
        </tr>
        `;
    }).join('');
}

// Global helpers
window.removeTrackFromPlaylist = async (trackId) => {
    if (!currentPlaylist) return;
    if (!confirm("Remove this song from playlist?")) return;

    toggleLoader(true);
    try {
        await api.request(`/playlists/${currentPlaylist._id}/tracks/${trackId}`, { method: 'DELETE' });
        displayMessage("Track removed", "success");
        // Reload
        loadPlaylistDetails(currentPlaylist._id);
    } catch (error) {
        console.error("Failed to remove track", error);
        displayMessage("Failed to remove track", "error");
        toggleLoader(false);
    }
};

window.confirmDeletePlaylist = async (id) => {
    if (!confirm("Are you sure you want to delete this playlist? This cannot be undone.")) return;

    toggleLoader(true);
    try {
        await api.request(`/playlists/${id}`, { method: 'DELETE' });
        displayMessage("Playlist deleted", "success");
        window.location.href = '/library';
    } catch (error) {
        console.error("Failed to delete playlist", error);
        displayMessage("Failed to delete playlist", "error");
        toggleLoader(false);
    }
};

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function calculateTotalDuration(tracks) {
    if (!tracks || tracks.length === 0) return "0 min";
    const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h} hr ${m} min`;
    return `${m} min`;
}

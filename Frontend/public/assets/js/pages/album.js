
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';
import player from '../player.js';

let albumTracks = [];

export async function init() {
    console.log("Initializing Album Page...");
    
    // Check URL params
    const query = new URLSearchParams(window.location.search);
    const albumId = query.get('id');

    if (albumId) {
        showSingleAlbumView(albumId);
    } else {
        showAllAlbumsView();
    }

    // Bind Back Button if we add one, or handle browser back via router
    // For now, simple view switching.
}

function showAllAlbumsView() {
    document.getElementById('single-album-view').classList.add('hidden');
    document.getElementById('all-albums-view').classList.remove('hidden');
    loadAllAlbums();
}

function showSingleAlbumView(id) {
    document.getElementById('all-albums-view').classList.add('hidden');
    document.getElementById('single-album-view').classList.remove('hidden');
    loadAlbumDetails(id);
}

// ==========================================
// ALL ALBUMS VIEW
// ==========================================
async function loadAllAlbums() {
    const container = document.getElementById('albums-grid');
    if (!container) return;
    
    toggleLoader(true);
    container.innerHTML = '';

    try {
        const response = await api.request('/albums?limit=20', { suppressAuthRedirect: true });
        const albums = response.data.docs || response.data || []; // AggregatePaginate returns docs

        if (albums.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-text-secondary">No albums found.</div>';
            return;
        }

        container.innerHTML = albums.map(album => {
             const image = album.coverImage || 'assets/images/album/default_album.png';
             const artistName = album.artist?.name || album.artist || "Unknown Artist";
             const trackCount = album.totalTracks || 0;
             const albumId = album._id || album.id;

             return `
             <div class="group cursor-pointer bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300" onclick="navigateToAlbum('${albumId}')">
                <div class="relative w-full aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
                    <img src="${image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <button class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                             <svg class="w-6 h-6 ml-1 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                         </button>
                    </div>
                </div>
                <h3 class="text-white font-bold truncate mb-1">${album.albumTitle}</h3>
                <p class="text-sm text-text-secondary truncate">${artistName} • ${trackCount} Songs</p>
             </div>
             `;
        }).join('');

    } catch (error) {
        console.error("Failed to load albums", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load albums.</div>';
    } finally {
        toggleLoader(false);
    }
}

// Global helper for onclick
window.navigateToAlbum = (id) => {
    // Navigate via router or reload
    // Since we are SPA, we can just pushState and init
    window.history.pushState({}, '', `/album?id=${id}`);
    showSingleAlbumView(id);
};

// ==========================================
// SINGLE ALBUM VIEW
// ==========================================
async function loadAlbumDetails(id) {
    toggleLoader(true);
    
    // Elements
    const imgEl = document.getElementById('playlist-image');
    const titleEl = document.getElementById('playlist-title');
    const descEl = document.getElementById('playlist-description');
    const statsEl = document.getElementById('hero-stats-row');
    const tracksContainer = document.getElementById('playlist-tracks');
    const playAllBtn = document.getElementById('play-all-btn');

    if (tracksContainer) tracksContainer.innerHTML = '';

    try {
        const response = await api.request(`/albums/${id}`, { suppressAuthRedirect: true });
        const album = response.data;
        
        // Metadata
        if(imgEl) imgEl.src = album.coverImage || 'assets/images/album/default_album.png';
        if(titleEl) titleEl.textContent = album.albumTitle;
        if(descEl) descEl.textContent = "Album"; // or Description
        
        const artistName = album.artist || "Unknown Artist";
        const year = new Date(album.releaseDate || album.createdAt).getFullYear();
        const durationStr = formatTotalDuration(album.totalDuration);
        
        if (statsEl) {
            statsEl.innerHTML = `
                <span class="font-semibold text-white hover:underline cursor-pointer">${artistName}</span>
                <span>•</span>
                <span>${year}</span>
                <span>•</span>
                <span>${album.totalTracks} songs, ${durationStr}</span>
            `;
        }

        // Tracks
        albumTracks = album.tracks || [];
        renderTracks(albumTracks, tracksContainer);
        
        // Bind Play All
        if (playAllBtn) {
            playAllBtn.onclick = () => {
                if (albumTracks.length > 0) {
                     player.setQueue(albumTracks);
                     player.loadTrack(albumTracks[0]);
                }
            };
        }

    } catch (error) {
        console.error("Failed to load album details", error);
        displayMessage("Failed to load album.", "error");
        if(titleEl) titleEl.textContent = "Album Not Found";
    } finally {
        toggleLoader(false);
    }
}

function renderTracks(tracks, container) {
    if (!container) return;
    
    if (tracks.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-text-secondary">No tracks in this album.</td></tr>`;
        return;
    }

    container.innerHTML = tracks.map((track, index) => {
        const duration = formatDuration(track.duration);
        const trackId = track._id || track.id;
        const artist = track.artist?.name || track.artist?.username || "Unknown Artist"; // Often same as album artist but might be feat.

        return `
        <tr class="group hover:bg-white/5 transition-colors cursor-pointer play-track-btn" data-id="${trackId}">
            <td class="px-4 py-3 text-text-secondary w-12 text-center group-hover:text-white">
                <span class="group-hover:hidden">${index + 1}</span>
                <span class="hidden group-hover:inline-block">
                    <svg class="w-4 h-4 text-primary fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="font-medium text-white group-hover:text-primary transition-colors truncate text-base">${track.title}</div>
                <div class="text-xs text-text-secondary truncate">${artist}</div>
            </td>
            <td class="px-4 py-3 text-text-secondary text-right w-16 text-sm font-variant-numeric tabular-nums">
                ${duration}
            </td>
            <td class="px-4 py-3 text-right w-12">
               <button onclick="event.stopPropagation(); window.openAddToPlaylistModal('${trackId}')" class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-white transition-opacity p-2" title="Add to Playlist">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
               </button>
            </td>
        </tr>
        `;
    }).join('');
}

function formatDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(seconds) {
    if (!seconds) return "0 min";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} hr ${m} min`;
    return `${m} min`;
}

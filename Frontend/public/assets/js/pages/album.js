
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const playlistImage = document.getElementById('playlist-image');
const playlistTitle = document.getElementById('playlist-title');
const playlistDescription = document.getElementById('playlist-description');
const playlistOwner = document.getElementById('playlist-owner'); // Artist Name
const playlistStatsCount = document.getElementById('playlist-stats-count');
const playlistStatsDuration = document.getElementById('playlist-stats-duration');
const tracksContainer = document.getElementById('playlist-tracks');

// Get Album ID from URL
const urlParams = new URLSearchParams(window.location.search);
let albumId = urlParams.get('id');

// If routing handling is different, we might need to parse path
// For now, assuming query param ?id=<id> or path handling if implemented
const pathParts = window.location.pathname.split('/');
if (pathParts.length > 2 && pathParts[1] === 'album') {
    // e.g. /album/123
    const potentialId = pathParts[2];
    if (potentialId) albumId = potentialId;
}

async function loadAlbumData() {
    if (!albumId) {
        // If no ID, maybe redirect or show empty
        // For development, load a default or latest
        // displayMessage('No album ID provided, loading defaults', 'info'); 
        // return;
    }

    toggleLoader(true);
    try {
        let album;
        if (albumId) {
            const response = await api.request(`/albums/${albumId}`);
            album = response.data;
        } else {
             // Fallback or list of albums if no ID?
             // For now let's stop.
             displayMessage('No Album Selected', 'info');
             toggleLoader(false);
             return;
        }

        renderHero(album);
        renderTracks(album.tracks, album);

    } catch (error) {
        console.error('Error loading album:', error);
        displayMessage('Failed to load album details', 'error');
    } finally {
        toggleLoader(false);
    }
}

function renderHero(album) {
    if (!album) return;
    
    // Update elements
    if (playlistTitle) playlistTitle.textContent = album.title;
    if (playlistDescription) playlistDescription.textContent = album.description || `Album by ${album.artist}`;
    if (playlistOwner) playlistOwner.textContent = album.artist; 
    
    // Stats
    if (playlistStatsCount) playlistStatsCount.textContent = `${album.tracks ? album.tracks.length : 0} songs`;
    
    // Duration - calculate from tracks if not provided
    let duration = 0;
    if (album.tracks) {
        duration = album.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    }
    if (playlistStatsDuration) playlistStatsDuration.textContent = `${Math.floor(duration / 60)} min`;

    if (playlistImage) {
        playlistImage.src = album.coverImage || 'assets/images/default-album.png';
    }
    
    // Play All Handler
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.onclick = () => {
             if (album.tracks && album.tracks.length > 0) {
                // Ensure tracks have album metadata if missing
                const tracksWithMeta = album.tracks.map(t => ({
                    ...t,
                    album: t.album || album.title,
                    coverImage: t.coverImage || album.coverImage
                }));
                window.player.setQueue(tracksWithMeta);
                window.player.playTrackById(tracksWithMeta[0]._id);
             }
        };
    }
}

function renderTracks(tracks, albumContext) {
    if (!tracksContainer) return;

    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-text-secondary">No tracks in this album</td></tr>';
        return;
    }

    tracksContainer.innerHTML = tracks.map((track, index) => {
         // Fallback for cover if not in track but in album
         const cover = track.coverImage || (albumContext ? albumContext.coverImage : 'assets/images/default-track.png');
         const artist = track.artist || (albumContext ? albumContext.artist : 'Unknown Artist');
         
         return `
        <tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick="window.playTrack('${track._id}')">
            <td class="px-4 py-3 text-center text-text-secondary group-hover:text-white">
                <span class="group-hover:hidden">${index + 1}</span>
                <button class="hidden group-hover:inline-block text-white" onclick="event.stopPropagation(); window.playTrack('${track._id}')">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <img src="${cover}" class="w-10 h-10 rounded object-cover" alt="${track.title}">
                    <div>
                        <div class="text-white font-medium truncate">${track.title}</div>
                        <div class="text-text-secondary text-xs hover:underline">${artist}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-right">
                <button class="text-text-secondary hover:text-primary" onclick="event.stopPropagation(); window.toggleLike('${track._id}')">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `}).join('');
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    loadAlbumData();
});


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
let artistId = urlParams.get('id');

const pathParts = window.location.pathname.split('/');
if (pathParts.length > 2 && pathParts[1] === 'artist') {
    // e.g. /artist/123
    const potentialId = pathParts[2];
    if (potentialId) artistId = potentialId;
}

async function loadArtistData() {
    if (!artistId) {
        // displayMessage('No artist ID provided', 'error');
    }

    toggleLoader(true);
    try {
        let artist;
        if (artistId) {
            const response = await api.request(`/artists/${artistId}`);
            artist = response.data;
        } else {
             displayMessage('No Artist Selected', 'info');
             toggleLoader(false);
             return;
        }

        renderHero(artist);
        renderTracks(artist.tracks, artist); // Assuming artist object has 'tracks' populated (top tracks)

    } catch (error) {
        console.error('Error loading artist:', error);
        displayMessage('Failed to load artist details', 'error');
    } finally {
        toggleLoader(false);
    }
}

function renderHero(artist) {
    if (!artist) return;
    
    // Update elements
    if (playlistTitle) playlistTitle.textContent = artist.name;
    if (playlistDescription) playlistDescription.textContent = 'Artist';
    if (playlistOwner) playlistOwner.textContent = ''; // Or genre?
    
    // Stats
    if (playlistStatsCount) playlistStatsCount.textContent = `${artist.listeners || 0} monthly listeners`;
    if (playlistStatsDuration) playlistStatsDuration.style.display = 'none'; // Hide duration for artist

    if (playlistImage) {
        playlistImage.src = artist.image || 'assets/images/default-artist.png';
        playlistImage.classList.add('rounded-full'); // Different style for artist
    }
    
    // Play All Handler
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.onclick = () => {
             if (artist.tracks && artist.tracks.length > 0) {
                const tracksWithMeta = artist.tracks.map(t => ({
                    ...t,
                    artist: artist.name, // Ensure artist name is correct
                    coverImage: t.coverImage || artist.image
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
    loadArtistData();
});


import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const allArtistsView = document.getElementById('all-artists-view');
const singleArtistView = document.getElementById('single-artist-view');
const artistsGrid = document.getElementById('artists-grid');

const playlistImage = document.getElementById('playlist-image');
const playlistTitle = document.getElementById('playlist-title');
const playlistDescription = document.getElementById('playlist-description');
const heroStatsRow = document.getElementById('hero-stats-row');
const tracksContainer = document.getElementById('playlist-tracks');

// Get Artist ID from URL (or similar routing)
const urlParams = new URLSearchParams(window.location.search);
let artistId = urlParams.get('id');

const pathParts = window.location.pathname.split('/');
if (pathParts.length > 2 && pathParts[1] === 'artist') {
    // e.g. /artist/123
    const potentialId = pathParts[2];
    if (potentialId) artistId = potentialId;
}

// Helper to switch views
function switchView(view) {
    if (view === 'grid') {
        if (allArtistsView) allArtistsView.classList.remove('hidden');
        if (singleArtistView) singleArtistView.classList.add('hidden');
    } else {
        if (allArtistsView) allArtistsView.classList.add('hidden');
        if (singleArtistView) singleArtistView.classList.remove('hidden');
    }
}

async function loadArtistData() {
    toggleLoader(true);
    try {
        if (artistId) {
            // Single Artist Mode
            switchView('single');
            const response = await api.request(`/artists/${artistId}`);
            const artist = response.data;
            renderHero(artist);
            renderTracks(artist.tracks, artist);
        } else {
            // All Artists Grid Mode
            switchView('grid');
            const response = await api.request('/artists?limit=50');
            const artists = response.data.artists || response.data.docs || response.data; // Handle pagination structure
            renderArtistsGrid(artists);
        }

    } catch (error) {
        console.error('Error loading artist:', error);
        displayMessage('Failed to load content', 'error');
    } finally {
        toggleLoader(false);
    }
}

function renderArtistsGrid(artists) {
    if (!artistsGrid) return;

    if (!artists || artists.length === 0) {
        artistsGrid.innerHTML = '<div class="col-span-full text-center text-text-secondary">No artists found</div>';
        return;
    }

    artistsGrid.innerHTML = artists.map(artist => {
        const cover = artist.artistImage || artist.image || 'assets/images/artist/default_artist_1.png';
        const name = artist.artistName || artist.name || 'Unknown Artist';

        return `
        <a href="/artist.html?id=${artist._id}" class="group bg-surface/40 hover:bg-surface/80 p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 block text-center">
            <div class="relative aspect-square rounded-full overflow-hidden mb-4 shadow-lg group-hover:shadow-xl mx-auto w-full max-w-[200px]">
                <img src="${cover}" alt="${name}" class="w-full h-full object-cover" loading="lazy">
            </div>
            <h3 class="text-white font-semibold truncate mb-1">${name}</h3>
            <p class="text-text-secondary text-sm capitalize">Artist</p>
        </a>
        `;
    }).join('');
}


function renderHero(artist) {
    if (!artist) return;
    
    // Update elements
    if (playlistTitle) playlistTitle.textContent = artist.artistName || artist.name || "Unknown Artist";
    if (playlistDescription) playlistDescription.textContent = artist.artistBio || 'Artist';
    
    // Stats
    if (heroStatsRow) {
        const followerCount = artist.followers ? artist.followers.length : 0;
        heroStatsRow.innerHTML = `<span>${followerCount} followers</span>`; // Or listeners
    }

    if (playlistImage) {
        playlistImage.src = artist.artistImage || artist.image || 'assets/images/artist/default_artist_1.png';
        playlistImage.classList.add('rounded-full'); 
    }
    
    // Play All Handler -> Plays Top Tracks
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.onclick = () => {
             if (artist.tracks && artist.tracks.length > 0) {
                const tracksWithMeta = artist.tracks.map(t => ({
                    ...t,
                    artist: artist.artistName || artist.name, 
                    coverImage: t.coverImage || artist.artistImage || artist.image
                }));
                window.player.setQueue(tracksWithMeta);
                window.player.playTrackById(tracksWithMeta[0]._id);
             }
        };
    }
}

function renderTracks(tracks, artistContext) {
    if (!tracksContainer) return;

    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-text-secondary">No popular tracks found</td></tr>';
        return;
    }

    // Determine artist name from context safely
    const contextArtistName = artistContext.artistName || artistContext.name || "Unknown Artist";

    tracksContainer.innerHTML = tracks.map((track, index) => {
         // Fallback for cover
         const cover = track.coverImage || artistContext.artistImage || artistContext.image || 'assets/images/track/default_track.png';
         
         // Determine individual track artist name (if populated object, strings, etc.)
         let trackArtistName = contextArtistName; 
         // If track.artist is distinct populated object
         if (track.artist && typeof track.artist === 'object' && (track.artist.artistName || track.artist.name)) {
             trackArtistName = track.artist.artistName || track.artist.name;
         } else if (typeof track.artist === 'string') {
             // If matches ID, use context name, else keep string
             if (track.artist !== artistContext._id) trackArtistName = track.artist;
         }

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
                        <div class="text-text-secondary text-xs hover:underline">${trackArtistName}</div>
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

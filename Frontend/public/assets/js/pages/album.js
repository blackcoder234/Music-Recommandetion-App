
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const allAlbumsView = document.getElementById('all-albums-view');
const singleAlbumView = document.getElementById('single-album-view');
const albumsGrid = document.getElementById('albums-grid');

const playlistImage = document.getElementById('playlist-image');
const playlistTitle = document.getElementById('playlist-title');
const playlistDescription = document.getElementById('playlist-description');
const heroStatsRow = document.getElementById('hero-stats-row');
const tracksContainer = document.getElementById('playlist-tracks');

// Get Album ID from URL
const urlParams = new URLSearchParams(window.location.search);
let albumId = urlParams.get('id');

const pathParts = window.location.pathname.split('/');
if (pathParts.length > 2 && pathParts[1] === 'album') {
    // e.g. /album/123
    const potentialId = pathParts[2];
    if (potentialId) albumId = potentialId;
}

// Helper to switch views
function switchView(view) {
    if (view === 'grid') {
        if (allAlbumsView) allAlbumsView.classList.remove('hidden');
        if (singleAlbumView) singleAlbumView.classList.add('hidden');
    } else {
        if (allAlbumsView) allAlbumsView.classList.add('hidden');
        if (singleAlbumView) singleAlbumView.classList.remove('hidden');
    }
}

async function loadAlbumData() {
    toggleLoader(true);
    try {
        if (albumId) {
            // Single Album Mode
            switchView('single');
            const response = await api.request(`/albums/${albumId}`);
            const album = response.data;
            renderHero(album);
            renderTracks(album.tracks, album);
        } else {
            // All Albums Grid Mode
            switchView('grid');
            const response = await api.request('/albums?limit=50'); // Fetch enough for grid
            const albums = response.data.docs || response.data; // Handle pagination structure
            renderAlbumsGrid(albums);
        }

    } catch (error) {
        console.error('Error loading data:', error);
        displayMessage('Failed to load content', 'error');
    } finally {
        toggleLoader(false);
    }
}

function renderAlbumsGrid(albums) {
    if (!albumsGrid) return;

    if (!albums || albums.length === 0) {
        albumsGrid.innerHTML = '<div class="col-span-full text-center text-text-secondary">No albums found</div>';
        return;
    }

    albumsGrid.innerHTML = albums.map(album => {
        // Safe access to artist name
        const artistName = typeof album.artist === 'object' ? (album.artist.name || album.artist.artistName) : (album.artist || 'Unknown Artist');
        const cover = album.coverImage || 'assets/images/album/default_album.png';

        return `
        <a href="/album.html?id=${album._id}" class="group bg-surface/40 hover:bg-surface/80 p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 block">
            <div class="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-lg group-hover:shadow-xl">
                <img src="${cover}" alt="${album.title || album.albumTitle}" class="w-full h-full object-cover" loading="lazy">
                <button class="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
                     <svg class="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
            </div>
            <h3 class="text-white font-semibold truncate mb-1">${album.title || album.albumTitle}</h3>
            <p class="text-text-secondary text-sm truncate">${artistName}</p>
        </a>
        `;
    }).join('');
}

function renderHero(album) {
    if (!album) return;
    
    // Update elements
    if (playlistTitle) playlistTitle.textContent = album.title || album.albumTitle;
    
    const artistName = typeof album.artist === 'object' ? (album.artist.name || album.artist.artistName) : (album.artist || "Unknown Artist");
    // Handle Artist Image
    let artistImageSrc = 'assets/images/artist/default_artist_1.png';
    if (typeof album.artist === 'object' && (album.artist.artistImage || album.artist.image)) {
        artistImageSrc = album.artist.artistImage || album.artist.image;
    }

    if (playlistDescription) playlistDescription.textContent = album.description || `Album by ${artistName}`;

    // Render Stats Row dynamically
    if (heroStatsRow) {
        const count = album.totalTracks !== undefined ? album.totalTracks : (album.tracks ? album.tracks.length : 0);
        
        let duration = album.totalDuration;
        if (duration === undefined && album.tracks) {
            duration = album.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
        }
        const durationMin = Math.floor((duration || 0) / 60);

        heroStatsRow.innerHTML = `
            <img src="${artistImageSrc}" class="w-6 h-6 rounded-full object-cover">
            <span class="text-white hover:underline cursor-pointer font-semibold" onclick="window.location.href='/artist.html?id=${album.artist._id || ''}'">${artistName}</span>
            <span class="text-text-secondary/50 mx-1">|</span>
            <span>${count} songs</span>
            <span class="text-text-secondary/50 mx-1">|</span>
            <span>${durationMin} min</span>
        `;
    }

    if (playlistImage) {
        playlistImage.src = album.coverImage || 'assets/images/album/default_album.png';
    }
    
    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
        playAllBtn.onclick = () => {
             if (album.tracks && album.tracks.length > 0) {
                const tracksWithMeta = album.tracks.map(t => ({
                    ...t,
                    album: t.album || album.title || album.albumTitle,
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

    const contextArtistName = typeof albumContext?.artist === 'object' 
        ? (albumContext.artist.artistName || albumContext.artist.name) 
        : albumContext.artist;

    tracksContainer.innerHTML = tracks.map((track, index) => {
         const cover = track.coverImage || (albumContext ? albumContext.coverImage : 'assets/images/track/default_track_1.png');
         
         let artistName = 'Unknown Artist';
         if (track.artist) {
            if (typeof track.artist === 'string') artistName = track.artist;
            else artistName = track.artist.artistName || track.artist.name || 'Unknown Artist';
         } else if (contextArtistName) {
            artistName = contextArtistName;
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
                        <div class="text-text-secondary text-xs hover:underline">${artistName}</div>
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

document.addEventListener('DOMContentLoaded', () => {
    loadAlbumData();
});


import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

const tracksContainer = document.getElementById('playlist-tracks');
const pageTitle = document.getElementById('page-title') || document.querySelector('h1');
const pageDescription = document.querySelector('.text-sm.font-medium.uppercase');

async function loadLibraryData() {
    toggleLoader(true);
    try {
        const path = window.location.pathname;
        let endpoint = '';
        let title = '';
        let subtitle = 'Library';
        let emptyMessage = 'No tracks found';

        if (path === '/recently-added') {
            endpoint = '/users/history'; // Assuming this exists or similar
            title = 'Recently Added';
            emptyMessage = 'No recently played tracks found.';
        } else if (path === '/most-played') {
            endpoint = '/users/top-tracks'; // Assuming
            title = 'Most Played';
            subtitle = 'Your Favorites';
             emptyMessage = 'No top tracks found yet. Start listening!';
        } else if (path === '/episodes') {
            endpoint = '/episodes'; // Assuming
            title = 'Your Episodes';
            subtitle = 'Podcasts';
            emptyMessage = 'No episodes saved.';
        } else {
             endpoint = '/tracks?limit=50'; // Fallback
             title = 'Library';
        }

        // Update Header
        if (pageTitle) pageTitle.textContent = title;
        if (pageDescription) pageDescription.textContent = subtitle;

        const response = await api.request(endpoint);
        const tracks = response.data.tracks || response.data || [];

        renderTracks(tracks, emptyMessage);
        
        // Stats update if elements exist (reusing liked.html structure)
        const countEl = document.getElementById('playlist-stats-count');
        if (countEl) countEl.textContent = `${tracks.length} items`;

    } catch (error) {
        console.error('Library Load Error:', error);
        // Fallback for demo purposes if endpoints don't exist
        renderTracks([], "Feature coming soon or requires backend implementation.");
    } finally {
        toggleLoader(false);
    }
}

function renderTracks(tracks, emptyMsg) {
    if (!tracksContainer) return;
    
    if (!tracks || tracks.length === 0) {
        tracksContainer.innerHTML = `
            <tr>
                <td colspan="5" class="py-12 text-center text-text-secondary">
                    <div class="flex flex-col items-center justify-center">
                         <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">${emptyMsg}</h3>
                        <a href="/discover" class="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Discover Music</a>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tracksContainer.innerHTML = tracks.map((track, index) => {
        const image = track.imageUrl || track.coverImage || 'assets/images/track/default_track_1.png';
        const artist = track.artist?.name || track.artist?.username || track.artist || 'Unknown Artist';
        
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
                    <img src="${image}" class="w-10 h-10 rounded object-cover" alt="${track.title}">
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
    
    // Set queue
    if (window.player) {
        window.player.setQueue(tracks);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadLibraryData();
});


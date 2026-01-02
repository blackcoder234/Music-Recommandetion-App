
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const weeklyTopContainer = document.getElementById('weekly-top-songs-container');
const newReleasesContainer = document.getElementById('new-releases-container');

/**
 * Generates the HTML for a single Track Card
 */
function createTrackCard(track) {
    // Fallback images if not provided
    const image = track.imageUrl || track.album?.coverImage || './assets/images/album/default_album.png';
    const title = track.title || 'Untitled';
    const artistName = track.artist?.name || track.artist?.username || 'Unknown Artist';
    const artistId = track.artist?._id;
    
    // We can link to album or play track directly. 
    // For now, let's keep the card structure.
    
    return `
    <div class="group cursor-pointer min-w-[160px] snap-start" data-track-id="${track._id}">
        <div class="relative aspect-square rounded-xl overflow-hidden mb-3">
            <img 
                src="${image}" 
                alt="${title}" 
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button class="play-track-btn w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform" data-id="${track._id}">
                    <svg class="w-5 h-5 ml-1 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </button>
            </div>
        </div>
        <h4 class="font-medium text-white truncate">${title}</h4>
        <p class="text-sm text-text-secondary truncate">${artistName}</p>
    </div>
    `;
}

/**
 * Fetch and Render Home Page Content
 */
async function loadHomePage() {
    try {
        // 1. Fetch Weekly Top (Mocking with just recent 5 for now as backend lacks sort)
        if (weeklyTopContainer) {
            // Loading State (optional, or just keep skeleton)
            weeklyTopContainer.innerHTML = '<div class="text-text-secondary text-sm">Loading...</div>';
            
            const topTracksResponse = await api.request('/tracks?limit=5&page=1');
            const topTracks = topTracksResponse?.data?.tracks || [];

            if (topTracks.length > 0) {
                weeklyTopContainer.innerHTML = topTracks.map(createTrackCard).join('');
            } else {
                weeklyTopContainer.innerHTML = '<div class="text-text-secondary text-sm">No tracks found.</div>';
            }
        }

        // 2. Fetch New Releases (Page 2 to show difference, or sort by created)
        if (newReleasesContainer) {
            newReleasesContainer.innerHTML = '<div class="text-text-secondary text-sm">Loading...</div>';

            const newResponse = await api.request('/tracks?limit=5&page=2'); 
            // In reality, you'd arguably want the SAME list or a specific "newest" list.
            // Since getAllTracks default sorts by createdAt:-1, Page 1 is actually New Releases.
            // Let's use Page 1 for New Releases and maybe Page 2 for "Weekly Top".
            // Adjusting plan:
            
        }
        
    } catch (error) {
        console.error("Home Page Load Error:", error);
        // displayMessage("Failed to load some content", "error");
    }
}

async function loadNewReleases() {
     if (newReleasesContainer) {
            newReleasesContainer.innerHTML = '<div class="text-text-secondary text-sm">Loading...</div>';
            
            // Get latest
            const response = await api.request('/tracks?limit=5&page=1'); 
            const tracks = response?.data?.tracks || [];
            
            if (tracks.length > 0) {
                 newReleasesContainer.innerHTML = tracks.map(createTrackCard).join('');
            } else {
                 newReleasesContainer.innerHTML = '<div class="text-text-secondary text-sm">No new releases.</div>';
            }
    }
}

async function loadTopSongs() {
     // Mocking "Weekly Top" with Page 2 or random just for variety
     if (weeklyTopContainer) {
            weeklyTopContainer.innerHTML = '<div class="text-text-secondary text-sm">Loading...</div>';
            
            // In a real app we'd have ?sort=-playCount
            const response = await api.request('/tracks?limit=5&page=2'); 
            const tracks = response?.data?.tracks || [];
            
            if (tracks.length > 0) {
                 weeklyTopContainer.innerHTML = tracks.map(createTrackCard).join('');
            } else {
                 weeklyTopContainer.innerHTML = '<div class="text-text-secondary text-sm">No top songs found.</div>';
            }
    }
}

// Initial Load
document.addEventListener('DOMContentLoaded', async () => {
    // Only run if we are on the home page (container exists)
    if (weeklyTopContainer || newReleasesContainer) {
        toggleLoader(true);
        try {
            await Promise.all([loadTopSongs(), loadNewReleases()]);
        } catch (error) {
            console.error('Error loading home page:', error);
        } finally {
            toggleLoader(false);
        }
    }
});

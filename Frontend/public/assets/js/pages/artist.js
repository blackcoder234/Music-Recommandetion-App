
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';
import player from '../player.js';

let artistTracks = [];

export async function init() {
    console.log("Initializing Artist Page...");
    
    // Check URL params
    const query = new URLSearchParams(window.location.search);
    const artistId = query.get('id');

    if (artistId) {
        showSingleArtistView(artistId);
    } else {
        showAllArtistsView();
    }
}

function showAllArtistsView() {
    document.getElementById('single-artist-view').classList.add('hidden');
    document.getElementById('all-artists-view').classList.remove('hidden');
    loadAllArtists();
}

function showSingleArtistView(id) {
    document.getElementById('all-artists-view').classList.add('hidden');
    document.getElementById('single-artist-view').classList.remove('hidden');
    loadArtistDetails(id);
}

// Global helper
window.navigateToArtist = (id) => {
    window.history.pushState({}, '', `/artist?id=${id}`);
    showSingleArtistView(id);
};

// ==========================================
// ALL ARTISTS VIEW
// ==========================================
async function loadAllArtists() {
    const container = document.getElementById('artists-grid');
    if (!container) return;
    
    toggleLoader(true);
    container.innerHTML = '';

    try {
        const response = await api.request('/artists?limit=20', { suppressAuthRedirect: true });
        let artists = [];
        if (Array.isArray(response.data)) {
            artists = response.data;
        } else if (response.data && Array.isArray(response.data.docs)) {
            artists = response.data.docs;
        } else if (response.data && Array.isArray(response.data.artists)) {
             artists = response.data.artists;
        } 

        if (!Array.isArray(artists)) {
            console.warn("Artists data is not an array, resetting to empty:", artists);
            artists = [];
        }

        if (artists.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-text-secondary">No artists found.</div>';
            return;
        }

        container.innerHTML = artists.map(artist => {
             const image = artist.artistImage || 'assets/images/artist/default_artist_3.jpg'; // We might have images
             // Default if missing
             const artistId = artist._id || artist.id;

             return `
             <div class="group cursor-pointer bg-[#181818] p-4 rounded-xl hover:bg-[#282828] transition-all duration-300 flex flex-col items-center text-center" onclick="navigateToArtist('${artistId}')">
                <div class="relative w-40 h-40 mb-4 rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-primary/50 transition-colors">
                    <img src="${image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                </div>
                <h3 class="text-white font-bold truncate w-full mb-1 text-lg">${artist.name || artist.artistName}</h3>
                <p class="text-sm text-text-secondary">Artist</p>
             </div>
             `;
        }).join('');

    } catch (error) {
        console.error("Failed to load artists", error);
        container.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load artists.</div>';
    } finally {
        toggleLoader(false);
    }
}

// ==========================================
// SINGLE ARTIST VIEW
// ==========================================
async function loadArtistDetails(id) {
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
        const response = await api.request(`/artists/${id}`, { suppressAuthRedirect: true });
        const artist = response.data.artist || response.data;
        const tracks = response.data.tracks || response.data.topTracks || []; // Depends on Artist Controller response structure

        // Metadata
        if(imgEl) {
             imgEl.src = artist.artistImage || 'assets/images/artist/default_artist_3.jpg';
             // Artists usually circular or rounded. In HTML it's rounded-xl.
        }
        if(titleEl) titleEl.textContent = artist.name || artist.artistName;
        if(descEl) descEl.textContent = "Verified Artist";
        
        if (statsEl) {
            statsEl.innerHTML = `
                <span>${artist.bio || "No bio available."}</span>
            `;
        }

        // Tracks
        artistTracks = tracks;
        renderArtistTracks(artistTracks, tracksContainer);
        
        // Bind Play All
        if (playAllBtn) {
            playAllBtn.onclick = () => {
                if (artistTracks.length > 0) {
                     player.setQueue(artistTracks);
                     player.loadTrack(artistTracks[0]);
                }
            };
        }

    } catch (error) {
        console.error("Failed to load artist details", error);
        displayMessage("Failed to load artist.", "error");
    } finally {
        toggleLoader(false);
    }
}

function renderArtistTracks(tracks, container) {
    if (!container) return;
    
    if (tracks.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-text-secondary">No tracks found.</td></tr>`;
        return;
    }

    container.innerHTML = tracks.map((track, index) => {
        const duration = formatDuration(track.duration);
        const trackId = track._id || track.id;
        // In Artist view, we know the artist. Show Album?
        const albumName = track.album?.title || "Single";

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
                     <img src="${track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png'}" class="w-10 h-10 rounded object-cover">
                     <div class="font-medium text-white group-hover:text-primary transition-colors truncate text-base">${track.title}</div>
                </div>
            </td>
             <td class="px-4 py-3 text-text-secondary hidden md:table-cell truncate max-w-[150px]">
              ${albumName}
            </td>
            <td class="px-4 py-3 text-text-secondary text-right w-16 text-sm font-variant-numeric tabular-nums">
                ${duration}
            </td>
            <td class="px-4 py-3 text-right">
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

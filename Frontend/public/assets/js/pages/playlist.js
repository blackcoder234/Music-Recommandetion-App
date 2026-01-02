
import api from '../api.js';
import player from '../player.js'; // Import global player instance
import { displayMessage, toggleLoader } from '../utils.js';

// DOM Elements
const heroTitle = document.getElementById('playlist-title');
const heroDesc = document.getElementById('playlist-description');  // Use "Album" label slot or new one
const heroOwner = document.getElementById('playlist-owner');
const heroImage = document.getElementById('playlist-image');
const trackListBody = document.getElementById('playlist-tracks');
const playAllBtn = document.getElementById('play-all-btn');
const tracksCount = document.getElementById('playlist-stats-count');
const durationTotal = document.getElementById('playlist-stats-duration');

async function loadPlaylist() {
    toggleLoader(true);
    try {
        // Parse ID from URL: /playlist/123 -> 123
        const pathParts = window.location.pathname.split('/');
        const playlistId = pathParts[pathParts.length - 1]; // Last part

        if (!playlistId) throw new Error("No Playlist ID found");

        const response = await api.request(`/playlists/${playlistId}`);
        const playlist = response.data;

        if (!playlist) throw new Error("Playlist not found");

        renderHero(playlist);
        renderTracks(playlist.tracks || []); 
        
        // Update Player Queue with this playlist context
        if (playlist.tracks && playlist.tracks.length > 0) {
            player.setQueue(playlist.tracks);
        }

        // Setup Play All
        if(playAllBtn) {
            playAllBtn.onclick = () => {
                if (playlist.tracks && playlist.tracks.length > 0) {
                   player.setQueue(playlist.tracks);
                   player.playTrackById(playlist.tracks[0]._id);
                }
            };
        }

    } catch (error) {
        console.error("Load Playlist Error:", error);
        displayMessage("Failed to load playlist", "error");
    } finally {
        toggleLoader(false);
    }
}

function renderHero(playlist) {
    if (heroTitle) heroTitle.textContent = playlist.playListTitle;
    if (heroDesc) heroDesc.textContent = playlist.playListDescription || "Playlist";
    if (heroOwner) heroOwner.textContent = playlist.owner?.username || "Unknown";
    
    // Image or Gradient Fallback
    if (heroImage) {
        if(playlist.coverImage) {
            heroImage.src = playlist.coverImage;
        } else {
             // Keep default or set generic
             heroImage.src = 'assets/images/album/default_album.png';
        }
    }
    
    if (tracksCount) tracksCount.textContent = `${playlist.tracks?.length || 0} songs`;
    
    // Calculate total duration
    if (durationTotal && playlist.tracks) {
        const totalSeconds = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
        const m = Math.floor(totalSeconds / 60);
        durationTotal.textContent = `${m} min`;
    }
}

function renderTracks(tracks) {
    if (!trackListBody) return;
    
    if (tracks.length === 0) {
        trackListBody.innerHTML = '<tr><td colspan="3" class="text-center py-8 text-text-secondary">No tracks in this playlist.</td></tr>';
        return;
    }

    trackListBody.innerHTML = tracks.map((track, index) => {
        const duration = formatTime(track.duration || 0);
        const artist = track.artist?.name || track.artist?.username || "Unknown";
        
        return `
        <tr class="group hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 border-transparent hover:border-transparent play-track-row" data-id="${track._id}">
            <td class="px-4 py-4 text-center text-text-secondary w-12 group-hover:text-white relative">
                <span class="group-hover:hidden">${index + 1}</span>
                <button class="play-track-btn w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center text-white" data-id="${track._id}">
                     <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
            </td>
            <td class="px-4 py-4">
                <div class="font-medium text-white group-hover:text-primary transition-colors truncate max-w-[200px] md:max-w-xs">
                    ${track.title}
                </div>
                <div class="text-xs text-text-secondary md:hidden truncate max-w-[150px]">
                    ${artist}
                </div>
            </td>
            <td class="px-4 py-4 text-right text-text-secondary font-variant-numeric tabular-nums">
                ${duration}
            </td>
        </tr>
        `;
    }).join('');
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

document.addEventListener('DOMContentLoaded', loadPlaylist);

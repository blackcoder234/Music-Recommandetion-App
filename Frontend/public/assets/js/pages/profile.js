
import Auth from '../auth.js';
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// Elements
const userNameElements = document.querySelectorAll('.profile-user-name'); // e.g., Hero Name + Header Name if applicable
const userHandleElement = document.querySelector('.profile-user-handle'); // @handle
const userAvatarElement = document.querySelector('.profile-user-avatar'); // Main Hero Avatar
const statsPlaylists = document.getElementById('stats-playlists');
const statsFollowers = document.getElementById('stats-followers');
const statsFollowing = document.getElementById('stats-following');
const playlistsContainer = document.getElementById('profile-playlists-grid');

// Helper: Card generator matching Profile design
function createPlaylistCard(playlist) {
    const title = playlist.playListTitle || 'Untitled Playlist';
    const count = playlist.totalTracks || 0;
    // Random gradient fallback if no cover image
    // In HTML it was aspect-square with bg-gradient...
    // If we have an image, we use an img tag. If not, a div with gradient.
    
    let visualContent;
    if (playlist.coverImage) {
        visualContent = `
            <img src="${playlist.coverImage}" alt="${title}" class="w-full h-full object-cover rounded-lg mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
        `;
    } else {
        // Fallback Gradients
        const gradients = [
            'from-purple-500 to-indigo-600',
            'from-pink-500 to-red-500',
            'from-green-400 to-teal-500',
            'from-yellow-400 to-orange-500'
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        
        visualContent = `
            <div class="aspect-square bg-gradient-to-br ${randomGradient} rounded-lg mb-3 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <svg class="w-10 h-10 text-white opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            </div>
        `;
    }

    return `
        <div class="bg-surface p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" onclick="location.href='/playlist/${playlist._id}'">
            ${visualContent}
            <h3 class="font-medium text-white truncate">${title}</h3>
            <p class="text-xs text-text-secondary mt-1">${count} songs</p>
        </div>
    `;
}

function createAddPlaylistCard() {
    return `
        <div class="bg-surface/50 p-4 rounded-xl hover:bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center aspect-[1/1.3] cursor-pointer group" onclick="location.href='/playlist/create'">
          <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </div>
          <p class="text-sm font-medium text-white">Create New</p>
        </div>
    `;
}

/**
 * Load Profile Data
 */
async function loadProfile() {
    toggleLoader(true);
    try {
        const user = await Auth.getCurrentUser();
        
        if (!user) {
            // Should be handled by main.js protection, but double check
            window.location.href = '/login'; 
            return;
        }

        // 1. Update User Header Info
        // Need to identify elements in HTML. 
        // I will adding IDs to profile.html first to make this robust.
        // Assuming IDs are added:
        
        if (document.getElementById('profile-name')) {
             document.getElementById('profile-name').textContent = user.fullName || user.username;
        }
        if (document.getElementById('profile-handle')) {
             document.getElementById('profile-handle').textContent = `@${user.username}`;
        }
        if (document.getElementById('profile-avatar')) {
             if(user.avatar) document.getElementById('profile-avatar').src = user.avatar;
        }
        if (document.getElementById('header-name')) {
            document.getElementById('header-name').textContent = user.fullName || user.username;
        }

        // 2. Fetch User Playlists
        const playlistsResponse = await api.request('/playlists/my'); 
        const playlists = playlistsResponse?.data || [];

        // 3. Render Playlists
        if (playlistsContainer) {
            const playlistHTML = playlists.map(createPlaylistCard).join('');
            // Append the "Create New" card at the end
            playlistsContainer.innerHTML = playlistHTML + createAddPlaylistCard();
            
            // Update Stats
            // Assuming we have these IDs
            // Note: followers/following might not be in the basic user object yet, usually requires extra call.
            // Using placeholder or data if available.
             if (document.getElementById('stat-playlists-count')) {
                document.getElementById('stat-playlists-count').textContent = playlists.length;
            }
        }

    } catch (error) {
        console.error("Profile Load Error:", error);
        displayMessage("Failed to load profile data", "error");
    } finally {
        toggleLoader(false);
    }
}

document.addEventListener('DOMContentLoaded', loadProfile);


import Auth from '../auth.js';
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// Elements
const statsPlaylists = document.getElementById('stats-playlists');
const statsFollowers = document.getElementById('stats-followers');
const statsFollowing = document.getElementById('stats-following');
const playlistsContainer = document.getElementById('profile-playlists-grid');

// Helper: Card generator matching Profile design
function createPlaylistCard(playlist) {
    const title = playlist.playListTitle || 'Untitled Playlist';
    const count = playlist.totalTracks || 0;
    
    let visualContent;
    if (playlist.coverImage) {
        visualContent = `
            <img src="${playlist.coverImage}" alt="${title}" class="w-full h-full object-cover rounded-lg mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
        `;
    } else {
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
        <div class="bg-surface p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group" onclick="location.href='/playlist.html?id=${playlist._id}'">
            ${visualContent}
            <h3 class="font-medium text-white truncate">${title}</h3>
            <p class="text-xs text-text-secondary mt-1">${count} songs</p>
        </div>
    `;
}

function createAddPlaylistCard() {
    return `
        <div class="bg-surface/50 p-4 rounded-xl hover:bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center aspect-[1/1.3] cursor-pointer group" onclick="location.href='/create_playlist.html'">
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
            window.location.href = '/login.html'; 
            return;
        }

        // 1. Update User Header Info
        if (document.getElementById('profile-name')) {
             document.getElementById('profile-name').textContent = user.fullName || user.username;
        }
        if (document.getElementById('profile-handle')) {
             document.getElementById('profile-handle').textContent = `@${user.username}`;
        }
        if (document.getElementById('header-name')) {
             document.getElementById('header-name').textContent = user.fullName || user.username;
        }
    
        // Update all avatar instances
        const avatars = document.querySelectorAll('#profile-avatar, #edit-profile-avatar-preview');
        avatars.forEach(img => {
            if(user.avatar) img.src = user.avatar;
            else img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        });

        // 2. Fetch User Playlists
        const playlistsResponse = await api.request('/playlists/me'); 
        const playlists = playlistsResponse?.data || [];

        // 3. Render Playlists
        if (playlistsContainer) {
            const playlistHTML = playlists.map(createPlaylistCard).join('');
            playlistsContainer.innerHTML = playlistHTML + createAddPlaylistCard();
            
            if (document.getElementById('stat-playlists-count')) {
                document.getElementById('stat-playlists-count').textContent = playlists.length;
            }
            if (document.getElementById('stat-followers-count')) {
                 const count = user.followers ? user.followers.length : 0; // Adjust based on actual backend data structure
                 document.getElementById('stat-followers-count').textContent = count;
            }
            // Assuming 'following' or similar field exists, otherwise 0
             if (document.getElementById('stat-following-count')) {
                 // Check if user object has following, else 0
                 const count = user.following ? user.following.length : 0; 
                 document.getElementById('stat-following-count').textContent = count;
            }
        }

        // Initialize Edit Modal with fresh data
        initEditProfileModal(user);

    } catch (error) {
        console.error("Profile Load Error:", error);
        displayMessage("Failed to load profile data", "error");
    } finally {
        toggleLoader(false);
    }
}

/**
 * Edit Profile Modal Logic
 */
/**
 * Initialize all Profile Interactions
 */
function initProfileInteractions(currentUser) {
    initTextEdit(currentUser);
    initAvatarEdit(currentUser);
}

/**
 * 1. Text Details Edit Modal
 */
function initTextEdit(currentUser) {
    const modal = document.getElementById('edit-profile-modal');
    const openBtn = document.getElementById('open-edit-profile-btn');
    const closeBtn = document.getElementById('close-edit-modal');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const form = document.getElementById('edit-profile-form');
    
    const elements = {
        fullName: document.getElementById('edit-profile-fullname'),
        username: document.getElementById('edit-profile-username'),
        email: document.getElementById('edit-profile-email')
    };

    if (!modal || !openBtn) return;

    // Open
    openBtn.onclick = () => {
        elements.fullName.value = currentUser.fullName || '';
        elements.username.value = currentUser.username || '';
        if(elements.email) elements.email.value = currentUser.email || '';
        
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
            modal.querySelector('div').classList.add('scale-100');
        });
    };

    // Close
    const closeModal = () => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-95');
        modal.querySelector('div').classList.remove('scale-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Submit (Text Only)
    form.onsubmit = async (e) => {
        e.preventDefault();
        toggleLoader(true);
        try {
            const newFullName = elements.fullName.value.trim();
            const newUsername = elements.username.value.trim();
            
            if (newFullName !== currentUser.fullName || newUsername !== currentUser.username) {
                 await api.request('/users/update-account', {
                    method: 'PATCH',
                    body: JSON.stringify({
                        fullName: newFullName,
                        username: newUsername
                    })
                });
                displayMessage('Profile details updated!', 'success');
                closeModal();
                loadProfile();
            } else {
                closeModal(); // No changes
            }
        } catch (error) {
            console.error('Update failed:', error);
            displayMessage(error.message || 'Failed to update profile', 'error');
        } finally {
            toggleLoader(false);
        }
    };
}

/**
 * 2. Avatar Update Modal (Modern Action Sheet Style)
 */
function initAvatarEdit(currentUser) {
    const modal = document.getElementById('avatar-modal');
    const triggerBtn = document.getElementById('btn-hero-edit-avatar');
    
    // Views
    const menuView = document.getElementById('avatar-modal-menu');
    const libraryView = document.getElementById('avatar-modal-library');
    
    // Buttons
    const btnUpload = document.getElementById('btn-action-upload');
    const btnShowLibrary = document.getElementById('btn-show-library');
    const btnRemove = document.getElementById('btn-action-remove');
    const btnCancel = document.getElementById('close-avatar-modal');
    const btnBack = document.getElementById('btn-library-back');
    
    const libraryGrid = document.getElementById('modal-avatar-library');
    const fileInput = document.getElementById('hidden-avatar-input');

    if (!modal || !triggerBtn) return;

    // Helper: Close
    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            // Reset to Menu View
            if(menuView) menuView.classList.remove('hidden');
            if(libraryView) libraryView.classList.add('hidden');
        }, 200);
    };

    // Helper: Render Library
    const renderLibrary = () => {
        if (libraryGrid.children.length > 0) return;
        
        /**
         * AVATAR LIBRARY CONFIGURATION
         * ---------------------------
         * To add more avatars, simply add objects to this array: { seed: 'AnyString', style: 'style-name' }
         * 
         * Supported DiceBear Styles (v9.x):
         * - adventurer, adventurer-neutral, avataaars, big-ears, big-ears-neutral, 
         * - bottts, bottts-neutral, croodles, fun-emoji, icons, lorelei, lorelei-neutral,
         * - micah, miniavs, notionists, open-peeps, personas, pixel-art
         * 
         * Docs: https://www.dicebear.com/styles/
         * 
         * ALTERNATIVE AVATAR APIS (You can replace the URL generation logic below):
         * 1. RoboHash: https://robohash.org/${seed}?set=set4 (Cats) or set1 (Robots)
         * 2. Multiavatar: https://api.multiavatar.com/${seed}.svg
         * 3. Boring Avatars: https://source.boringavatars.com/beam/120/${seed}
         */
         const seeds = [
             // Vivid & Detailed (Adventurer)
             { seed: 'Felix', style: 'adventurer' },
             { seed: 'Aneka', style: 'adventurer' },
             { seed: 'Chloe', style: 'adventurer' },
             { seed: 'Dennis', style: 'adventurer' },
             
             // Artistic & Soft (Lorelei)
             { seed: 'Lisa', style: 'lorelei' },
             { seed: 'John', style: 'lorelei' },
             { seed: 'Maria', style: 'lorelei' },
             { seed: 'David', style: 'lorelei' },
             
             // Modern & Fun (Big Ears)
             { seed: 'Robert', style: 'big-ears' },
             { seed: 'Kim', style: 'big-ears' },
             { seed: 'Mia', style: 'big-ears' },
             { seed: 'Tyler', style: 'big-ears' },
             
             // Hand-drawn (Open Peeps)
             { seed: 'George', style: 'open-peeps' },
             { seed: 'Sarah', style: 'open-peeps' },
             { seed: 'Mike', style: 'open-peeps' }
        ];

        const html = seeds.map(item => {
            const url = `https://api.dicebear.com/9.x/${item.style}/svg?seed=${item.seed}`;
            return `
                <div class="aspect-square rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-primary cursor-pointer transition-all hover:scale-105" onclick="updateAvatarUrl('${url}')">
                    <img src="${url}" class="w-full h-full object-cover" loading="lazy">
                </div>
            `;
        }).join('');
        libraryGrid.innerHTML = html;
    };

    // Open
    triggerBtn.onclick = () => {
        modal.classList.remove('hidden');
        // Reset Views
        menuView.classList.remove('hidden');
        libraryView.classList.add('hidden');
        
        requestAnimationFrame(() => modal.classList.remove('opacity-0'));
    };

     // Actions
    btnCancel.onclick = closeModal;

    btnUpload.onclick = () => fileInput.click();

    btnShowLibrary.onclick = () => {
        menuView.classList.add('hidden');
        libraryView.classList.remove('hidden');
        renderLibrary();
    };

    btnBack.onclick = () => {
        libraryView.classList.add('hidden');
        menuView.classList.remove('hidden');
    };

    btnRemove.onclick = async () => {
        if(confirm('Are you sure you want to remove your current photo?')) {
             const defaultUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser.username}`;
             await window.updateAvatarUrl(defaultUrl);
        }
    };
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        toggleLoader(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            await api.request('/users/update-avatar', {
                method: 'PATCH',
                body: formData
            });
            
            displayMessage('Avatar updated!', 'success');
            closeModal();
            loadProfile();
        } catch (error) {
            displayMessage(error.message || 'Upload failed', 'error');
        } finally {
            toggleLoader(false);
        }
    };

    // Global handler for the inline onclick
    window.updateAvatarUrl = async (url) => {
        toggleLoader(true);
        try {
             await api.request('/users/update-avatar', {
                method: 'PATCH',
                body: JSON.stringify({ avatarUrl: url })
            });
            displayMessage('Avatar updated!', 'success');
            closeModal();
            loadProfile();
        } catch (error) {
            displayMessage(error.message, 'error');
        } finally {
            toggleLoader(false);
        }
    };
}

// Adapter to maintain compatibility with loadProfile call
function initEditProfileModal(currentUser) {
    initTextEdit(currentUser);
    initAvatarEdit(currentUser);
}

document.addEventListener('DOMContentLoaded', loadProfile);

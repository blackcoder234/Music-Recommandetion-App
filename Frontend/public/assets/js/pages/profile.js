
import Auth from '../auth.js';
import api from '../api.js';
import { displayMessage, toggleLoader } from '../utils.js';

// Elements refs
let statsPlaylists;
let statsFollowers;
let statsFollowing;
let playlistsContainer;

// Helper: Card generator
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
             // header-name might be mobile header
             const hn = document.getElementById('header-name');
             if(hn) hn.textContent = user.fullName || user.username;
        }
    
        // Update all avatar instances
        const avatars = document.querySelectorAll('#profile-avatar, #edit-profile-avatar-preview');
        avatars.forEach(img => {
            if(user.avatar) img.src = user.avatar;
            else img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        });

        // Initialize Edit Modal with fresh data (Critical UI)
        initEditProfileModal(user);

        // 2. Fetch User Playlists (Safely)
        try {
            const playlistsResponse = await api.request('/playlists/me'); 
            const playlists = playlistsResponse?.data || [];

            // 3. Render Playlists
            if (playlistsContainer) {
                const playlistHTML = playlists.map(createPlaylistCard).join('');
                playlistsContainer.innerHTML = playlistHTML + createAddPlaylistCard();
                
                if (document.getElementById('stat-playlists-count')) {
                    document.getElementById('stat-playlists-count').textContent = playlists.length;
                }
            }
        } catch (plError) {
            console.warn("Failed to load playlists", plError);
            if(playlistsContainer) playlistsContainer.innerHTML = createAddPlaylistCard() + '<p class="text-xs text-red-500 w-full text-center">Failed to load playlists</p>';
        }

        // Update Stats (Followers/Following)
        if (document.getElementById('stat-followers-count')) {
            const count = user.followers ? user.followers.length : 0; 
            document.getElementById('stat-followers-count').textContent = count;
        }
        if (document.getElementById('stat-following-count')) {
            const count = user.following ? user.following.length : 0; 
            document.getElementById('stat-following-count').textContent = count;
        }

        // 4. Load Extra Data
        loadRecentlyPlayed();
        loadFollowing(user);

    } catch (error) {
        console.error("Profile Load Error:", error);
        displayMessage("Failed to load profile data", "error");
    } finally {
        toggleLoader(false);
    }
}

function initEditProfileModal(currentUser) {
    initTextEdit(currentUser);
    initAvatarEdit(currentUser);
}

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

    const closeModal = () => {
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.add('scale-95');
        modal.querySelector('div').classList.remove('scale-100');
        setTimeout(() => modal.classList.add('hidden'), 300);
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

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
                closeModal(); 
            }
        } catch (error) {
            console.error('Update failed:', error);
            displayMessage(error.message || 'Failed to update profile', 'error');
        } finally {
            toggleLoader(false);
        }
    };
}

function initAvatarEdit(currentUser) {
    const modal = document.getElementById('avatar-modal');
    const triggerBtn = document.getElementById('btn-hero-edit-avatar');
    
    const menuView = document.getElementById('avatar-modal-menu');
    const libraryView = document.getElementById('avatar-modal-library');
    
    const btnUpload = document.getElementById('btn-action-upload');
    const btnShowLibrary = document.getElementById('btn-show-library');
    const btnRemove = document.getElementById('btn-action-remove');
    const btnCancel = document.getElementById('close-avatar-modal');
    const btnBack = document.getElementById('btn-library-back');
    
    const libraryGrid = document.getElementById('modal-avatar-library');
    const fileInput = document.getElementById('hidden-avatar-input');

    if (!modal || !triggerBtn) return;

    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            if(menuView) menuView.classList.remove('hidden');
            if(libraryView) libraryView.classList.add('hidden');
        }, 200);
    };

    const renderLibrary = () => {
        if (libraryGrid.children.length > 0) return;
        
        const seeds = [
             { seed: 'Felix', style: 'adventurer' },
             { seed: 'Aneka', style: 'adventurer' },
             { seed: 'Chloe', style: 'adventurer' },
             { seed: 'Dennis', style: 'adventurer' },
             { seed: 'Lisa', style: 'lorelei' },
             { seed: 'John', style: 'lorelei' },
             { seed: 'Maria', style: 'lorelei' },
             { seed: 'David', style: 'lorelei' },
             { seed: 'Robert', style: 'big-ears' },
             { seed: 'Kim', style: 'big-ears' },
             { seed: 'Mia', style: 'big-ears' },
             { seed: 'Tyler', style: 'big-ears' },
             { seed: 'George', style: 'open-peeps' },
             { seed: 'Sarah', style: 'open-peeps' },
             { seed: 'Mike', style: 'open-peeps' }
        ];

        const html = seeds.map(item => {
            const url = `https://api.dicebear.com/9.x/${item.style}/svg?seed=${item.seed}`;
            return `
                <div class="aspect-square rounded-full overflow-hidden bg-white/5 border border-white/10 hover:border-primary cursor-pointer transition-all hover:scale-105" onclick="window.updateAvatarUrl('${url}')">
                    <img src="${url}" class="w-full h-full object-cover" loading="lazy">
                </div>
            `;
        }).join('');
        libraryGrid.innerHTML = html;
    };

    triggerBtn.onclick = () => {
        modal.classList.remove('hidden');
        menuView.classList.remove('hidden');
        libraryView.classList.add('hidden');
        requestAnimationFrame(() => modal.classList.remove('opacity-0'));
    };

    if(btnCancel) btnCancel.onclick = closeModal;
    if(btnUpload) btnUpload.onclick = () => fileInput.click();
    
    if(btnShowLibrary) btnShowLibrary.onclick = () => {
        menuView.classList.add('hidden');
        libraryView.classList.remove('hidden');
        renderLibrary();
    };

    if(btnBack) btnBack.onclick = () => {
        libraryView.classList.add('hidden');
        menuView.classList.remove('hidden');
    };

    if(btnRemove) btnRemove.onclick = async () => {
        if(confirm('Are you sure you want to remove your current photo?')) {
             const defaultUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${currentUser.username}`;
             await window.updateAvatarUrl(defaultUrl);
        }
    };
    
    if(fileInput) fileInput.onchange = async (e) => {
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

    // Global handler adapter (needed if we use onclick attribute in HTML)
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

// Tab Switching
window.switchProfileTab = (tabName) => {
    // Buttons
    ['playlists', 'recent', 'following'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if(btn) {
            if (t === tabName) {
                btn.classList.add('text-white', 'border-primary');
                btn.classList.remove('text-text-secondary', 'border-transparent');
            } else {
                btn.classList.remove('text-white', 'border-primary');
                btn.classList.add('text-text-secondary', 'border-transparent');
            }
        }
    });

    // Content
    document.querySelectorAll('.profile-tab-content').forEach(el => el.classList.add('hidden'));
    const content = document.getElementById(`content-${tabName}`);
    if(content) content.classList.remove('hidden');
};

async function loadRecentlyPlayed() {
    const container = document.getElementById('profile-recent-grid');
    if(!container) return;

    try {
        const response = await api.request('/playback/history');
        const tracks = response.data || [];
        
        if (tracks.length === 0) {
            container.innerHTML = '<div class="text-text-secondary text-center py-10">No recently played tracks</div>';
            return;
        }

        container.innerHTML = tracks.map((item, index) => {
             const track = item.track || item; 
             const date = item.playedAt ? new Date(item.playedAt).toLocaleDateString() : '';
             const image = track.imageUrl || track.album?.coverImage || 'assets/images/album/default_album.png';
             const trackId = track._id || track.id;

             return `
                <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group play-track-btn" data-id="${trackId}">
                    <span class="text-text-secondary w-6 text-center group-hover:hidden">${index + 1}</span>
                    <button class="w-6 h-6 hidden group-hover:flex items-center justify-center text-primary"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
                    
                    <img src="${image}" class="w-10 h-10 rounded object-cover">
                    
                    <div class="flex-1 min-w-0">
                        <div class="text-white font-medium truncate group-hover:text-primary transition-colors">${track.title}</div>
                        <div class="text-xs text-text-secondary truncate">${track.artist?.name || 'Unknown Artist'}</div>
                    </div>
                    <div class="text-xs text-text-secondary">${date}</div>
                </div>
             `;
        }).join('');

    } catch (e) {
        console.error("Recent Load Error", e);
        container.innerHTML = '<div class="text-text-secondary text-center py-4">Failed to load history</div>';
    }
}

async function loadFollowing(user) {
    const container = document.getElementById('profile-following-grid');
    if(!container) return;

    if (!user.following || user.following.length === 0) {
         container.innerHTML = '<div class="text-text-secondary text-center py-10 col-span-full">Not following anyone yet</div>';
         return;
    }
    
    const following = user.following; 
    
    // We assume following is populated. If not, we might need to fetch.
    // Since backend might just send IDs, we check type.
    if (following.length > 0 && typeof following[0] === 'string') {
        // Only IDs available. 
        container.innerHTML = '<div class="text-text-secondary text-center py-10 col-span-full">Following list content not accessible (IDs only)</div>';
        return;
    }

    container.innerHTML = following.map(f => {
        return `
            <div class="bg-surface p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center group">
                <img src="${f.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${f.username}`}" class="w-24 h-24 rounded-full mx-auto mb-3 object-cover shadow-lg group-hover:scale-105 transition-transform">
                <h3 class="font-medium text-white truncate">${f.username}</h3>
                <p class="text-xs text-text-secondary">User</p>
            </div>
        `;
    }).join('');
}

export function init() {
    playlistsContainer = document.getElementById('profile-playlists-grid');
    loadProfile();
}

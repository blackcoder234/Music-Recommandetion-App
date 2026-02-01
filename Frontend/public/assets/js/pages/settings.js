
import Auth from '../auth.js';
import { displayMessage, toggleLoader } from '../utils.js';

export function getHTML() {
    return `
        <div class="max-w-2xl w-full mx-auto p-4 pb-20 space-y-8 animate-fade-in">
          <div class="flex items-center gap-4 mb-4">
             <h1 class="text-3xl font-bold">Settings</h1>
          </div>
          
          <!-- Account Section -->
          <section>
            <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2">
              Account
            </h2>
            <div class="bg-surface rounded-2xl overflow-hidden border border-white/5">
              <a href="/profile" class="block p-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                <div class="flex items-center gap-4">
                  <img id="settings-avatar" src="https://ui-avatars.com/api/?name=User&background=FF007A&color=fff" alt="Avatar" class="w-12 h-12 rounded-full" />
                  <div>
                    <p id="settings-name" class="font-medium text-white group-hover:text-primary transition-colors">User</p>
                    <p id="settings-email" class="text-sm text-text-secondary">user@example.com</p>
                  </div>
                </div>
                <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </a>
              <div class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer">
                <div>
                  <p class="font-medium text-white">Subscription Plan</p>
                  <p id="settings-plan" class="text-sm text-primary">Premium Individual</p>
                </div>
                <a href="/premium" class="text-xs bg-white/10 px-3 py-1 rounded-full text-text-secondary hover:text-white hover:bg-white/20 transition-colors">Manage</a>
              </div>
            </div>
          </section>

          <!-- Playback Section -->
          <section>
            <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2">Playback</h2>
            <div class="bg-surface rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
              <div class="p-4 flex items-center justify-between">
                <div>
                  <p class="font-medium text-white">Offline Mode</p>
                  <p class="text-xs text-text-secondary">When you go offline, you'll only be able to play the music you've downloaded.</p>
                </div>
                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="offline-mode" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-surface"/>
                  <label for="offline-mode" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                </div>
              </div>

              <div class="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer">
                <div>
                  <p class="font-medium text-white">Audio Quality</p>
                  <p class="text-xs text-text-secondary">Streaming Quality</p>
                </div>
                <div class="flex items-center gap-2 text-text-secondary">
                  <span class="text-sm">Very High</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>

              <div class="p-4 flex items-center justify-between">
                <div>
                  <p class="font-medium text-white">Crossfade</p>
                  <p class="text-xs text-text-secondary">Allows you to overlap songs for a smooth transition.</p>
                </div>
                <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="crossfade" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-surface" checked/>
                  <label for="crossfade" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                </div>
              </div>
            </div>
          </section>

          <!-- Notifications Section -->
          <section>
             <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2">Notifications</h2>
             <div class="bg-surface rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                <div class="p-4 flex items-center justify-between">
                  <p class="font-medium text-white">New Music</p>
                  <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                     <input type="checkbox" name="toggle" id="notif-music" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-surface" checked/>
                     <label for="notif-music" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                  </div>
                </div>
                <div class="p-4 flex items-center justify-between">
                   <p class="font-medium text-white">Playlist Updates</p>
                   <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="notif-playlist" class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-surface"/>
                      <label for="notif-playlist" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                   </div>
                </div>
             </div>
          </section>

          <!-- About Section -->
          <section>
             <h2 class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-2">About</h2>
             <div class="bg-surface rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
                <div class="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer">
                   <p class="font-medium text-white">Version</p>
                   <span class="text-sm text-text-secondary">2.4.0</span>
                </div>
                <a href="/terms" class="block p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer text-white">
                   <p class="font-medium">Terms and Conditions</p>
                   <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </a>
                <a href="/privacy" class="block p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer text-white">
                   <p class="font-medium">Privacy Policy</p>
                   <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </a>
             </div>
          </section>

          <button class="auth-logout-btn block w-full text-center bg-surface border border-white/5 text-red-500 font-semibold py-4 rounded-2xl hover:bg-red-500/10 transition-colors mt-8">
             Log Out
          </button>
        </div>
    `;
}

export async function init() {
    console.log("Initializing Settings Page...");
    
    const user = await Auth.getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    // Bind User Data
    const avatarEl = document.getElementById('settings-avatar');
    const nameEl = document.getElementById('settings-name');
    const emailEl = document.getElementById('settings-email');
    const planEl = document.getElementById('settings-plan');

    if (avatarEl) {
        avatarEl.src = user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;
    }
    if (nameEl) nameEl.textContent = user.fullName || user.username;
    if (emailEl) emailEl.textContent = user.email;
    if (planEl) {
        // Mock plan or from user object
        planEl.textContent = "Free Plan"; 
        // If we had premium logic: user.isPremium ? "Premium Individual" : "Free Plan"
    }

    // Bind Toggles (Local Storage)
    setupToggle('offline-mode', 'beatify_offline_mode');
    setupToggle('crossfade', 'beatify_crossfade');
    setupToggle('notif-music', 'beatify_notif_music');
    setupToggle('notif-playlist', 'beatify_notif_playlist');
    
    // Bind Logout
    bindLogout();
}

function setupToggle(id, storageKey) {
    const toggle = document.getElementById(id);
    if (!toggle) return;

    // Load state
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
        toggle.checked = saved === 'true';
    }

    // Save state
    toggle.onchange = (e) => {
        localStorage.setItem(storageKey, e.target.checked);
        displayMessage("Settings saved", "success");
    };
}

function bindLogout() {
    const btns = document.querySelectorAll('.auth-logout-btn');
    btns.forEach(btn => {
        // Clone to remove old listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.onclick = async () => {
            if(confirm("Are you sure you want to logout?")) {
                await Auth.logout();
            }
        };
    });
}

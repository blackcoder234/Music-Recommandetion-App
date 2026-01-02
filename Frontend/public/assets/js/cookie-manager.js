/**
 * Beatify Cookie Management System
 * Matches the dark/premium aesthetic of the application.
 */

const CookieManager = {
    setCookie: function(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    },

    getCookie: function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    eraseCookie: function(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
};

// Initialize on Load
document.addEventListener("DOMContentLoaded", function() {
    
    // Check if consent already given
    const consent = CookieManager.getCookie('beatify-cookie-consent');
    
    if (!consent) {
        showCookieBanner();
    } else {
        // Apply existing preferences
        const prefs = JSON.parse(CookieManager.getCookie('beatify-cookie-prefs') || '{}');
        applyPreferences(prefs);
    }

    // Attach listener to settings/preferences buttons if they exist
    // (For the footer link or policy page button)
    const openSettingsBtns = document.querySelectorAll('#open-cookie-settings, [href="#cookie-settings"]');
    openSettingsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showPreferencesModal();
        });
    });

});

function showCookieBanner() {
    // Avoid duplicates
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    // Dark theme classes: bg-[#121212], border-t border-white/10
    banner.className = 'fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/10 shadow-2xl z-[100] transform translate-y-full transition-transform duration-500 p-6 md:p-8';
    
    banner.innerHTML = `
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex-1 space-y-2 text-center md:text-left">
                <h3 class="text-white font-bold text-lg">We value your privacy</h3>
                <p class="text-text-secondary text-sm leading-relaxed max-w-2xl">
                    We use cookies to enhance your playback experience, analyze traffic, and ensure you never lose your groove. 
                    By clicking "Accept All", you agree to our use of cookies.
                    <a href="/cookie.html" class="text-primary hover:underline">Read Policy</a>.
                </p>
            </div>
            <div class="flex gap-4 shrink-0">
                <button id="cookie-btn-reject" class="px-5 py-2.5 rounded-lg border border-white/10 text-white font-medium hover:bg-white/5 transition-colors text-sm">
                    Reject Non-Essential
                </button>
                <button id="cookie-btn-accept" class="px-5 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 text-sm shadow-lg shadow-primary/20">
                    Accept All
                </button>
            </div>
            <button id="cookie-btn-settings" class="absolute top-4 right-4 md:static md:hidden text-text-secondary hover:text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
    `;

    document.body.appendChild(banner);

    // Animate In
    requestAnimationFrame(() => {
        banner.classList.remove('translate-y-full');
    });

    // Listeners
    document.getElementById('cookie-btn-accept').addEventListener('click', () => {
        saveConsent('accepted');
        hideBanner();
    });

    document.getElementById('cookie-btn-reject').addEventListener('click', () => {
        saveConsent('rejected');
        hideBanner();
    });

    // Mobile close -> Reject implicit or just hide? usually hide = reject/ask later. Let's make it act as settings or minimize.
    // Actually standard is 'Manage Preferences', let's add that button in the flex row for proper UX
}

function showPreferencesModal() {
    let modal = document.getElementById('cookie-modal');
    
    // If not exists, create it
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cookie-modal';
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
        
        const existingPrefs = JSON.parse(CookieManager.getCookie('beatify-cookie-prefs') || '{"analytics": false, "functional": false}');

        modal.innerHTML = `
            <div class="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl transform scale-95 transition-transform duration-300">
                <!-- Header -->
                <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#202020]">
                    <h3 class="text-xl font-bold text-white">Cookie Preferences</h3>
                    <button id="cookie-modal-close" class="text-text-secondary hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <p class="text-text-secondary text-sm">Convert your privacy preferences below. Essential cookies cannot be disabled as they are required for the app to function.</p>
                    
                    <!-- Item 1: Essential -->
                    <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                        <div class="flex-1">
                            <h4 class="text-white font-semibold mb-1">Essential Cookies</h4>
                            <p class="text-xs text-text-secondary">Required for login, session management, and core playback.</p>
                        </div>
                        <div class="relative inline-block w-12 h-6 rounded-full bg-primary/50 cursor-not-allowed">
                             <span class="absolute right-1 top-1 bg-white w-4 h-4 rounded-full"></span>
                        </div>
                         <input type="checkbox" checked disabled class="hidden">
                    </div>

                    <!-- Item 2: Analytics -->
                    <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                         <div class="flex-1">
                            <h4 class="text-white font-semibold mb-1">Analytics</h4>
                            <p class="text-xs text-text-secondary">Help us improve by measuring how you use Beatify.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="pref-analytics" class="sr-only peer" ${existingPrefs.analytics ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <!-- Item 3: Functional -->
                    <div class="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                         <div class="flex-1">
                            <h4 class="text-white font-semibold mb-1">Functional</h4>
                            <p class="text-xs text-text-secondary">Remembers your volume, quality settings, and playlists.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="pref-functional" class="sr-only peer" ${existingPrefs.functional ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                <!-- Footer -->
                <div class="p-6 border-t border-white/10 bg-[#202020] flex justify-end gap-4">
                    <button id="cookie-modal-save" class="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-transform active:scale-95">
                        Save Preferences
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Logic
        document.getElementById('cookie-modal-close').addEventListener('click', closePreferencesModal);
        document.getElementById('cookie-modal-save').addEventListener('click', () => {
            const analytics = document.getElementById('pref-analytics').checked;
            const functional = document.getElementById('pref-functional').checked;
            
            saveConsent('custom', { analytics, functional });
            closePreferencesModal();
            hideBanner(); // If open
        });
    }

    // Show
    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
    });
}

function closePreferencesModal() {
    const modal = document.getElementById('cookie-modal');
    if (!modal) return;
    
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.remove('scale-100');
    modal.querySelector('div').classList.add('scale-95');
    
    setTimeout(() => {
        modal.remove(); // Destroy on close to reset state next time or keep hidden
        document.body.style.overflow = '';
    }, 300);
}

function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('translate-y-full');
        setTimeout(() => banner.remove(), 500);
    }
}

function saveConsent(status, prefs = null) {
    if (!prefs) {
        // Defaults based on status
        if (status === 'accepted') {
            prefs = { analytics: true, functional: true };
        } else {
            prefs = { analytics: false, functional: false };
        }
    }
    
    CookieManager.setCookie('beatify-cookie-consent', status, 365);
    CookieManager.setCookie('beatify-cookie-prefs', JSON.stringify(prefs), 365);
    
    applyPreferences(prefs);
    
    // Notify user
    // window.displayMessage && window.displayMessage('Preferences Saved', 'success');
}

function applyPreferences(prefs) {
    // Enable/Disable features based on prefs
    if (prefs.analytics) {
        console.log("Beatify Analytics: Enabled");
        // window.gtag(...)
    } else {
        console.log("Beatify Analytics: Disabled");
    }
    
    if (prefs.functional) {
        // Maybe restore volume settings
    }
}

// Global Exports
window.CookieManager = CookieManager;
window.showPreferencesModal = showPreferencesModal;
import Auth from './auth.js';
import api from './api.js';
import { displayMessage } from './utils.js';
import './playlistModal.js';
import { PLAYER_HTML, MOBILE_NAV_HTML, SIDEBAR_HTML, RIGHT_SIDEBAR_HTML, MOBILE_HEADER_HTML } from './layout.js';
import { trackVisitor } from './visitor-tracker.js';

// Initialize Visitor Tracking (Single call per session)
document.addEventListener('DOMContentLoaded', trackVisitor);

// Global Like Function
window.toggleLike = async (trackId) => {
    try {
        const response = await api.request(`/tracks/${trackId}/like`, { method: 'POST' });
        
        // Check current page
        if (window.location.pathname.includes('/liked')) {
             // If we are on Liked page, simple reload or re-render if function exists
             if (typeof renderLikedTracks === 'function') {
                 renderLikedTracks();
             } else {
                 // Soft reload for SPA: just re-fetch the content
                 navigateTo(window.location.pathname); 
             }
             displayMessage("Removed from Liked Songs", "success");
        } else {
             displayMessage("Favorites updated", "success");
        }
    } catch (e) {
        console.error("Like Error:", e);
        displayMessage("Failed to update like status", "error");
    }
};

// Main JavaScript File for Beatify
// Handles frontend interactions: Sidebar (Mobile/Desktop) and general UI toggles.

document.addEventListener('DOMContentLoaded', () => {
    // Marketing Page Logic (Skip App Shell)
    if (document.body.classList.contains('marketing-page')) {
        const menuBtn = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('marketing-mobile-menu');
        const header = document.getElementById('marketing-header');
        
        if (menuBtn && menu) {
            menuBtn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
                // Optional: Animate icon
            });
        }

        if (header) {
            window.addEventListener('scroll', () => {
                 if (window.scrollY > 10) {
                     header.classList.add('bg-background/95', 'backdrop-blur-md', 'shadow-lg');
                     header.classList.remove('bg-transparent');
                 } else {
                     header.classList.remove('bg-background/95', 'backdrop-blur-md', 'shadow-lg');
                     header.classList.add('bg-transparent');
                 }
            });
        }
        return; // Stop execution of App Shell logic
    }

    // ==========================================
    // GLOBAL UI INJECTION (App Only)
    // ==========================================
    
    // 1. Mobile Header (Top)
    // Only inject if not already there (though we plan to remove it from HTML)
    if (!document.querySelector('header.md\\:hidden')) {
         const app = document.getElementById('app') || document.body;
         // Insert as first child of #app if possible, or body
         if(document.getElementById('app')) {
            document.getElementById('app').insertAdjacentHTML('afterbegin', MOBILE_HEADER_HTML);
         } else {
            document.body.insertAdjacentHTML('afterbegin', MOBILE_HEADER_HTML);
         }
    }

    // 2. Right Sidebar (Mobile Menu)
    if (!document.getElementById('right-sidebar')) {
         // Insert after header or at start of #app
         const app = document.getElementById('app');
         if(app) app.insertAdjacentHTML('afterbegin', RIGHT_SIDEBAR_HTML);
    }
    
    // 3. Left Sidebar (Desktop/Mobile Drawer)
    if (!document.getElementById('sidebar')) {
         const app = document.getElementById('app');
         if(app) app.insertAdjacentHTML('afterbegin', SIDEBAR_HTML);
    }

    // 4. Player Bar
    if (!document.getElementById('player-bar')) {
        document.body.insertAdjacentHTML('beforeend', PLAYER_HTML);
    }
    
    // 5. Mobile Nav (Bottom)
    if (!document.querySelector('nav.md\\:hidden.fixed.bottom-0')) {
         document.body.insertAdjacentHTML('beforeend', MOBILE_NAV_HTML);
    }

    
    // ==========================================
    // ROUTER & NAVIGATION
    // ==========================================
    setupRouter();
    
    // Initial Page Load execution
    initializePageScripts(window.location.href);

    // ==========================================
    // GLOBAL SEARCH LOGIC (Event Delegation)
    // ==========================================
    // Use event delegation for search inputs since they might be dynamically injected
    document.addEventListener('keydown', (e) => {
        if ((e.target.id === 'global-search-input') && e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query) {
                navigateTo(`/discover?search=${encodeURIComponent(query)}`);
            }
        }
    });
    
    // ==========================================
    // SIDEBAR NAVIGATION LOGIC
    // ==========================================

    /**
     * Mobile Sidebar Elements
     */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar'); // Left Sidebar
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    
    // Right Sidebar Elements
    const mobileRightSidebarBtn = document.getElementById('mobile-right-sidebar-btn');
    const rightSidebar = document.getElementById('right-sidebar');
    const closeRightSidebarBtn = document.getElementById('close-right-sidebar-btn');

    const sidebarOverlay = document.getElementById('sidebar-overlay');

    /**
     * Desktop Sidebar Elements
     */
    const desktopSidebarToggle = document.getElementById('desktop-sidebar-toggle');
    const appContainer = document.getElementById('app');
    
    // ==========================================
    // MOBILE SIDEBAR FUNCTIONS
    // ==========================================

    /**
     * toggleMobileSidebar (Left)
     */
    function toggleMobileSidebar() {
        const isOpen = sidebar.classList.contains('-translate-x-0'); 
        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }

    function openMobileSidebar() {
        sidebar.classList.remove('-translate-x-full'); 
        sidebarOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
    }

    function closeMobileSidebar() {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    /**
     * toggleRightSidebar (Right)
     */
     function openRightSidebar() {
        if(rightSidebar) {
            rightSidebar.classList.remove('translate-x-full'); // Slide IN (remove hidden)
            // Ensure logic matches CSS: transform translate-x-full is default (hidden right)
            // remove it -> translates to 0 (visible)
            // Wait, I need to check if default class has translate-x-full. Yes, I added it.
            // But usually for right sidebar sliding in, we might need 'translate-x-0' to force valid state if not default.
            // Let's assume removing translate-x-full makes it 0 if not specified closer? 
            // Actually better to add a class 'translate-x-0' if standard tailwind doesn't default to 0 without classes.
            rightSidebar.classList.add('translate-x-0');
            sidebarOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeRightSidebar() {
        if(rightSidebar) {
            rightSidebar.classList.remove('translate-x-0');
            rightSidebar.classList.add('translate-x-full'); 
            sidebarOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Event Listeners for Mobile Interactions
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    }

    // Right Sidebar Listeners
    if (mobileRightSidebarBtn) {
        mobileRightSidebarBtn.addEventListener('click', openRightSidebar);
    }
    if (closeRightSidebarBtn) {
        closeRightSidebarBtn.addEventListener('click', closeRightSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeMobileSidebar();  // Close Left
            closeRightSidebar();   // Close Right
        });
    }
    
    // ==========================================
    // DESKTOP SIDEBAR FUNCTIONS
    // ==========================================

    /**
     * toggleDesktopSidebar
     * Collapses or Expands the sidebar on desktop view.
     * Toggles the width of the sidebar element.
     */
    function toggleDesktopSidebar() {
        const isExpanded = sidebar.classList.contains('w-64');
        const icon = desktopSidebarToggle.querySelector('svg');

        if (isExpanded) {
            // Collapse Sidebar
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-0');
            sidebar.classList.add('border-none'); // Ensure no border line is visible
            
            // Move Toggle Button to Left Edge
            desktopSidebarToggle.classList.remove('left-64');
            desktopSidebarToggle.classList.add('left-0');
            
            // Make Toggle Button Always Visible (since there is no sidebar to hover)
            desktopSidebarToggle.classList.remove('opacity-0', 'peer-hover:opacity-100', 'hover:opacity-100');
            desktopSidebarToggle.classList.add('opacity-100', 'bg-surface'); // Ensure visibility and contrast

            // Rotate icon to point Right (indicating expand)
            if(icon) icon.style.transform = 'rotate(180deg)';
        } else {
            // Expand Sidebar
            sidebar.classList.remove('w-0');
            sidebar.classList.remove('border-none');
            sidebar.classList.add('w-64');
            
            // Move Toggle Button back to Sidebar Edge
            desktopSidebarToggle.classList.remove('left-0');
            desktopSidebarToggle.classList.add('left-64');
            
            // Restore Hover Interaction for Button Visibility
            desktopSidebarToggle.classList.remove('opacity-100', 'bg-surface');
            desktopSidebarToggle.classList.add('opacity-0', 'peer-hover:opacity-100', 'hover:opacity-100');

            // Rotate icon to point Left (indicating collapse)
            if(icon) icon.style.transform = 'rotate(0deg)';
        }
    }

    // Event Listener for Desktop Toggle
    if (desktopSidebarToggle) {
        desktopSidebarToggle.addEventListener('click', toggleDesktopSidebar);
    }

});


/* =========================================
   AUTHENTICATION LOGIC (Paste at bottom)
   ========================================= */

const protectedRoutes = [
    '/profile',
    '/settings'
];

// Helper: Check if current page requires login
function isProtected() {
    return protectedRoutes.some(route => window.location.pathname.includes(route));
}

// Helper: Update Navbar (Login vs Avatar)
function updateAuthUI(user) {
    const loginBtns = document.querySelectorAll('.auth-login-btn');
    const profileSections = document.querySelectorAll('.auth-profile-section');
    const userNames = document.querySelectorAll('.auth-user-name');
    const userAvatars = document.querySelectorAll('.auth-user-avatar');

    // Mobile Bottom Nav Elements
    const mobileNavProfileContainer = document.getElementById('mobile-nav-profile-icon-container');

    if (user) {
        // Logged In State
        loginBtns.forEach(btn => btn.classList.add('hidden'));
        profileSections.forEach(section => section.classList.remove('hidden'));
        
        // Update Name & Avatar
        userNames.forEach(el => {
            if (el) el.textContent = user.fullName || user.username;
        });
        if (user.avatar) {
            userAvatars.forEach(img => {
                if (img) img.src = user.avatar;
            });
        }

        // Update Mobile Bottom Nav Icon to Avatar
        if (mobileNavProfileContainer) {
            mobileNavProfileContainer.innerHTML = `
                <img src="${user.avatar || 'https://ui-avatars.com/api/?name=User'}" 
                     class="w-6 h-6 rounded-full object-cover border border-white/20" 
                     alt="Profile" />
            `;
        }

    } else {
        // Guest State
        loginBtns.forEach(btn => btn.classList.remove('hidden'));
        profileSections.forEach(section => section.classList.add('hidden'));

        // Restore Mobile Bottom Nav Icon to SVG
        if (mobileNavProfileContainer) {
            mobileNavProfileContainer.innerHTML = `
                <svg id="mobile-nav-profile-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            `;
        }
    }
}

// Main Auth Initialization
(async function initAuth() {
    // 1. Listen for Tab Sync (Login/Logout in other tabs)
    Auth.initSessionSync();

    // 2. Check Login Status
    const user = await Auth.getCurrentUser();

    // 3. Redirect if on Protected Page & Guest
    if (!user && isProtected()) {
        window.location.replace('/login');
        return;
    }

    // 4. Update Navbar UI
    updateAuthUI(user);

    // 4b. Populate Settings Page if applicable
    if (window.location.pathname.includes('/setting') && user) {
        const sName = document.getElementById('settings-name');
        const sEmail = document.getElementById('settings-email');
        const sAvatar = document.getElementById('settings-avatar');
        
        if (sName) sName.textContent = user.fullName || user.username;
        if (sEmail) sEmail.textContent = user.email || 'user@example.com';
        if (sAvatar && user.avatar) sAvatar.src = user.avatar;
    }

    // 5. Setup Logout Listeners
    window.handleLogout = () => Auth.logout();
    document.addEventListener('click', (e) => {
        if (e.target.closest('.auth-logout-btn')) {
            e.preventDefault();
            Auth.logout();
        }
    });

    console.log("Auth System Initialized");
})();

window.navigateTo = navigateTo;

function setupRouter() {
    // Handle Browser Back/Forward Buttons
    window.addEventListener('popstate', () => {
        navigateTo(window.location.pathname + window.location.search, false);
    });

    // Intercept clicks on links
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a');
        
        // Skip null, external, download, _blank links
        if (!link || 
            !link.href.startsWith(window.location.origin) || 
            link.hasAttribute('download') || 
            link.target === '_blank') {
            return;
        }

        // STATIC PAGES LIST EXEMPTION
        // These pages should behave like normal websites (Hard Reload)
        const staticPages = [
            '/about', '/about.html', 
            '/contact', '/contact.html',
            '/premium', '/premium.html',
            '/support', '/support.html',
            '/cookie', '/cookie.html', '/cookies',
            '/login', '/login.html',
            '/signup', '/signup.html',
            '/404', '/404.html',
            '/profile', '/profile.html',
            '/create_playlist', '/create_playlist.html'
        ];
        
        const path = link.getAttribute('href').split('?')[0]; // simple path check

        if (staticPages.some(sp => path === sp || path.startsWith(sp + '?'))) {
            // Allow default browser navigation (hard load)
            return;
        }

        // If current page is NOT the main app shell (missing sidebar), do not use SPA nav
        if (!document.getElementById('sidebar')) {
            return;
        }

        // Prevent default SPA nav
        e.preventDefault();
        navigateTo(link.getAttribute('href'));
    });
}

/**
 * Navigate to a URL without full reload (SPA transition)
 * @param {string} url - The URL to navigate to
 * @param {boolean} updateHistory - Whether to push to history stack
 */
async function navigateTo(url, updateHistory = true) {
    if (updateHistory) {
        history.pushState(null, null, url);
    }

    try {
        let newMainContent = null;
        let pageTitle = 'Beatify'; // Default title
        const path = new URL(url, window.location.origin).pathname;

        // CLIENT-SIDE ROUTING INTERCEPTION
        if (path.includes('/settings')) {
             const module = await import('./pages/settings.js');
             if (module.getHTML) {
                 newMainContent = module.getHTML();
                 pageTitle = 'Settings - Beatify';
                 
                 // Reuse existing header if present?
                 // The header is part of the main layout, usually outside the dynamic content.
                 // If getHTML returns only the content div, we need to ensure the header is preserved
                 // or re-added. The current `navigateTo` replaces `currentMain.innerHTML`.
                 // So, if `getHTML` only returns the content div, we need to prepend the header.
                 // Assuming the header is a direct child of <main> and has a specific class.
                 const currentHeader = document.querySelector('main > header'); // Adjust selector if needed
                 if (currentHeader) {
                     newMainContent = currentHeader.outerHTML + newMainContent;
                 }
             }
        }

        if (!newMainContent) {
            // Fallback to Server Fetch
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network response was not ok");
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main');
            if(newMain) newMainContent = newMain.innerHTML;
            pageTitle = doc.title;
        }

        const currentMain = document.querySelector('main');
        if (currentMain && newMainContent) {
            // Fade out
            currentMain.style.opacity = '0';
            currentMain.style.transition = 'opacity 0.2s ease-out';
            
            setTimeout(() => {
                currentMain.innerHTML = newMainContent;
                
                // Update Page Title
                document.title = pageTitle;
                
                // Re-initialize Page Scripts
                initializePageScripts(url);

                // Update Active States in Sidebar
                updateActiveNav(url);
                
                // Restore Opacity
                currentMain.style.opacity = '1';
                currentMain.scrollTop = 0; // Reset scroll position for new page
                
            }, 200); 
        }

    } catch (error) {
        console.error("Navigation Error:", error);
        window.location.href = url; // Fallback
    }
}

function updateActiveNav(url) {
    // Normalize URL
    const path = new URL(url, window.location.origin).pathname;
    
    document.querySelectorAll('.nav-item').forEach(link => {
        link.classList.remove('bg-primary', 'text-white', 'shadow-lg');
        link.classList.add('text-text-secondary');
        link.classList.add('hover:text-white', 'hover:bg-white/5');

        if (link.getAttribute('href') === path || (path.includes('/settings') && link.getAttribute('href').includes('/settings'))) {
            link.classList.add('bg-primary', 'text-white', 'shadow-lg');
            link.classList.remove('text-text-secondary', 'hover:text-white', 'hover:bg-white/5');
        }
    });
}

async function initializePageScripts(url) {
    const path = new URL(url, window.location.origin).pathname;

    // Ensure Sidebar Highlight is correct
    updateActiveNav(url);

    // Check Auth State
    if (window.checkAuthState) window.checkAuthState();
    // Re-check Auth UI
    if (Auth && Auth.getCurrentUser) {
        Auth.getCurrentUser().then(user => updateAuthUI(user));
    }

    try {
        if (path === '/discover') {
            const module = await import('./pages/discover.js');
            if (module.init) module.init();
        } else if (path === '/profile') {
            const module = await import('./pages/profile.js');
            if (module.init) module.init();
        } else if (path === '/library' || path === '/library.html') {
            const module = await import('./pages/library.js');
            if (module.init) module.init();
        } else if (path === '/' || path === '/index.html') {
            const module = await import('./pages/home.js');
            if (module.init) module.init();
        } else if (path === '/liked' || path === '/liked.html') {
            const module = await import('./pages/liked.js');
            if (module.init) module.init();
        } else if (path.includes('/album')) {
             const module = await import('./pages/album.js');
             if (module.init) module.init();
        } else if (path.includes('/artist')) {
             const module = await import('./pages/artist.js');
             if (module.init) module.init();
        } else if (path === '/create_playlist' || path === '/create_playlist.html') {
             const module = await import('./pages/create_playlist.js');
             if (module.init) module.init();
        } else if (path.includes('/playlist')) {
             const module = await import('./pages/playlist.js');
             if (module.init) module.init();
        } else if (path === '/settings' || path === '/settings.html') {
             const module = await import('./pages/settings.js');
             if (module.init) module.init();
        }
    } catch (e) {
        console.error("Failed to load page script module:", e);
    }
}

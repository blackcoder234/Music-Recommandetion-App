import Auth from './auth.js';
import api from './api.js';
import { displayMessage } from './utils.js';
import { PLAYER_HTML, MOBILE_NAV_HTML } from './layout.js';

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
                 window.location.reload();
             }
             displayMessage("Removed from Liked Songs", "success");
        } else {
            // General page: Show feedback
            // Ideally we check response to see if liked or unliked
            // backend 'likeTrack' typically toggles. 
            // Let's assume response.message tells us, or we just say "Success"
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
    // ==========================================
    // GLOBAL UI INJECTION (Player)
    // ==========================================
    if (!document.getElementById('player-bar')) {
        document.body.insertAdjacentHTML('beforeend', PLAYER_HTML);
    }
    
    // Inject Mobile Nav if missing (simple check for nav element)
    if (!document.querySelector('nav.md\\:hidden.fixed.bottom-0')) {
         document.body.insertAdjacentHTML('beforeend', MOBILE_NAV_HTML);
    }

    // ==========================================
    // GLOBAL SEARCH LOGIC
    // ==========================================
    const globalSearchInput = document.querySelector('input[placeholder="Search..."]');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = globalSearchInput.value.trim();
                if (query) {
                    window.location.href = `/discover?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // ==========================================
    // SIDEBAR NAVIGATION LOGIC
    // ==========================================

    /**
     * Mobile Sidebar Elements
     */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
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
     * toggleMobileSidebar
     * Toggles the visibility of the sidebar drawer on mobile devices.
     * Uses CSS transforms to slide in/out.
     */
    function toggleMobileSidebar() {
        // Check if the sidebar has the 'translate-x-0' class (meaning it's open)
        const isOpen = sidebar.classList.contains('-translate-x-0'); // using the opposite logic of default hidden

        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    }

    function openMobileSidebar() {
        // Remove the negative translate to slide it into view
        sidebar.classList.remove('-translate-x-full'); 
        // Show the dark overlay
        sidebarOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    function closeMobileSidebar() {
        // Add the negative translate to slide it out of view
        sidebar.classList.add('-translate-x-full');
        // Hide the overlay
        sidebarOverlay.classList.add('hidden');
        document.body.style.overflow = ''; // Restore background scrolling
    }

    // Event Listeners for Mobile Interactions
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
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
    '/settings',
    '/premium'
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
    } else {
        // Guest State
        loginBtns.forEach(btn => btn.classList.remove('hidden'));
        profileSections.forEach(section => section.classList.add('hidden'));
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
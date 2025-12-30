// Main JavaScript File for Beatify
// Handles frontend interactions: Sidebar (Mobile/Desktop) and general UI toggles.

document.addEventListener('DOMContentLoaded', () => {
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

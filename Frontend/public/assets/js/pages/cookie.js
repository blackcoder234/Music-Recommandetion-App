
/**
 * Cookie Policy Page Specific Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    updateBrowserLinks();
});

function initMobileMenu() {
    const mobileNav = document.getElementById("mobile-nav");
    const openBtn = document.getElementById("mobile-menu-toggle");
    const closeBtn = document.getElementById("close-mobile-nav");

    if (!mobileNav || !openBtn || !closeBtn) return;

    function toggleMenu() {
        const isClosed = mobileNav.classList.contains("translate-x-full");
        if (isClosed) {
            mobileNav.classList.remove("translate-x-full");
            document.body.style.overflow = "hidden"; // Prevent scrolling when menu is open
        } else {
            mobileNav.classList.add("translate-x-full");
            document.body.style.overflow = "";
        }
    }

    openBtn.addEventListener("click", toggleMenu);
    closeBtn.addEventListener("click", toggleMenu);

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        const isClickInsideMenu = mobileNav.contains(e.target);
        const isClickOnToggleBtn = openBtn.contains(e.target);

        // If open and click is outside
        if (!mobileNav.classList.contains("translate-x-full") && !isClickInsideMenu && !isClickOnToggleBtn) {
            mobileNav.classList.add("translate-x-full");
            document.body.style.overflow = "";
        }
    });
}

function updateBrowserLinks() {
    const browserLinks = {
        'Chrome': 'https://support.google.com/chrome/answer/95647',
        'Firefox': 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop',
        'Safari': 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/',
        'Edge': 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09',
        'Opera': 'https://help.opera.com/en/latest/web-preferences/#cookies'
    };

    // Find all links in the grid that contain the browser names
    const links = document.querySelectorAll('main a'); 
    
    links.forEach(link => {
        const text = link.textContent.trim();
        if (browserLinks[text]) {
            link.href = browserLinks[text];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
    });
}

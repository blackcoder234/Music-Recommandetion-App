/**
 * Croponer Cookie Management System
 * A comprehensive cookie management solution for GDPR/CCPA compliance
 */

// Cookie utility functions
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
  
  document.addEventListener("DOMContentLoaded", function() {
    // Create cookie banner if consent not already given
    function createCookieBanner() {
      if (CookieManager.getCookie('cookie-consent')) return;
      
      const consentBanner = document.getElementById("cookie-consent");
      if (consentBanner) {
        consentBanner.style.display = "block";
        setTimeout(() => {
          consentBanner.classList.remove("translate-y-full");
        }, 300);
      } else {
        // If banner doesn't exist in the DOM, create it
        const banner = document.createElement('div');
        banner.id = 'cookie-consent';
        banner.className = 'fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 p-4 transform translate-y-full transition-transform duration-500';
        banner.innerHTML = `
          <div class="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex-1">
              <p class="text-gray-700">
                We use cookies to enhance your experience on our website. By continuing to browse, you agree to our 
                <a href="/cookie-policy.html" class="text-[#000480] underline">Cookie Policy</a>.
              </p>
            </div>
            <div class="flex gap-3 shrink-0">
              <button id="cookie-reject" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors">
                Reject All
              </button>
              <button id="cookie-preferences" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors">
                Preferences
              </button>
              <button id="accept-cookies" class="px-4 py-2 bg-[#000480] hover:bg-[#1f1faa] text-white rounded transition-colors">
                Accept All
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(banner);
        
        // Animate banner in after a short delay
        setTimeout(() => {
          banner.classList.remove('translate-y-full');
        }, 300);
        
        // Create new instance of the banner
        consentBanner = banner;
      }
      
      // Set up event listeners if they don't exist already
      if (!consentBanner.dataset.initialized) {
        // Accept all cookies
        const acceptBtn = document.getElementById('accept-cookies');
        if (acceptBtn) {
          acceptBtn.addEventListener('click', function() {
            acceptAllCookies();
            hideBanner();
          });
        }
        
        // Reject all non-essential cookies
        const rejectBtn = document.getElementById('cookie-reject');
        if (rejectBtn) {
          rejectBtn.addEventListener('click', function() {
            rejectNonEssentialCookies();
            hideBanner();
          });
        }
        
        // Open preferences modal
        const prefBtn = document.getElementById('cookie-preferences');
        if (prefBtn) {
          prefBtn.addEventListener('click', function() {
            openPreferencesModal();
          });
        }
        
        consentBanner.dataset.initialized = "true";
      }
    }
    
    function hideBanner() {
      const banner = document.getElementById('cookie-consent');
      if (banner) {
        banner.classList.add('translate-y-full');
        setTimeout(() => {
          banner.style.display = 'none';
        }, 500);
      }
    }
    
    // Create and manage cookie preferences modal
    function createPreferencesModal() {
      // Get current preferences
      const preferences = JSON.parse(CookieManager.getCookie('cookie-preferences') || '{"essential": true, "analytics": false, "functionality": false, "targeting": false}');
      
      const modal = document.createElement('div');
      modal.id = 'cookie-preferences-modal';
      modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold text-gray-800">Cookie Preferences</h3>
              <button id="close-preferences" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="p-6 space-y-6">
            <div class="space-y-2">
              <div class="flex items-center">
                <input type="checkbox" id="essential-cookies" checked disabled class="h-5 w-5 text-[#000480]">
                <label for="essential-cookies" class="ml-3 font-medium text-gray-800">Essential Cookies</label>
              </div>
              <p class="text-sm text-gray-600 ml-8">These cookies are necessary for the website to function and cannot be disabled.</p>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center">
                <input type="checkbox" id="analytics-cookies" ${preferences.analytics ? 'checked' : ''} class="h-5 w-5 text-[#000480]">
                <label for="analytics-cookies" class="ml-3 font-medium text-gray-800">Analytics Cookies</label>
              </div>
              <p class="text-sm text-gray-600 ml-8">These cookies help us analyze how visitors use our website, helping us improve its performance and usability.</p>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center">
                <input type="checkbox" id="functionality-cookies" ${preferences.functionality ? 'checked' : ''} class="h-5 w-5 text-[#000480]">
                <label for="functionality-cookies" class="ml-3 font-medium text-gray-800">Functionality Cookies</label>
              </div>
              <p class="text-sm text-gray-600 ml-8">These cookies enable enhanced functionality and personalization on our website.</p>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center">
                <input type="checkbox" id="targeting-cookies" ${preferences.targeting ? 'checked' : ''} class="h-5 w-5 text-[#000480]">
                <label for="targeting-cookies" class="ml-3 font-medium text-gray-800">Targeting Cookies</label>
              </div>
              <p class="text-sm text-gray-600 ml-8">These cookies are used to deliver relevant advertisements and track their performance.</p>
            </div>
          </div>
          <div class="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button id="reject-all-cookies" class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors">
              Reject All
            </button>
            <button id="accept-selected-cookies" class="px-4 py-2 bg-[#000480] hover:bg-[#1f1faa] text-white rounded transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Animate modal in
      setTimeout(() => {
        modal.classList.remove('opacity-0');
      }, 10);
      
      // Set up event listeners
      document.getElementById('close-preferences').addEventListener('click', closePreferencesModal);
      
      document.getElementById('reject-all-cookies').addEventListener('click', function() {
        rejectNonEssentialCookies();
        closePreferencesModal();
        hideBanner();
      });
      
      document.getElementById('accept-selected-cookies').addEventListener('click', function() {
        savePreferences();
        closePreferencesModal();
        hideBanner();
      });
      
      // Close if clicking outside modal content
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closePreferencesModal();
        }
      });
    }
    
    function openPreferencesModal() {
      const existingModal = document.getElementById('cookie-preferences-modal');
      if (!existingModal) {
        createPreferencesModal();
      } else {
        existingModal.classList.remove('opacity-0');
        existingModal.style.display = 'flex';
      }
    }
    
    function closePreferencesModal() {
      const modal = document.getElementById('cookie-preferences-modal');
      if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
          modal.style.display = 'none';
        }, 300);
      }
    }
    
    // Cookie consent actions
    function acceptAllCookies() {
      const preferences = {
        essential: true,
        analytics: true,
        functionality: true,
        targeting: true
      };
      
      CookieManager.setCookie('cookie-consent', 'accepted', 365);
      CookieManager.setCookie('cookie-preferences', JSON.stringify(preferences), 365);
      
      // Here you would activate your analytics and other cookie-dependent scripts
      activateCookieDependentServices(preferences);
    }
    
    function rejectNonEssentialCookies() {
      const preferences = {
        essential: true,
        analytics: false,
        functionality: false,
        targeting: false
      };
      
      CookieManager.setCookie('cookie-consent', 'rejected', 365);
      CookieManager.setCookie('cookie-preferences', JSON.stringify(preferences), 365);
      
      // Disable any non-essential cookies that might be set
      deactivateNonEssentialServices();
    }
    
    function savePreferences() {
      const preferences = {
        essential: true, // Always required
        analytics: document.getElementById('analytics-cookies').checked,
        functionality: document.getElementById('functionality-cookies').checked,
        targeting: document.getElementById('targeting-cookies').checked
      };
      
      CookieManager.setCookie('cookie-consent', 'custom', 365);
      CookieManager.setCookie('cookie-preferences', JSON.stringify(preferences), 365);
      
      // Activate or deactivate services based on preferences
      activateCookieDependentServices(preferences);
    }
    
    // Functions to handle activation/deactivation of services based on preferences
    function activateCookieDependentServices(preferences) {
      if (preferences.analytics) {
        // Initialize analytics (example)
        console.log('Analytics activated');
        // initializeAnalytics();
        
        // Google Analytics (example)
        // if (typeof ga === 'function') {
        //   ga('consent', 'update', {
        //     'analytics_storage': 'granted'
        //   });
        // }
      }
      
      if (preferences.functionality) {
        // Initialize functionality cookies
        console.log('Functionality cookies activated');
        // initializeFunctionalityCookies();
      }
      
      if (preferences.targeting) {
        // Initialize targeting/advertising cookies
        console.log('Targeting cookies activated');
        // initializeTargetingCookies();
        
        // Facebook Pixel (example)
        // if (typeof fbq === 'function') {
        //   fbq('consent', 'grant');
        // }
      }
    }
    
    function deactivateNonEssentialServices() {
      // Code to disable analytics, targeting scripts, etc.
      console.log('Non-essential services deactivated');
      
      // Example for common analytics cookies
      CookieManager.eraseCookie('_ga');
      CookieManager.eraseCookie('_gid');
      CookieManager.eraseCookie('_gat');
      
      // Google Analytics (example)
      // if (typeof ga === 'function') {
      //   ga('consent', 'update', {
      //     'analytics_storage': 'denied'
      //   });
      // }
      
      // Facebook Pixel (example)
      // if (typeof fbq === 'function') {
      //   fbq('consent', 'revoke');
      // }
    }
    
    // Update browser help links on cookie policy page
    function updateBrowserLinks() {
      const browserLinks = {
        'Chrome': 'https://support.google.com/chrome/answer/95647',
        'Firefox': 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop',
        'Safari': 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/',
        'Edge': 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09',
        'Opera': 'https://help.opera.com/en/latest/web-preferences/#cookies'
      };
      
      const links = document.querySelectorAll('a[href="#"].text-\\[\\#000480\\].hover\\:underline');
      links.forEach(link => {
        const browser = link.textContent.trim();
        if (browserLinks[browser]) {
          link.href = browserLinks[browser];
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
    
    // Initialize settings button on cookie policy page
    function initCookiePolicyPage() {
      const preferencesBtn = document.getElementById('open-cookie-settings');
      if (preferencesBtn) {
        preferencesBtn.addEventListener('click', openPreferencesModal);
      }
    }
    
    // Initialize everything
    function init() {
      // Show cookie banner if needed
      createCookieBanner();
      
      // Update browser help links on cookie policy page
      updateBrowserLinks();
      
      // Initialize cookie policy page settings button
      initCookiePolicyPage();
      
      // Apply existing preferences if any
      const preferences = JSON.parse(CookieManager.getCookie('cookie-preferences') || '{"essential": true}');
      if (Object.keys(preferences).length > 1) {
        activateCookieDependentServices(preferences);
      }
    }
    
    // Run the initialization
    init();
  });
  
  // Make CookieManager available globally (useful for debugging and custom implementations)
  window.CookieManager = CookieManager;
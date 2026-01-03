/**
 * Google Identity Services helper (custom button)
 *
 * Loads Google GIS script on demand and fetches GOOGLE_CLIENT_ID
 * from the backend public config endpoint (/api/v1/config/public).
 */

let googleInitialized = false;
let loadScriptPromise = null;
let loadClientIdPromise = null;

const loadGoogleIdentityScript = () => {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (loadScriptPromise) return loadScriptPromise;

    loadScriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
            // If it exists but hasn't initialized yet, wait a tick.
            const check = () => {
                if (window.google?.accounts?.id) resolve();
                else setTimeout(check, 50);
            };
            check();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.head.appendChild(script);
    });

    return loadScriptPromise;
};

const readClientIdFromPublicConfig = async () => {
    // Same-origin request when frontend is served by backend
    const res = await fetch('/api/v1/config/public', { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to fetch public config');
    }
    // Supports both { googleClientId } and ApiResponse { data: { googleClientId } }
    return json?.googleClientId || json?.data?.googleClientId || '';
};

const getGoogleClientId = async () => {
    if (window.GOOGLE_CLIENT_ID) return window.GOOGLE_CLIENT_ID;
    if (loadClientIdPromise) return loadClientIdPromise;

    loadClientIdPromise = (async () => {
        const clientId = await readClientIdFromPublicConfig();
        if (clientId) {
            window.GOOGLE_CLIENT_ID = clientId;
        }
        return clientId;
    })();

    return loadClientIdPromise;
};

const ensureGoogleInitialized = async (onCredential, onError) => {
    if (googleInitialized) return true;

    try {
        await loadGoogleIdentityScript();
    } catch (e) {
        onError?.(e?.message || 'Google Sign-In script not loaded yet. Please try again.');
        return false;
    }

    let clientId = '';
    try {
        clientId = await getGoogleClientId();
    } catch (e) {
        onError?.(e?.message || 'Google Client ID is missing');
        return false;
    }

    if (!clientId) {
        onError?.('Google Client ID is missing. Please set it on the server.');
        return false;
    }

    if (!window.google?.accounts?.id) {
        onError?.('Google Sign-In script not loaded yet. Please try again.');
        return false;
    }

    window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        // Disable FedCM on localhost/HTTP to avoid NetworkError
        // In production (HTTPS), this should be true, but the current error is blocking.
        use_fedcm_for_prompt: false, 
        cancel_on_tap_outside: false
    });

    googleInitialized = true;
    return true;
};

/**
 * Attach Google auth to an existing button.
 * Note: GIS One Tap (prompt) is not designed for custom buttons (it's a floating widget).
 * For a proper custom button, we should use the Authorization Code flow or renderButton.
 * However, to keep current contract, we trigger prompt() but handle 'skipped' state.
 */
export function attachGoogleAuth({
    buttonEl,
    endpoint = '/api/v1/users/google',
    onStart,
    onFinish,
    onSuccess,
    onError,
} = {}) {
    if (!buttonEl) return;

    const reportError = (message, error) => {
        if (typeof onError === 'function') {
            onError(message, error);
        }
    };

    const handleGoogleCredential = async (response) => {
        const idToken = response?.credential;
        if (!idToken) {
            reportError('Google authentication failed. No token received.');
            return;
        }

        try {
            onStart?.();

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Google sign-in failed');
            }

            const user = data?.data?.user || null;
            onSuccess?.(user, data);
        } catch (error) {
            reportError(error.message || 'Google sign-in failed', error);
        } finally {
            onFinish?.();
        }
    };

    buttonEl.addEventListener('click', async (e) => {
        e.preventDefault();

        const ok = await ensureGoogleInitialized(handleGoogleCredential, (msg) => reportError(msg));
        if (!ok) return;

        // Reset the cool-down so prompt always shows on click
        // (This is a hack: prompt() has a cooldown if closed by user)
        document.cookie = `g_state=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT`;

        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
                console.warn('Google Prompt not displayed:', notification.getNotDisplayedReason());
                
                // If the user closed it recently, it won't show ('opt_out_or_sliding_cool_down').
                // We notify the user.
                const reason = notification.getNotDisplayedReason();
                if (reason === 'opt_out_or_sliding_cool_down') {
                    // We actually tried to clear it above, but if it persists:
                    reportError('Google Sign-In is temporarily on cooldown. Please wait or clear cookies.');
                } else if (reason === 'suppressed_by_user') {
                     reportError('Google Sign-In was suppressed. Please try again.');
                } else if (reason === 'unregistered_origin') {
                     reportError('Current domain (localhost/ip) is not allowed in Google Cloud Console.');
                } else {
                     reportError('Google Sign-In could not be displayed (' + reason + ').');
                }
            } else if (notification.isSkippedMoment()) {
                console.warn('Google Prompt skipped:', notification.getSkippedReason());
            }
        });
    });
}

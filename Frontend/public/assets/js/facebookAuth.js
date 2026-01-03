/**
 * Facebook Login helper (custom button)
 *
 * Loads Facebook SDK on demand and exchanges the access token with
 * the backend endpoint (default: /api/v1/users/facebook).
 */

let facebookInitialized = false;
let loadSdkPromise = null;
let loadAppIdPromise = null;

const loadFacebookSdkScript = () => {
    if (window.FB) return Promise.resolve();
    if (loadSdkPromise) return loadSdkPromise;

    loadSdkPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="https://connect.facebook.net/en_US/sdk.js"]');
        if (existing) {
            const check = () => {
                if (window.FB) resolve();
                else setTimeout(check, 50);
            };
            check();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
        document.head.appendChild(script);
    });

    return loadSdkPromise;
};

const readAppIdFromPublicConfig = async () => {
    const res = await fetch('/api/v1/config/public', { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Failed to fetch public config');
    }
    return json?.facebookAppId || json?.data?.facebookAppId || '';
};

const getFacebookAppId = async () => {
    if (window.FACEBOOK_APP_ID) return window.FACEBOOK_APP_ID;
    if (loadAppIdPromise) return loadAppIdPromise;

    loadAppIdPromise = (async () => {
        const appId = await readAppIdFromPublicConfig();
        if (appId) window.FACEBOOK_APP_ID = appId;
        return appId;
    })();

    return loadAppIdPromise;
};

const ensureFacebookInitialized = async (onError) => {
    if (facebookInitialized) return true;

    let appId = '';
    try {
        appId = await getFacebookAppId();
    } catch (e) {
        onError?.(e?.message || 'Facebook App ID is missing');
        return false;
    }

    if (!appId) {
        onError?.('Facebook App ID is missing. Please set it on the server.');
        return false;
    }

    try {
        await loadFacebookSdkScript();
    } catch (e) {
        onError?.(e?.message || 'Facebook SDK not loaded yet. Please try again.');
        return false;
    }

    if (!window.FB) {
        onError?.('Facebook SDK not loaded yet. Please try again.');
        return false;
    }

    // Init once
    window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
    });

    facebookInitialized = true;
    return true;
};

/**
 * Attach Facebook auth to an existing button.
 *
 * @param {object} params
 * @param {HTMLElement} params.buttonEl
 * @param {string} [params.endpoint='/api/v1/users/facebook']
 * @param {Function} [params.onStart]
 * @param {Function} [params.onFinish]
 * @param {Function} [params.onSuccess] - called with (user, rawResponse)
 * @param {Function} [params.onError] - called with (message, error)
 */
export function attachFacebookAuth({
    buttonEl,
    endpoint = '/api/v1/users/facebook',
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

    buttonEl.addEventListener('click', async (e) => {
        e.preventDefault();

        const ok = await ensureFacebookInitialized((msg) => reportError(msg));
        if (!ok) return;

        try {
            onStart?.();

            window.FB.login(async (fbResponse) => {
                try {
                    const authResponse = fbResponse?.authResponse;
                    const accessToken = authResponse?.accessToken;

                    if (!accessToken) {
                        reportError('Facebook login was cancelled or failed.');
                        return;
                    }

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ accessToken }),
                    });

                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(data.message || 'Facebook sign-in failed');
                    }

                    const user = data?.data?.user || null;
                    onSuccess?.(user, data);
                } catch (err) {
                    reportError(err?.message || 'Facebook sign-in failed', err);
                } finally {
                    onFinish?.();
                }
            }, { scope: 'email,public_profile' });
        } catch (error) {
            onFinish?.();
            reportError(error?.message || 'Facebook sign-in failed', error);
        }
    });
}

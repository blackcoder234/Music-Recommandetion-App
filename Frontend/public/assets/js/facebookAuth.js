/**
 * Simple Facebook Login helper
 */

// Helper to wait for global FB object
const waitForFB = () => {
    return new Promise((resolve, reject) => {
        if (window.FB) return resolve();
        let retries = 0;
        const interval = setInterval(() => {
            if (window.FB) {
                clearInterval(interval);
                resolve();
            }
            retries++;
            if (retries > 60) { // 3 seconds timeout
                clearInterval(interval);
                reject(new Error('Facebook SDK failed to load. Please check your internet connection or ad-blocker.'));
            }
        }, 50);
    });
};

export async function initFacebookAuth({
    buttonId = 'facebookLoginBtn',
    endpoint = '/api/v1/users/facebook',
    onStart,
    onFinish,
    onSuccess,
    onError,
} = {}) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            // 1. Wait for SDK
            await waitForFB();

            // 2. Fetch App ID from public config
            const configRes = await fetch('/api/v1/config/public');
            const config = await configRes.json();
            const appId = config?.data?.facebookAppId || config?.facebookAppId;

            if (!appId) throw new Error('Facebook App ID missing from server config');

            // 3. Init FB SDK
            // Note: FB.init checks if it's already initialized internally, so it's safe to call again.
            window.FB.init({
                appId,
                cookie: true,
                xfbml: false,
                version: 'v19.0',
            });

            // 4. Trigger Login
            onStart?.();
            window.FB.login(async (fbRes) => {
                try {
                    const token = fbRes.authResponse?.accessToken;
                    if (!token) {
                        onFinish?.();
                        return; // User cancelled
                    }

                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ accessToken: token }),
                    });

                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message || 'Facebook login failed');

                    onSuccess?.(result.data?.user, result);
                } catch (err) {
                    onError?.(err.message, err);
                } finally {
                    onFinish?.();
                }
            }, { scope: 'email,public_profile' });

        } catch (error) {
            console.error('Facebook Auth Error:', error);
            onError?.(error.message);
        }
    });
}

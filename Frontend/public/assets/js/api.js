import CONFIG from './config.js';
// import { displayMessage } from './utils.js';

class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.isRefreshing = false;
        this.failedRequestsQueue = [];
    }

    /**
     * Standard fetch wrapper
     * @param {string} endpoint - e.g., '/users/login'
     * @param {object} options - Fetch options 
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: 'include', // CRITICAL: Sends HttpOnly cookies
        };
        
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            let response = await fetch(url, config);

            // Handle 401 Unauthorized (Token Expiry)
            if (response.status === 401 && !endpoint.includes('login')) {
                // If it's already a refresh request that failed, give up
                if (endpoint.includes('refresh-token')) {
                    throw new Error('Session expired');
                }

                console.warn('Access token expired. Attempting refresh...');
                return this.handleTokenRefresh(url, config);
            }

            // For other non-OK statuses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
                
                // Optional: Don't throw for 404 if the caller wants to handle it, 
                // but usually we want to standardize error format.
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            // Success: Return parsed JSON
            return await response.json();

        } catch (error) {
           throw error;
        }
    }

    /**
     * Handles the refresh token logic
     */
    async handleTokenRefresh(originalUrl, originalConfig) {
        if (this.isRefreshing) {
            // Queue this request to retry after refresh completes
            return new Promise((resolve, reject) => {
                this.failedRequestsQueue.push({ resolve, reject, originalUrl, originalConfig });
            });
        }

        this.isRefreshing = true;

        try {
            // Call refresh endpoint
            const refreshResponse = await fetch(`${this.baseURL}/users/refresh-token`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!refreshResponse.ok) {
                throw new Error('Refresh failed');
            }

            // If successful, retry all queued requests
            const retryPromises = this.failedRequestsQueue.map(({ resolve, reject, originalUrl, originalConfig }) => {
                return fetch(originalUrl, originalConfig)
                    .then(res => res.json())
                    .then(resolve)
                    .catch(reject);
            });

            this.failedRequestsQueue = [];
            
            // Retry the original request that triggered this
            const retriedResponse = await fetch(originalUrl, originalConfig);
            return await retriedResponse.json();

        } catch (error) {
            // Refresh failed = User session is dead
            // Check if we should suppress the redirect (e.g. for app init checks)
            if (!originalConfig.suppressAuthRedirect) {
                 this.handleSessionExpired();
            }
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    handleSessionExpired() {
        console.error('Session expired. Logging out...');
        // displayMessage('Session expired. Please login again.', 'error'); // Can cause loop if not careful
        
        // Notify other tabs
        const authChannel = new BroadcastChannel('auth_channel');
        authChannel.postMessage({ type: 'LOGOUT' });
        
        // Redirect to login
        // prevent restart loop if already on login page
        if (!window.location.pathname.includes('/login')) {
             window.location.href = '/login';
        }
    }
}

const api = new ApiClient();
export default api;

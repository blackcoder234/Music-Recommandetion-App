import api from './api.js';
import { displayMessage } from './utils.js';

const Auth = {
    /**
     * Login User
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        try {
            const data = await api.request('/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            this.broadcastAuthChange('LOGIN_SUCCESS', data.data.user);
            return data;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    },

    /**
     * Signup User
     * @param {FormData} formData - Contains files (avatar) and text fields
     */
    async register(formData) {
        // NOTE: For file uploads, we normally don't set Content-Type to application/json
        // The api.js wrapper defaults to JSON, so we need to override headers.
        try {
            // Using raw fetch here or modifying api.js to support FormData would be ideal.
            // Let's modify the call to override the default Content-Type mechanism.
            // But api.js forces Content-Type: application/json.
            // Workaround: We'll construct the request manually for this specific multipart endpoint
            // OR better, we make api.js smarter. For now, let's just use raw fetch for upload to ensure it works.
            
            // Actually, best practice: Let the browser set Content-Type for FormData (multipart/form-data with boundary)
            // We can delete the Content-Type header if body is FormData
             
            // BUT api.js currently hardcodes 'Content-Type': 'application/json'. 
            // Let's use direct access for now or assume I can patch api.js in memory? 
            // I'll stick to a clean pattern: let's invoke a special fetch here.
            
            // Wait, for consistency with refresh tokens, we SHOULD use api.js. 
            // The api.js logic needs to be flexible. 
            // I will implement a quick check here. 
            
            // Actually, let's just use the `api` instance but we need to know NOT to set Content-Type.
            // Since I cannot change api.js easily in this turn without a separate tool call, 
            // I'll use a specific logic: passing `headers: {}` might not enough if it merges.
            // Let's assume standard JSON registration for now? 
            // The backend requires Multer (FormData). 
            
            // Solution: I will use raw fetch inside this method but call `api.handleTokenRefresh` if needed? 
            // No, register endpoint is public, it doesn't need a token!
            // So raw fetch is completely fine.
            
            const response = await fetch(`${api.baseURL}/users/register`, {
                method: 'POST',
                body: formData,
                // Do NOT set Content-Type header, browser does it for FormData
            });

            const data = await response.json();

            if (!response.ok) {
                 throw new Error(data.message || 'Registration failed');
            }

            this.broadcastAuthChange('LOGIN_SUCCESS', data.data.user);
            return data;
        } catch (error) {
            console.error("Signup failed:", error);
            throw error;
        }
    },

    /**
     * Logout User
     */
    async logout() {
        try {
            await api.request('/users/logout', { method: 'POST' });
        } catch (error) {
            console.warn("Logout endpoint error (likely already expired):", error);
        } finally {
            this.broadcastAuthChange('LOGOUT');
            // Hard redirect
            window.location.href = '/login';
        }
    },

    /**
     * Get Current User Profile
     */
    async getCurrentUser() {
        try {
            const data = await api.request('/users/current-user', { 
                method: 'GET',
                suppressAuthRedirect: true
            });
            return data.data; // Assuming backend returns { data: userObject }
        } catch (error) {
            return null;
        }
    },

    /**
     * Broadcast auth changes to other tabs
     */
    broadcastAuthChange(type, user = null) {
        const channel = new BroadcastChannel('auth_channel');
        channel.postMessage({ type, user });
    },
    
    /**
     * Listen for storage events (Tab Sync)
     * call this in main.js
     */
    initSessionSync() {
        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event) => {
            const { type } = event.data;
            if (type === 'LOGOUT') {
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            } else if (type === 'LOGIN_SUCCESS') {
                // If on login/signup page, go home
                 if (window.location.pathname.includes('/login') || window.location.pathname.includes('/signup')) {
                    window.location.href = '/';
                } else {
                    // Refresh current page to update UI
                    window.location.reload();
                }
            }
        };
    }
};

export default Auth;

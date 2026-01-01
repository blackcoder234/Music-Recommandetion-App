import Auth from '../auth.js';
import { signupValidateInput, toggleLoader, displayMessage, showPassword } from '../utils.js';

const form = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showPasswordBtn = document.getElementById('showPassword');

// Init Show Password
if (showPasswordBtn && passwordInput) {
    showPassword(showPasswordBtn, passwordInput);
}

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Client-side Validation (updates UI validation messages)
        const isValid = signupValidateInput(nameInput, emailInput, passwordInput);
        if (!isValid) return;

        // 2. Prepare Data
        // Backend expects FormData because of Multer
        const formData = new FormData();
        formData.append('fullName', nameInput.value.trim());
        formData.append('email', emailInput.value.trim());
        formData.append('username', nameInput.value.trim().split(' ')[0]); // Simple username generation
        formData.append('password', passwordInput.value.trim());
        
        // Note: Avatar is optional and not present in this form design yet.
        
        toggleLoader(true);

        try {
            // 3. API Call
            await Auth.register(formData);

            // 4. Success- Login matches automatically usually, or we redirect to login?
            // Auth.register broadcasts LOGIN_SUCCESS in my Auth.js implementation (checks response).
            // Usually registration auto-logs in (returning tokens). 
            // My backend user.controller.js registerUser returns cookies! (Step 19, Line 111).
            // So we are logged in.
            
            displayMessage('Account created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);

        } catch (error) {
            const msg = error.message || 'Registration failed';
            displayMessage(msg, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

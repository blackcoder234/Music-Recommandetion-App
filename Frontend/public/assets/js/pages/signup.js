import Auth from '../auth.js';
import { signupValidateInput, toggleLoader, displayMessage, showPassword } from '../utils.js';
import { attachGoogleAuth } from '../googleAuth.js';
import { attachFacebookAuth } from '../facebookAuth.js';

const form = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showPasswordBtn = document.getElementById('showPassword');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const facebookSignupBtn = document.getElementById('facebookSignupBtn');

// Init Show Password
if (showPasswordBtn && passwordInput) {
    showPassword(showPasswordBtn, passwordInput);
}

// Google Sign Up
attachGoogleAuth({
    buttonEl: googleSignupBtn,
    onStart: () => toggleLoader(true),
    onFinish: () => toggleLoader(false),
    onSuccess: (user) => {
        Auth.broadcastAuthChange('LOGIN_SUCCESS', user);
        displayMessage('Signed in with Google successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 800);
    },
    onError: (message) => {
        displayMessage(message || 'Google sign-in failed', 'error');
    },
});

// Facebook Sign Up
attachFacebookAuth({
    buttonEl: facebookSignupBtn,
    onStart: () => toggleLoader(true),
    onFinish: () => toggleLoader(false),
    onSuccess: (user) => {
        Auth.broadcastAuthChange('LOGIN_SUCCESS', user);
        displayMessage('Signed in with Facebook successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 800);
    },
    onError: (message) => {
        displayMessage(message || 'Facebook sign-in failed', 'error');
    },
});

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

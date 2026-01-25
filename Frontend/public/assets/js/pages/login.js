import Auth from '../auth.js';
import { loginValidateInput, toggleLoader, displayMessage, showPassword } from '../utils.js';
import { initGoogleAuth } from '../googleAuth.js';
import { initFacebookAuth } from '../facebookAuth.js';

// Elements
const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Init Show Password Logic
const togglePassBtn = passwordInput?.nextElementSibling;
if(togglePassBtn && togglePassBtn.tagName === 'BUTTON') {
   showPassword(togglePassBtn, passwordInput);
}

// 1. Initialize Google Auth
initGoogleAuth({
    containerId: 'googleBtnContainer',
    onStart: () => toggleLoader(true),
    onFinish: () => toggleLoader(false),
    onSuccess: (user) => {
        Auth.broadcastAuthChange('LOGIN_SUCCESS', user);
        displayMessage('Signed in with Google successfully!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 800);
    },
    onError: (message) => {
        displayMessage(message || 'Google sign-in failed', 'error');
    },
});

// 2. Initialize Facebook Auth
/*
initFacebookAuth({
    buttonId: 'facebookLoginBtn',
    onStart: () => toggleLoader(true),
    onFinish: () => toggleLoader(false),
    onSuccess: (user) => {
        Auth.broadcastAuthChange('LOGIN_SUCCESS', user);
        displayMessage('Signed in with Facebook successfully!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 800);
    },
    onError: (message) => {
        displayMessage(message || 'Facebook sign-in failed', 'error');
    },
});
*/

// 3. Form Submission (Email/Password)
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!loginValidateInput(emailInput, passwordInput)) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        toggleLoader(true);
        try {
            await Auth.login(email, password);
            displayMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => { window.location.href = '/'; }, 1000);
        } catch (error) {
            const msg = error.data?.message || error.message || 'Invalid email or password';
            displayMessage(msg, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

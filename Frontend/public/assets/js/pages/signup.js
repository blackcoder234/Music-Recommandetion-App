import Auth from '../auth.js';
import { signupValidateInput, toggleLoader, displayMessage, showPassword } from '../utils.js';
import { initGoogleAuth } from '../googleAuth.js';
import { initFacebookAuth } from '../facebookAuth.js';

const form = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showPasswordBtn = document.getElementById('showPassword');

// 1. Init Show Password
if (showPasswordBtn && passwordInput) {
    showPassword(showPasswordBtn, passwordInput);
}

// 2. Initialize Google Auth (Join)
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
        displayMessage(message || 'Google signup failed', 'error');
    },
});

// 3. Initialize Facebook Auth (Join)
initFacebookAuth({
    buttonId: 'facebookSignupBtn',
    onStart: () => toggleLoader(true),
    onFinish: () => toggleLoader(false),
    onSuccess: (user) => {
        Auth.broadcastAuthChange('LOGIN_SUCCESS', user);
        displayMessage('Signed in with Facebook successfully!', 'success');
        setTimeout(() => { window.location.href = '/'; }, 800);
    },
    onError: (message) => {
        displayMessage(message || 'Facebook signup failed', 'error');
    },
});

// 4. Form Submission (Email/Password)
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!signupValidateInput(nameInput, emailInput, passwordInput)) return;

        const formData = new FormData();
        formData.append('fullName', nameInput.value.trim());
        formData.append('email', emailInput.value.trim());
        formData.append('username', nameInput.value.trim().split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000));
        formData.append('password', passwordInput.value.trim());
        
        toggleLoader(true);
        try {
            await Auth.register(formData);
            displayMessage('Account created successfully!', 'success');
            setTimeout(() => { window.location.href = '/'; }, 1500);
        } catch (error) {
            const msg = error.message || 'Registration failed';
            displayMessage(msg, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

import Auth from '../auth.js';
import { loginValidateInput, toggleLoader, displayMessage, showPassword } from '../utils.js';
import { attachGoogleAuth } from '../googleAuth.js';
import { attachFacebookAuth } from '../facebookAuth.js';

// Elements
const form = document.querySelector('form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const showPasswordBtn = document.querySelector('button[type="button"]'); // Need ID in HTML technically, but button inside relative works?
const googleLoginBtn = document.getElementById('googleLoginBtn');
const facebookLoginBtn = document.getElementById('facebookLoginBtn');

// Init Show Password Logic
// We need to pass the button and input to utils function.
// Checking HTML... The button has svg inside.
// Ideally usage: showPassword(btn, input)
// Let's ensure the selector is correct. In login.html, the button is after input.
const togglePassBtn = passwordInput.nextElementSibling;
if(togglePassBtn && togglePassBtn.tagName === 'BUTTON') {
   // Wait utils.js expects an event listener attachment.
   showPassword(togglePassBtn, passwordInput);
}

// Google Login
attachGoogleAuth({
    buttonEl: googleLoginBtn,
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

// Facebook Login
attachFacebookAuth({
    buttonEl: facebookLoginBtn,
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

// Form Submission
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validate
        if (!loginValidateInput(emailInput, passwordInput)) {
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // 2. Loading State
        toggleLoader(true);

        try {
            // 3. API Call
            await Auth.login(email, password);
            
            // 4. Success handling
            displayMessage('Login successful! Redirecting...', 'success');
            
            // Redirect is handled by Auth.broadcastAuthChange listeners or manual
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            // 5. Error handling
            // error.data might contain specific backend message
            const msg = error.data?.message || error.message || 'Invalid email or password';
            displayMessage(msg, 'error');
        } finally {
            toggleLoader(false);
        }
    });
}

import { signupValidateInput, showPassword, displayMessage, toggleLoader } from './utils.js'

const userRegister = document.querySelector("#signupForm")


if (userRegister) {
    userRegister.addEventListener("submit", async (evt) => {
        evt.preventDefault()
        toggleLoader(true)

        const fullName = document.querySelector("#name")
        const email = document.querySelector("#email")
        const password = document.querySelector("#password")

        if (signupValidateInput(fullName, email, password)) {
            const data = {
                fullName: fullName.value.trim(),
                email: email.value.trim(),
                password: password.value.trim(),
            }

            try {
                const response = await fetch("/api/v1/users/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(data),
                })

                const result = await response.json()

                if (result.statuscode === 201) {
                    displayMessage("Account created successfully!", "success")
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 3000)
                } else {
                    displayMessage(result.message || "Registration failed", "error")
                }
            } catch (error) {
                displayMessage(
                    "An unexpected error occurred! Please try again.",
                    "error",
                )
                console.error("Fetch error:", error)
            } finally {
                toggleLoader(false)
            }
        } else {
            toggleLoader(false)
        }
    })
}

// Password show/hide
const showPassWordBtn = document.querySelector("#showPassword")
const passwordInput = document.querySelector("#password")
showPassword(showPassWordBtn, passwordInput)

// -------- Google Sign-In (front-end) ----------
// NOTE: Set window.GOOGLE_CLIENT_ID in a script tag, or replace the fallback string below.
const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE'

const googleSignupBtn = document.querySelector('#googleSignupBtn')

if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', async (evt) => {
        evt.preventDefault()

        if (!window.google || !google.accounts || !google.accounts.id) {
            displayMessage('Google Sign-In SDK not loaded. Please try again later.', 'error')
            return
        }

        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
            displayMessage('Google Client ID is not configured on the frontend.', 'error')
            return
        }

        toggleLoader(true)

        try {
            // Initialize Google Identity Services
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    const idToken = response.credential
                    if (!idToken) {
                        displayMessage('Google sign-in failed. Please try again.', 'error')
                        toggleLoader(false)
                        return
                    }

                    try {
                        const res = await fetch('/api/v1/users/google', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ idToken }),
                        })

                        const result = await res.json()

                        if (res.ok) {
                            displayMessage(result.message || 'Signed in with Google successfully!', 'success')
                            setTimeout(() => {
                                window.location.href = '/'
                            }, 2000)
                        } else {
                            displayMessage(result.message || 'Google sign-in failed.', 'error')
                        }
                    } catch (error) {
                        console.error('Google auth fetch error:', error)
                        displayMessage('Google sign-in failed. Please try again.', 'error')
                    } finally {
                        toggleLoader(false)
                    }
                },
            })

            // Show the Google One Tap or popup prompt
            google.accounts.id.prompt()
        } catch (error) {
            console.error('Google Sign-In error:', error)
            displayMessage('Unable to start Google sign-in.', 'error')
            toggleLoader(false)
        }
    })
}

// -------- Facebook Sign-In (frontend redirect only) ----------
const facebookSignupBtn = document.querySelector('#facebookSignupBtn')

if (facebookSignupBtn) {
    facebookSignupBtn.addEventListener('click', (evt) => {
        // Let the default href work as a fallback redirect
        // If you later add a backend /facebook route, update this logic accordingly.
    })
}
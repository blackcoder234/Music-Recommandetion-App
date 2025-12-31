import { loginValidateInput, showPassword, displayMessage, showLoader, hideLoader } from './utils.js'

const userLogin = document.querySelector("#loginForm")
const username = document.querySelector("#username")
const password = document.querySelector("#password")

if (userLogin) {
    userLogin.addEventListener("submit", async (evt) => {
        evt.preventDefault()
        
        if (loginValidateInput(username, password)) {
            const formdata = new FormData(evt.target)
            const data = {
                username: formdata.get("username").trim(),
                password: formdata.get("password").trim()
            }
            // console.log(data)
            
            showLoader()
            try {
                const response = await fetch("/api/v1/users/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify(data)
                })
                const result = await response.json()

                // console.log("Login Data frontend:", result)

                if (result.statuscode === 200) {
                    displayMessage(result.message, "success")
                    localStorage.setItem("isLoggedIn", true);
                    localStorage.setItem("userID", result.data.user._id);
                    localStorage.setItem("userName", result.data.user.username);
                    localStorage.setItem("expiresAt", result.data.expiresAt); 
                    localStorage.setItem("email", result.data.user.email);
                    localStorage.setItem("avatar", result.data.user.avatar);
                    localStorage.setItem("userFullname", result.data.user.fullName);
                    
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 3000)
                }
                else {
                    displayMessage( result.message, "error")
                }
            } catch (error) {
                displayMessage( "An unexpected error occurred! Please try again.", "error")
                console.error("Fetch error:", error)
            } finally {
                hideLoader()
            }

        }
    })
}

// Show password function
const showPassWordBtn = document.querySelector("#showPassword")
showPassword(showPassWordBtn, password)

// logout function
const logoutChannel = new BroadcastChannel("logout_channel");
async function UserLogout() {
    showLoader() 
    try {
        const response = await fetch("/api/v1/users/logout", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (response.ok) {
            displayMessage( data.message, "success");
            sessionStorage.clear();
            localStorage.clear();
            logoutChannel.postMessage("logout");
            setTimeout(() => {
                window.location.href = "/";
            }, 3000)

        } else {
            displayMessage( data.message, "error");
        }
    } catch (error) {
        console.error("Logout error:", error);
        displayMessage( "An error occurred. Please check your connection.", "error");
    } finally {
        hideLoader()
    }
}

export { UserLogout }

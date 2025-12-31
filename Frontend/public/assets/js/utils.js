//--------------------- Toggle Eye Button-----------------
function showPassword(showPassWordBtn, password) {
    if (showPassWordBtn && password) {
        showPassWordBtn.addEventListener("click", (evt) => {
            evt.preventDefault();
            const type = password.getAttribute("type") === "password" ? "text" : "password";
            password.setAttribute("type", type);
            const icon = showPassWordBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        })
    }
}

// ---------- error and success messages for validation check
const setError = (element, message) => {
    const errorContainer = document.getElementById(`${element.id}Error`);
    if (!errorContainer) return;
    const errorText = errorContainer.querySelector('.error-text') || errorContainer;
    errorText.textContent = message;
    errorContainer.classList.remove('hidden');
    element.classList.remove('border-white/10');
    element.classList.add('border-red-700');
}

const setSuccess = (element) => {
    const errorContainer = document.getElementById(`${element.id}Error`);
    if (!errorContainer) return;
    const errorText = errorContainer.querySelector('.error-text') || errorContainer;
    errorText.textContent = "";
    errorContainer.classList.add('hidden');
    element.classList.remove('border-red-700');
}

// --------- checking user registration form  ------------------
const signupValidateInput = (fullName, email, password) => {
    let isValid = true;
    const fullNameValue = fullName.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    //----------for full name--------------
    if (fullNameValue === "") {
        setError(fullName, "* Full name cannot be blank");
        isValid = false;
    } else {
        setSuccess(fullName);
    }

    //----------for email--------------
    if (emailValue === "") {
        setError(email, "* Email cannot be blank");
        isValid = false;
    }
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailValue)) {
        setError(email, "* Email is invalid");
        isValid = false;
    }
    else {
        setSuccess(email);
    }

    //------------for password--------------
    if (passwordValue === "") {
        setError(password, "* Password cannot be blank");
        isValid = false;
    }
    else if (passwordValue.length < 8) {
        setError(password, "* Password must be at least 8 characters");
        isValid = false;
    }
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^]).{8,}$/.test(passwordValue)) {
        setError(password, "* Password must contain at least one uppercase, one lowercase, one number and one special character");
        isValid = false;
    }
    else {
        setSuccess(password);
    }

    return isValid;
}
// ----------------------  checking user login form------
const loginValidateInput = (username, password) => {
    let isValid = true;
    const usernameValue = username.value.trim()
    const passwordValue = password.value.trim()

    //------------- For Username----------------
    if (usernameValue === "") {
        setError(username, "* Username cannot be blank")
        isValid = false
    } else {
        setSuccess(username)
    }
    //------------ For Password--------------
    if (passwordValue === "") {
        setError(password, "* Password cannot be blank")
        isValid = false
    } else {
        setSuccess(password)
    }

    return isValid
}


/** 
* Global Notification Function
* Usage: displayMessage('Operation successful!', 'success');
* Usage: displayMessage('Something went wrong.', 'error');
*/
function displayMessage(text, type = 'error') {
    const messageElement = document.getElementById('displayMessage');
    const messageContent = document.getElementById('messageContent');
    const messageText = document.getElementById('message');
    const msgIcon = document.getElementById('msgIcon');

    // 1. Reset
    messageElement.classList.add('hidden');
    void messageElement.offsetWidth; // Trigger reflow

    // 2. Set Text
    messageText.textContent = text;

    // 3. Set Styling & Icon
    const baseClasses = 'message-content-base';

    if (type === 'success') {
        messageContent.className = `${baseClasses} message-type-success`;
        // Checkmark Icon
        msgIcon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
    } else {
        messageContent.className = `${baseClasses} message-type-error`;
        // Error/X Icon
        msgIcon.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    }

    // 4. Show
    messageElement.classList.remove('hidden');

    // 5. Auto-Hide Timer
    if (window.msgTimeout) clearTimeout(window.msgTimeout);
    window.msgTimeout = setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 3600);
}


/**
* Toggle Global Loader
* Usage: toggleLoader(true) -> Show
* Usage: toggleLoader(false) -> Hide
*/
function toggleLoader(show = true) {
    const loader = document.getElementById('globalLoader');
    if (show) {
        loader.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
        loader.style.opacity = '0'; // Fade out
        setTimeout(() => {
            loader.classList.remove('active');
            loader.style.opacity = ''; // Reset opacity
            document.body.style.overflow = ''; // Restore scrolling
        }, 400); // Match CSS transition time
    }
}

// Example: Show loader on page load (Optional, uncomment to enable)
// window.addEventListener('load', () => {
//     toggleLoader(true);
//     setTimeout(() => toggleLoader(false), 1500);
// });



// async function getUserInfo() {
//     try {
//         const response = await fetch('https://ipapi.co/json/');
//         if (!response.ok) {
//             throw new Error('Network response was not ok' + response.statusText);
//         }

//         const data = await response.json();
//         // console.log("Data from the ip ",data);
//         const userInfo = {
//             ip: data.ip,
//             ip_version: data.version,
//             city: data.city,
//             region: data.region,
//             country: data.country_name,
//             longitude: data.longitude,
//             network_org: data.org,
//         };

//         try {
//             const response = await fetch('/api/v1/users/save-userInfo', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(userInfo),
//             });

//         } catch (error) {
//             console.log("Something went wrong when sending the data", error);

//         }


//     } catch (error) {
//         console.log("Fetching user info failed", error);

//     }
// }


export { loginValidateInput, showPassword, signupValidateInput, displayMessage, toggleLoader }
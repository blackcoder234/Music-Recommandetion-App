import { resetPasswordValidateInput, showPassword, showLoader, hideLoader, displayMessage } from './utils.js'
const resetPassword = document.querySelector(".resetPassword")
const newPassword = document.querySelector("#newPassword")
const confirmPassword = document.querySelector("#confirmPassword")
const cancelBtn = document.querySelector("#cancelBtn")



resetPassword.addEventListener("submit", async (evt) => {
    evt.preventDefault()
    showLoader()
    if (!resetPasswordValidateInput(newPassword, confirmPassword)) {
        return
    }
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("token")
    const newPasswordValue = newPassword.value

    try {
        const response = await fetch(`/api/v1/users/reset-password/${token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword: newPasswordValue }),
        })

        const result = await response.json()
        if (result.statuscode === 200) {
            displayMessage( result.message, "success")
            setTimeout(() => {
                window.location.href = "/login"
            }, 2000)
        } else {
            displayMessage( result.message, "error")
        }
    } catch (error) {
        displayMessage( "Something went wrong! Try again.", "error")
        console.log("Something went wrong! Try again.", error)
    } finally {
        hideLoader()
    }
})

// show password function
const showPassWordBtn = document.querySelectorAll("#showPassword")
showPassWordBtn.forEach((btn) => {
    const password = btn.previousElementSibling
    showPassword(btn, password)
})

// cancel button
cancelBtn.addEventListener("click", () => {
    window.location.href = "/"
})
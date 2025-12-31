import {displayMessage, showLoader, hideLoader} from './utils.js'

const sendEmail = document.querySelector(".sendEmail")  
const cancelBtn = document.querySelector("#cancelBtn")

sendEmail.addEventListener("submit", async (evt) => {
    evt.preventDefault()
    showLoader()

    const email = document.getElementById("email").value

    try {
        const response = await fetch("/api/v1/users/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })

        const result = await response.json()
        if (result.statuscode === 200) {
            displayMessage( result.message, "success")
            setTimeout(() => {
                window.location.href = "/"
            }, 2000)
        } else {
            displayMessage( result.message, "error")
        }
    } catch (error) {
        displayMessage( "Something went wrong! Try again.", "error")
        console.log("server error:", error)
    }finally{
        hideLoader()
    }
})

// cancel button
cancelBtn.addEventListener("click", () => {
    window.location.href = "/"
})
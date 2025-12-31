import { displayMessage, showLoader, hideLoader} from './utils.js';

const coverImageInput = document.querySelector("#coverImage");
const avatarImageInput = document.querySelector("#avatar");
const userName = document.querySelector("#userName");
const profileUpdateForm = document.querySelector("#profileUpdateForm");
const fullName = document.querySelector("#fullName");
const email = document.querySelector("#email");
const phoneNumber = document.querySelector("#phoneNumber");
const userBio = document.querySelector("#bio");

// Address Fields
const streetAddress = document.querySelector("#streetAddress");
const village = document.querySelector("#village");
const pincode = document.querySelector("#pincode");
const district = document.querySelector("#district");
const state = document.querySelector("#state");
const country = document.querySelector("#country");

const cancelBtn = document.querySelector("#cancelBtn");

// Progress Bars
const coverProgressBar = document.querySelector("#coverProgress");
const avatarProgressBar = document.querySelector("#avatarProgress");


function handleImagePreview(inputElement, previewElement, progressBarElement, maxSizeMB = 2) {
    const file = inputElement.files[0];
    if (!file) return;


    if (!file.type.startsWith("image/")) {
        displayMessage("error", "Invalid file type. Please upload an image.");
        inputElement.value = "";
        return;
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        displayMessage("error", `File size should be less than ${maxSizeMB}MB.`);
        inputElement.value = "";
        return;
    }
    progressBarElement.classList.remove("hidden");
    const reader = new FileReader();

    reader.onprogress = function (e) {
        if (e.lengthComputable) {
            const percentLoaded = Math.round((e.loaded / e.total) * 100);
            progressBarElement.style.width = percentLoaded + "%";
        }
    };

    reader.onload = function (e) {
        previewElement.src = e.target.result;
        progressBarElement.style.width = "100%";
        setTimeout(() => progressBarElement.classList.add("hidden"), 500);
    };

    reader.readAsDataURL(file);
}


coverImageInput.addEventListener("change", function (e) {
    handleImagePreview(coverImageInput, document.getElementById("coverPreview"), coverProgressBar);
});

avatarImageInput.addEventListener("change", function (e) {
    handleImagePreview(avatarImageInput, document.getElementById("avatarPreview"), avatarProgressBar);
});


document.getElementById("bio").addEventListener("input", function (e) {
    const maxLength = 250;
    const currentLength = e.target.value.length;
    const counter = document.getElementById("bioCounter");

    counter.textContent = currentLength;

    if (currentLength > maxLength) {
        e.target.value = e.target.value.substring(0, maxLength);
        counter.textContent = maxLength;
    }
});


profileUpdateForm.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    showLoader()

    if (!fullName.value || !phoneNumber.value || !country.value || !state.value || !district.value || !village.value || !pincode.value) {
        displayMessage("error", "Please fill all the required fields");
        return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName.value);
    formData.append("email", email.value);
    formData.append("phoneNumber", phoneNumber.value);
    formData.append("bio", userBio.value);
    formData.append("country", country.value);
    formData.append("state", state.value);
    formData.append("district", district.value);
    formData.append("village", village.value);
    formData.append("pincode", pincode.value);
    formData.append("streetAddress", streetAddress.value);
    if (coverImageInput.files.length > 0) {
        formData.append("coverImage", coverImageInput.files[0]);
    }
    if (avatarImageInput.files.length > 0) {
        formData.append("avatar", avatarImageInput.files[0]);
    }

    // ✅ Debugging Step: Log what is inside formData
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {

        const response = await fetch("/api/v1/users/update-account", {
            method: "PATCH",
            body: formData,
        });

        const result = await response.json();
        console.log(result);

        if (result.statuscode === 200) {
            displayMessage( result.message, "success");
            setTimeout(() => {
                window.location.href = "/user-profile";
            }, 2000);
        } else {
            displayMessage( result.message, "error");
        }
    } catch (error) {
        console.error("Profile update error:", error);
        displayMessage( "Something went wrong", "error");
    }finally{
        hideLoader()
    }
});


cancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/user-profile";
})



document.addEventListener("DOMContentLoaded", function () {

    fullName.value = localStorage.getItem("userFullname")
    email.value = localStorage.getItem("email")
    phoneNumber.value = sessionStorage.getItem("phoneNumber");
    userBio.value = sessionStorage.getItem("bio") || "";
    streetAddress.value = sessionStorage.getItem("streetAddress");
    village.value = sessionStorage.getItem("village");
    pincode.value = sessionStorage.getItem("pincode")
    const stateValue = sessionStorage.getItem("state")
    const districtValue = sessionStorage.getItem("district")
    state.innerHTML = `<option value="${stateValue}" selected>${stateValue}</option>`;
    district.innerHTML = `<option value="${districtValue}" selected>${districtValue}</option>`;


    const profileUpdateForm = document.getElementById("profileUpdateForm");
const updateProfileBtn = document.getElementById("updateProfileBtn");



const formInputs = profileUpdateForm.querySelectorAll("input, textarea, select");
const initialValues = {};
formInputs.forEach(input => initialValues[input.name] = input.value);

// ✅ Check if Any Input Has Changed
function checkForChanges() {
    let isChanged = [...formInputs].some(input =>
        (input.type === "file" && input.files.length > 0) ||
        input.value !== initialValues[input.name]
    );

    updateProfileBtn.disabled = !isChanged;
    updateProfileBtn.classList.toggle("opacity-50", !isChanged);
    updateProfileBtn.classList.toggle("cursor-not-allowed", !isChanged);
    updateProfileBtn.classList.toggle("cursor-pointer", isChanged);
}

// ✅ Add Event Listeners to Detect Changes
formInputs.forEach(input => {
    input.addEventListener("input", checkForChanges);
    input.addEventListener("change", checkForChanges);
});


updateProfileBtn.disabled = true;
updateProfileBtn.classList.add("opacity-50", "cursor-not-allowed");


    pincode.addEventListener("input", async function () {
        if (pincode.value.trim().length === 6) {
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pincode.value.trim()}`);
                const data = await response.json();

                if (data[0].Status === "Success") {

                    const postOffice = data[0].PostOffice[0];
                    state.innerHTML = `<option value="${postOffice.State}" selected>${postOffice.State}</option>`;
                    district.innerHTML = `<option value="${postOffice.District}" selected>${postOffice.District}</option>`;
                } else {
                    console.error("Invalid Pincode");
                }
            } catch (error) {
                console.error("Error fetching Pincode data:", error);
            }
        }
    });
});

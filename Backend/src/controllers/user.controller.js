import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
import UserProfile from "../models/user_details.model.js"
import File from "../models/files.model.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import sendEmail from "../utils/sendMail.js"
import { OAuth2Client } from "google-auth-library"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong when generate access and refresh token"
        )
    }
}

// Helper to generate a unique username from email when username is not provided
const generateUniqueUsernameFromEmail = async (email) => {
    const basePart = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user"
    let candidate = basePart
    let suffix = 0

    // Ensure uniqueness by appending a numeric suffix if needed
    // e.g. john, john1, john2, ...
    // Use a simple loop; in practice collisions should be rare
    // but this guarantees a unique username.
    while (await User.exists({ username: candidate })) {
        suffix += 1
        candidate = `${basePart}${suffix}`
    }
    return candidate
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, fullName, username } = req.body

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new ApiError(409, "User already exists with this email")
    }

    let finalUsername = username?.trim().toLowerCase()
    if (!finalUsername) {
        finalUsername = await generateUniqueUsernameFromEmail(email)
    } else {
        const usernameTaken = await User.exists({ username: finalUsername })
        if (usernameTaken) {
            throw new ApiError(409, "Username is already taken")
        }
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const avatarUpload = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null

    const user = await User.create({
        username: finalUsername,
        email,
        fullName,
        password,
        avatar: avatarUpload?.secure_url || "",
        authProvider: "email",
        isEmailVerified: false,
    })

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Internal server error: registering the user")
    }

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(201, {
                user: createdUser,
                accessToken,
                refreshToken,
            }, "User successfully registered and logged in!"),
        )
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (user.authProvider === "google") {
        throw new ApiError(400, "This account uses Google login. Please sign in with Google.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }, "User logged in successfully"),
        )
})

// Google OAuth login / signup
const googleAuth = asyncHandler(async (req, res) => {
    const { idToken } = req.body

    if (!idToken) {
        throw new ApiError(400, "Google ID token is required")
    }

    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const email = payload?.email
    const fullName = payload?.name
    const avatarUrl = payload?.picture

    if (!email) {
        throw new ApiError(400, "Google account does not have a valid email")
    }

    let user = await User.findOne({ email })

    if (!user) {
        const username = await generateUniqueUsernameFromEmail(email)

        user = await User.create({
            username,
            email,
            fullName,
            avatar: avatarUrl || "",
            authProvider: "google",
            isEmailVerified: true,
        })
    } else if (user.authProvider === "email") {
        // Optional: mark that this user can now also sign in with Google
        user.authProvider = "google"
        if (!user.avatar && avatarUrl) {
            user.avatar = avatarUrl
        }
        user.isEmailVerified = true
        await user.save({ validateBeforeSave: false })
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }, "User authenticated with Google successfully"),
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
    }

    return res
        .status(200)
        .clearCookie("accessToken", {...options, maxAge:0})
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully!"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorize request ")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
            user._id
        )

        return res
        .status(200)
        .cookie("accessToken", accessToken, {...options, maxAge: 2 * 24 * 60 * 60 * 1000} )
        .cookie("refreshToken", refreshToken, {...options, maxAge: 10 * 24 * 60 * 60 * 1000} )
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken,
                expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000
            }, "Token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message, "Invalid Refresh token")

    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password! Please enter correct password and try again")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(
            200, {}, "Password is changed successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, phoneNumber, bio, country, state, district, village, pincode, streetAddress } = req.body;


    if (!fullName) throw new ApiError(400, "Full name is required");

    if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
        throw new ApiError(400, "Invalid phone number format");
    }
    if (bio && bio.length > 250) {
        throw new ApiError(400, "Bio cannot exceed 250 characters");
    }

    const address = { country, state, district, village, pincode, streetAddress };


    let userProfiles = await UserProfile.findOne({ user: req.user._id });

    if (!userProfiles) {

        userProfiles = new UserProfile({ user: req.user._id });
    }


    userProfiles.fullName = fullName;
    userProfiles.phoneNumber = phoneNumber;
    userProfiles.bio = bio;
    userProfiles.address = address;


    if (req.files) {
        if (req.files["avatar"]) {
            const avatar = await uploadOnCloudinary(req.files["avatar"][0].path);
            if (!avatar) throw new ApiError(400, "Failed to upload avatar");
            userProfiles.avatar = avatar.secure_url;
        }

        if (req.files["coverImage"]) {
            const coverImage = await uploadOnCloudinary(req.files["coverImage"][0].path);
            if (!coverImage) throw new ApiError(400, "Failed to upload cover image");
            userProfiles.coverImage = coverImage.secure_url;
        }
    }


    await userProfiles.save()

    const userProfile = await UserProfile.findOne({ user: req.user._id })

    return res.status(200).json(new ApiResponse(200, userProfile, "Profile updated successfully"));
})

const uploadFiles = asyncHandler(async (req, res) => {

    // console.log("Received files:", req.files);

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "No files uploaded.");
    }

    const images = [];

    for (const file of req.files) {
        const localFilePath = file.path;

        try {
            const uploadedFile = await uploadOnCloudinary(localFilePath);
            if (!uploadedFile) {
                throw new ApiError(500, "Error uploading file to Cloudinary.");
            }

            images.push({
                url: uploadedFile.url,
                publicId: uploadedFile.public_id
            });

        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            throw new ApiError(500, "File upload failed.");
        }
    }


    let fileRecord = await File.findOne({ user: req.user._id });

    if (fileRecord) {

        fileRecord.images.push(...images);
        await fileRecord.save();
    } else {

        fileRecord = await File.create({
            user: req.user._id,
            images: images
        });
    }

    return res.status(200).json(new ApiResponse(200, fileRecord, "Files uploaded successfully"));
})

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body
    // Check if the user exists
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_PASSWORD_SECRET, { expiresIn: "5m" })
    const resetURL = `${process.env.FRONTEND_URL}/reset.password.html?token=${resetToken}`
    await sendEmail(user.email, "Password Reset Request",
        `Click the link to reset your password: ${resetURL}`
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset link sent to your email!! Please check your email"
            )
        )
})

const resetPassword = asyncHandler(async (req, res) => {

    const { token } = req.params;
    const { newPassword } = req.body;

    const decode = jwt.verify(token, process.env.RESET_PASSWORD_SECRET)
    const user = await User.findById(decode.userId)

    if (!user) {
        throw new ApiError(400, "Invalid or expired token")
    }
    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save({ validateBeforeSave: false })


    res.status(200).json(new ApiResponse(200, {}, "Password reset successful!! Please login with your new password"))

})

const getUserProfile = asyncHandler(async (req, res) => {


    const userProfile = await UserProfile.findOne({ user: req.user._id });

    if (!userProfile) {
        throw new ApiError(404, "User profile not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, userProfile, "User profile fetched successfully!"));
})

const getFiles = asyncHandler(async (req, res) => {
    const files = await File.findOne({ user: req.user._id });

    if (!files || !files.images?.length) {
        return res.status(200).json(new ApiResponse(200, [], "No files found for this user"));
    }

    return res.status(200).json(new ApiResponse(200, files, "Files fetched successfully!"));
})

const deleteFile = asyncHandler(async (req, res) => {
    const { publicId } = req.body;

    if (!publicId) throw new ApiError(400, "Public ID is required.");
    const result = await deleteOnCloudinary(publicId)

    if (result.result !== "ok") {
        throw new ApiError(500, "Failed to delete image from storage.");
    }

    await File.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { images: { publicId } } },
        { new: true }
    );

    res.status(200).json(new ApiResponse(200, null, "Image deleted successfully."));
});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    uploadFiles,
    forgotPassword,
    resetPassword,
    getUserProfile,
    getFiles,
    deleteFile,
    googleAuth


}

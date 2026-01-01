
import { Router } from "express"
import {
    registerUser,
    loginUser,
    googleAuth,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateUserAvatar,
    deleteAccount,
    getLikedTracks,
    getListeningHistory,
    getTopTracks
} from "../controllers/user.controller.js"
import { saveUserInfo } from "../controllers/track-visitor.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(upload,registerUser)
router.route("/login").post(loginUser)
router.route("/google").post(googleAuth)

//secured routes 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload, updateUserAvatar)
router.route("/delete-account").delete(verifyJWT, deleteAccount)

// User Library Routes
router.route("/liked-tracks").get(verifyJWT, getLikedTracks)
router.route("/history").get(verifyJWT, getListeningHistory)
router.route("/top-tracks").get(verifyJWT, getTopTracks)


router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)


// get user info
router.route("/save-userInfo").post(saveUserInfo)


export default router
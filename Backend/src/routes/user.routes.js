import { Router } from "express"
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    uploadFiles,
    forgotPassword,
    resetPassword,
    getUserProfile,
    getFiles,
    deleteFile
  
} from "../controllers/user.controller.js"
import { saveUserInfo } from "../controllers/track-visitor.controller.js"
import { upload, uploadMultiple } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getArticles,getFeaturedArticles, getArticleBySlug } from "../controllers/article.controller.js"

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//secured routes 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/update-account").patch(verifyJWT, upload, updateAccountDetails)
router.route("/get-profile/:id").get(verifyJWT, getUserProfile)
router.route("/upload-files").post(verifyJWT,  uploadMultiple, uploadFiles)
router.route("/get-file/:id").get(verifyJWT, getFiles)
router.route("/delete-file").delete(verifyJWT, deleteFile)


router.post("/forgot-password", forgotPassword)
router.post("/reset-password/:token", resetPassword)

// Article routes
router.route("/get-articles").get( getArticles)
router.route("/articles/slug/:slug").get( getArticleBySlug)
router.route("/get-featured-articles").get( getFeaturedArticles)

// get user info
router.route("/save-userInfo").post(saveUserInfo)


export default router
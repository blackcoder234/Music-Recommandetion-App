
import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

const fileSizeLimit = 5 * 1024 * 1024 // 5MB

const upload = multer({
    storage,
    limits: { fileSize: fileSizeLimit }, 
}).fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
])


const uploadMultiple = multer({
    storage,
    limits: { fileSize: fileSizeLimit }, 
}).array("images", 10)

export { upload, uploadMultiple }

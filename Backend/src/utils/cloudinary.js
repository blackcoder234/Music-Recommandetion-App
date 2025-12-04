import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import 'dotenv/config'


 cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        
        // console.log("localPath from user controller.js:", localFilePath)
        
        if (!localFilePath) return null
        //upload the file in the cloud
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "croponer-website"
        })
        //if file has been uploaded successfully
        // console.log("File has been successfully Uploaded to Cloudinary !!", response.url)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.log( "Cloudinary upload error:",error)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null
    }

}

const deleteOnCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId);
        
        // console.log("File deleted from Cloudinary:", response);
        return response;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return null;
    }
};

export {uploadOnCloudinary , deleteOnCloudinary} 
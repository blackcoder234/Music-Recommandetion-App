import mongoose from "mongoose";
import User from "./user.model.js";

const UserProfileSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        unique: true 
    },
    fullName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    phoneNumber: { 
        type: String, 
        required: true, 
        match: /^[0-9]{10}$/ 
    },
    bio: { 
        type: String, 
        maxlength: 250 
    },
    avatar: { 
        type: String, 
        default: ""  
    },
    coverImage: { 
        type: String, 
        default: ""  
    },
    address: {
        country: { type: String, required: true },
        state: { type: String, required: true },
        district: { type: String, required: true },
        village: { type: String, required: true },
        pincode: { 
            type: String, 
            required: true, 
            match: /^[0-9]{6}$/ 
        },
        streetAddress: { type: String }
    }
}, { timestamps: true });

 const UserProfile =  mongoose.model("UserProfile", UserProfileSchema);

 export default UserProfile;
import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"



const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
            index: true
        },
        phoneNumber: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        avatar: {
            type: String, // cloudinary url
            default: ""
        },
        preference: {
            favoriteGenres: {
                type: [String],      // e.g. ["pop", "rock"]
                default: [],
            },
            favoriteArtists: {
                type: [{
                    type: Schema.Types.ObjectId,
                    ref: "Artist"
                }],
                default: [],
            },
            preferredLanguages: {
                type: [String],      // e.g. ["en", "hi"]
                default: [],
            },
            moodPreferences: {
                type: [String],      // e.g. ["chill", "study"]
                default: [],
            },
        },

        likedTracks: [
            {
                type: Schema.Types.ObjectId,
                ref: "Track",
                default: []
            }
        ],
        likedPlaylistIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "Playlist",
                default: []

            }
        ],
        refreshToken: {
            type: String
        },
    },

    { timestamps: true }
)


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema)

export default User 

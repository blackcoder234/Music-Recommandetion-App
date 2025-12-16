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
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === "email"
            },
        },
        avatar: {
            type: String, // cloudinary url
            default: ""
        },
        authProvider: {
            type: String,
            enum: ["email", "google"],
            default: "email",
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
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


userSchema.pre("save", async function () {
    // In promise-based middleware (async), Mongoose does not
    // use the `next` callback. Just return/throw from the
    // function and Mongoose will handle flow control.
    if (!this.isModified("password")) {
        return
    }
    this.password = await bcrypt.hash(this.password, 10)
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

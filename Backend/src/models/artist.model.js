import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const artistSchema = new Schema(
    {
        artistName: {
            type: String,
            required: true,
            trim: true,
        },
        artistBio: {
            type: String,
            default: "",
            trim: true,
        },
        artistImage: {
            type: String,
            default: "",
        },
        genres: {
            type: [String], // like ["pop", "rock"]
            default: [],
        },
        socialLinks: {
            instagram: { type: String, default: "" },
            youtube: { type: String, default: "" },
            spotify: { type: String, default: "" },
            twitter: { type: String, default: "" },
        },
    },
    { timestamps: true }
);


artistSchema.plugin(mongooseAggregatePaginate);

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const trackSchema = new Schema(
    {
        trackFile: {
            type: String, // Cloudinary Url
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        artist: {
            type: Schema.Types.ObjectId,
            ref: "Artist",
            required: true,
        },
        album: {
            type: Schema.Types.ObjectId,
            ref: "Album",
        },
        duration: {
            type: Number, // Duration in seconds
            required: true,
        },
        language: {
            type: String,
        },
        genres: {
            type: [String],
            default: [],
        },
        mood: {
            type: [String],
            default: [],
        },
        playCount: {
            type: Number,
            default: 0,
        },
        likeCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

trackSchema.plugin(mongooseAggregatePaginate);

const Track = mongoose.model("Track", trackSchema);

export default Track;
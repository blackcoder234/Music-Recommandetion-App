import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {
        playListTitle: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        coverImage: {
            type: String,
            default: "",
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tracks: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "Track",
                },
            ],
            default: [],
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        totalTracks: {
            type: Number,
            default: 0,
        },
        totalDurationSeconds: {
            type: Number,
            default: 0,
        },
        tags: {
            type: [String], // e.g. ["study", "chill", "focus"]
            default: [],
        },
        mood: {
            type: [String], // e.g. ["chill", "happy"]
            default: [],
        },

    },
    { timestamps: true })

playlistSchema.plugin(mongooseAggregatePaginate);

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
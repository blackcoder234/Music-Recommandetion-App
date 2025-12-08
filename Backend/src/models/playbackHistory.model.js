import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        track: {
            type: Schema.Types.ObjectId,
            ref: "Track",
            required: true,
        },
        playedAt: {
            type: Date,
            default: Date.now,
        },
        progressSeconds: {
            type: Number,
            default: 0,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        device: {
            type: String,
            enum: ["web", "android", "ios", "desktop", "other"],
            default: "web",
        },
        ipAddress: {
            type: String,
        },
    },
    { timestamps: true }
)

playlistSchema.plugin(mongooseAggregatePaginate);
const PlaybackHistory = mongoose.model('PlaybackHistory', playlistSchema);

export default PlaybackHistory;
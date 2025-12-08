import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const albumSchema = new Schema(
    {
        albumTitle: {
            type: String,
            required: true,
            trim: true,
        },
        albumArtist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Artist',
            required: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        coverImage: {
            type: String,
            required: true,
        },
        releaseDate: {
            type: Date,
        },
        genres: {
            type: [String], // like ["pop", "rock"]
            default: [],
        },
        totalTracks: {
            type: Number,
            default: 0,
        },
        totalDurationSeconds: {
            type: Number, // sum of all track durations
            default: 0,
        },
    },
    { timestamps: true })

albumSchema.plugin(mongooseAggregatePaginate);

const Album = mongoose.model('Album', albumSchema);

export default Album;
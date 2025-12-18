import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Track from "../models/track.model.js";
import Artist from "../models/artist.model.js";
import Album from "../models/album.model.js";

// Create a new track
const createTrack = asyncHandler(async (req, res) => {
    const {
        trackFile,
        title,
        artist,
        album,
        duration,
        language,
        genres = [],
        mood = [],
    } = req.body;

    if (!trackFile || !title || !artist || !duration) {
        throw new ApiError(400, "trackFile, title, artist and duration are required");
    }

    const artistExists = await Artist.findById(artist);
    if (!artistExists) {
        throw new ApiError(404, "Artist not found");
    }

    let albumDoc = null;
    if (album) {
        albumDoc = await Album.findById(album);
        if (!albumDoc) {
            throw new ApiError(404, "Album not found");
        }
    }

    const track = await Track.create({
        trackFile,
        title,
        artist,
        album: album || null,
        duration,
        language,
        genres,
        mood,
    });

    if (albumDoc) {
        await Album.findByIdAndUpdate(albumDoc._id, {
            $inc: {
                totalTracks: 1,
                totalDurationSeconds: duration,
            },
        });
    }

    const createdTrack = await Track.findById(track._id)
        .populate("artist")
        .populate("album");

    if (!createdTrack) {
        throw new ApiError(500, "Internal server error: creating the track");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdTrack, "Track created successfully"));
});

// Get a single track by ID
const getTrackById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const track = await Track.findById(id)
        .populate("artist")
        .populate("album");

    if (!track) {
        throw new ApiError(404, "Track not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, track, "Track fetched successfully"));
});

// List tracks with optional filters and basic pagination
const getAllTracks = asyncHandler(async (req, res) => {
    const {
        artistId,
        albumId,
        genre,
        mood,
        search,
        page = 1,
        limit = 20,
    } = req.query;

    const filter = {};

    if (artistId) {
        filter.artist = artistId;
    }

    if (albumId) {
        filter.album = albumId;
    }

    if (genre) {
        filter.genres = { $in: [genre] };
    }

    if (mood) {
        filter.mood = { $in: [mood] };
    }

    if (search) {
        filter.title = { $regex: search, $options: "i" };
    }

    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * pageSize;

    const [total, tracks] = await Promise.all([
        Track.countDocuments(filter),
        Track.find(filter)
            .populate("artist")
            .populate("album")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.status(200).json(
        new ApiResponse(200, {
            tracks,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages,
            },
        }, "Tracks fetched successfully"),
    );
});

// Update track metadata
const updateTrack = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        trackFile,
        title,
        artist,
        album,
        duration,
        language,
        genres,
        mood,
    } = req.body;

    const track = await Track.findById(id);
    if (!track) {
        throw new ApiError(404, "Track not found");
    }

    if (artist && artist !== String(track.artist)) {
        const artistExists = await Artist.findById(artist);
        if (!artistExists) {
            throw new ApiError(404, "Artist not found");
        }
        track.artist = artist;
    }

    if (album && album !== String(track.album)) {
        const albumDoc = await Album.findById(album);
        if (!albumDoc) {
            throw new ApiError(404, "Album not found");
        }
        track.album = album;
    }

    if (typeof trackFile === "string") {
        track.trackFile = trackFile;
    }
    if (typeof title === "string") {
        track.title = title;
    }
    if (typeof duration !== "undefined") {
        track.duration = duration;
    }
    if (typeof language === "string") {
        track.language = language;
    }
    if (Array.isArray(genres)) {
        track.genres = genres;
    }
    if (Array.isArray(mood)) {
        track.mood = mood;
    }

    await track.save();

    const updatedTrack = await Track.findById(track._id)
        .populate("artist")
        .populate("album");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTrack, "Track updated successfully"));
});

// Delete a track
const deleteTrack = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const track = await Track.findByIdAndDelete(id);
    if (!track) {
        throw new ApiError(404, "Track not found");
    }

    if (track.album) {
        await Album.findByIdAndUpdate(track.album, {
            $inc: {
                totalTracks: -1,
                totalDurationSeconds: -track.duration,
            },
        });
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Track deleted successfully"));
});

// Increment play count when a track is played
const incrementPlayCount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const track = await Track.findByIdAndUpdate(
        id,
        { $inc: { playCount: 1 } },
        { new: true },
    )
        .populate("artist")
        .populate("album");

    if (!track) {
        throw new ApiError(404, "Track not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, track, "Play count incremented"));
});

// Increment like count for a track
const likeTrack = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const track = await Track.findByIdAndUpdate(
        id,
        { $inc: { likeCount: 1 } },
        { new: true },
    )
        .populate("artist")
        .populate("album");

    if (!track) {
        throw new ApiError(404, "Track not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, track, "Like count incremented"));
});

export {
    createTrack,
    getTrackById,
    getAllTracks,
    updateTrack,
    deleteTrack,
    incrementPlayCount,
    likeTrack,
};


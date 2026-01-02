import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Album from "../models/album.model.js";
import Track from "../models/track.model.js";
import mongoose from "mongoose";

const getAllAlbums = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const pipeline = [];

  // 1. Search Filter
  if (search) {
    pipeline.push({
      $match: {
        albumTitle: { $regex: search, $options: "i" },
      },
    });
  }

  // 2. Lookup Tracks to get REAL count (Dynamic)
  pipeline.push({
    $lookup: {
      from: "tracks",
      localField: "_id",
      foreignField: "album",
      as: "tracks",
    },
  });

  // 3. Lookup Artist
  pipeline.push({
    $lookup: {
      from: "artists",
      localField: "albumArtist",
      foreignField: "_id",
      as: "artistDetails",
    },
  });

  // 4. Project only needed fields and Calculate Size
  pipeline.push({
    $project: {
      albumTitle: 1,
      description: 1,
      coverImage: 1,
      releaseDate: 1,
      createdAt: 1,
      // Dynamic count of tracks belonging to this album
      totalTracks: { $size: "$tracks" },
      artist: { $arrayElemAt: ["$artistDetails", 0] },
    },
  });

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const albumAggregate = Album.aggregate(pipeline);
  const albums = await Album.aggregatePaginate(albumAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, albums, "Albums fetched successfully"));
});

const getAlbumById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid album ID");
  }

  // 1. Fetch Album Metadata
  const album = await Album.findById(id).populate(
    "albumArtist",
    "artistName artistImage artistBio followers"
  );

  if (!album) {
    throw new ApiError(404, "Album not found");
  }

  // 2. Fetch EXACT tracks for this album
  // This ensures we NEVER show tracks that don't belong here
  const tracks = await Track.find({ album: id }).populate("artist", "artistName");

  // 3. Construct Response with Corrected Counts
  const albumData = {
    ...album.toObject(),
    // Normalize artist field for frontend (it expects 'artist' string or object)
    artist: album.albumArtist ? album.albumArtist.artistName : "Unknown Artist",
    artistDetails: album.albumArtist, // Keep full object if needed
    tracks: tracks,
    // OVERRIDE any static totalTracks with the REAL count
    totalTracks: tracks.length,
    // Calculate real duration
    totalDuration: tracks.reduce((acc, t) => acc + (t.duration || 0), 0),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, albumData, "Album fetched successfully"));
});

export { getAllAlbums, getAlbumById };

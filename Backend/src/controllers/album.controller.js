import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Album from "../models/album.model.js";
import Track from "../models/track.model.js";
import mongoose from "mongoose";

const getAllAlbums = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

  const pipeline = [];

  if (search) {
    pipeline.push({
      $match: {
        albumTitle: { $regex: search, $options: "i" },
      },
    });
  }

  pipeline.push({
    $lookup: {
      from: "artists",
      localField: "albumArtist",
      foreignField: "_id",
      as: "artistDetails",
      pipeline: [
        {
          $project: {
            name: 1,
            image: 1,
          },
        },
      ],
    },
  });

  pipeline.push({
    $addFields: {
      artist: { $arrayElemAt: ["$artistDetails", 0] },
    },
  });

  const albumAggregate = Album.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

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

  const album = await Album.findById(id).populate(
    "albumArtist",
    "name image description followers"
  );

  if (!album) {
    throw new ApiError(404, "Album not found");
  }

  // Fetch tracks for this album
  const tracks = await Track.find({ album: id }).populate("artist", "name");

  // Construct response
  const albumData = {
    ...album.toObject(),
    tracks: tracks,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, albumData, "Album fetched successfully"));
});

export { getAllAlbums, getAlbumById };

import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Artist from "../models/artist.model.js";

// Create a new artist (for admin use later)
const createArtist = asyncHandler(async (req, res) => {
	const {
		artistName,
		artistBio,
		artistImage,
		genres = [],
		socialLinks = {},
	} = req.body;

	if (!artistName || !artistImage) {
		throw new ApiError(400, "artistName and artistImage are required");
	}

	const existing = await Artist.findOne({ artistName: artistName.trim() });
	if (existing) {
		throw new ApiError(409, "Artist with this name already exists");
	}

	const artist = await Artist.create({
		artistName: artistName.trim(),
		artistBio: artistBio || "",
		artistImage,
		genres,
		socialLinks,
	});

	const createdArtist = await Artist.findById(artist._id);
	if (!createdArtist) {
		throw new ApiError(500, "Internal server error: creating the artist");
	}

	return res
		.status(201)
		.json(new ApiResponse(201, createdArtist, "Artist created successfully"));
});

// Get a single artist by ID
const getArtistById = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const artist = await Artist.findById(id);
	if (!artist) {
		throw new ApiError(404, "Artist not found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, artist, "Artist fetched successfully"));
});

// List artists with optional filters and basic pagination
const getAllArtists = asyncHandler(async (req, res) => {
	const {
		genre,
		search,
		page = 1,
		limit = 20,
	} = req.query;

	const filter = {};

	if (genre) {
		filter.genres = { $in: [genre] };
	}

	if (search) {
		filter.artistName = { $regex: search, $options: "i" };
	}

	const pageNumber = parseInt(page, 10) || 1;
	const pageSize = parseInt(limit, 10) || 20;
	const skip = (pageNumber - 1) * pageSize;

	const [total, artists] = await Promise.all([
		Artist.countDocuments(filter),
		Artist.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(pageSize),
	]);

	const totalPages = Math.ceil(total / pageSize) || 1;

	return res.status(200).json(
		new ApiResponse(200, {
			artists,
			pagination: {
				total,
				page: pageNumber,
				limit: pageSize,
				totalPages,
			},
		}, "Artists fetched successfully"),
	);
});

// Update artist details (for admin use later)
const updateArtist = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const {
		artistName,
		artistBio,
		artistImage,
		genres,
		socialLinks,
	} = req.body;

	const artist = await Artist.findById(id);
	if (!artist) {
		throw new ApiError(404, "Artist not found");
	}

	if (typeof artistName === "string" && artistName.trim()) {
		artist.artistName = artistName.trim();
	}
	if (typeof artistBio === "string") {
		artist.artistBio = artistBio;
	}
	if (typeof artistImage === "string") {
		artist.artistImage = artistImage;
	}
	if (Array.isArray(genres)) {
		artist.genres = genres;
	}
	if (socialLinks && typeof socialLinks === "object") {
		artist.socialLinks = {
			...artist.socialLinks.toObject?.() || artist.socialLinks,
			...socialLinks,
		};
	}

	await artist.save();

	const updatedArtist = await Artist.findById(artist._id);

	return res
		.status(200)
		.json(new ApiResponse(200, updatedArtist, "Artist updated successfully"));
});

// Delete an artist (for admin use later)
const deleteArtist = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const artist = await Artist.findByIdAndDelete(id);
	if (!artist) {
		throw new ApiError(404, "Artist not found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Artist deleted successfully"));
});

export {
	createArtist,
	getArtistById,
	getAllArtists,
	updateArtist,
	deleteArtist,
};


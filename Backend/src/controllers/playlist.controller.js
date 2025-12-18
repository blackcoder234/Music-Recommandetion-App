import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Playlist from "../models/playlist.model.js";
import Track from "../models/track.model.js";

// Helper to recalculate totalTracks and totalDurationSeconds
const recalcPlaylistStats = async (playlistId) => {
	const playlist = await Playlist.findById(playlistId).populate("tracks");
	if (!playlist) return null;

	const totalTracks = playlist.tracks.length;
	const totalDurationSeconds = playlist.tracks.reduce(
		(sum, track) => sum + (track?.duration || 0),
		0,
	);

	playlist.totalTracks = totalTracks;
	playlist.totalDurationSeconds = totalDurationSeconds;
	await playlist.save();

	return playlist;
};

// Create a new playlist for the logged-in user
const createPlaylist = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const {
		playListTitle,
		description,
		coverImage,
		tracks = [],
		isPublic = false,
		tags = [],
		mood = [],
	} = req.body;

	if (!userId) {
		throw new ApiError(401, "Unauthorized: user not found in request");
	}

	if (!playListTitle) {
		throw new ApiError(400, "playListTitle is required");
	}

	// Optional: validate provided track IDs exist
	if (Array.isArray(tracks) && tracks.length > 0) {
		const existingTracksCount = await Track.countDocuments({
			_id: { $in: tracks },
		});
		if (existingTracksCount !== tracks.length) {
			throw new ApiError(400, "One or more tracks do not exist");
		}
	}

	const playlist = await Playlist.create({
		playListTitle: playListTitle.trim(),
		description: description || "",
		coverImage: coverImage || "",
		owner: userId,
		tracks,
		isPublic,
		tags,
		mood,
	});

	await recalcPlaylistStats(playlist._id);

	const createdPlaylist = await Playlist.findById(playlist._id)
		.populate({ path: "tracks", populate: { path: "artist album" } })
		.populate("owner", "username fullName avatar");

	return res
		.status(201)
		.json(new ApiResponse(201, createdPlaylist, "Playlist created successfully"));
});

// Get playlists owned by the logged-in user
const getMyPlaylists = asyncHandler(async (req, res) => {
	const userId = req.user?._id;

	const playlists = await Playlist.find({ owner: userId })
		.sort({ createdAt: -1 })
		.populate({ path: "tracks", populate: { path: "artist album" } });

	return res
		.status(200)
		.json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
});

// Get a public or owned playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user?._id;

	const playlist = await Playlist.findById(id)
		.populate({ path: "tracks", populate: { path: "artist album" } })
		.populate("owner", "username fullName avatar");

	if (!playlist) {
		throw new ApiError(404, "Playlist not found");
	}

	const isOwner = userId && String(playlist.owner?._id || playlist.owner) === String(userId);
	if (!playlist.isPublic && !isOwner) {
		throw new ApiError(403, "You do not have access to this playlist");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

// Get public playlists (for discovery)
const getPublicPlaylists = asyncHandler(async (req, res) => {
	const {
		tag,
		mood,
		search,
		page = 1,
		limit = 20,
	} = req.query;

	const filter = { isPublic: true };

	if (tag) {
		filter.tags = { $in: [tag] };
	}

	if (mood) {
		filter.mood = { $in: [mood] };
	}

	if (search) {
		filter.playListTitle = { $regex: search, $options: "i" };
	}

	const pageNumber = parseInt(page, 10) || 1;
	const pageSize = parseInt(limit, 10) || 20;
	const skip = (pageNumber - 1) * pageSize;

	const [total, playlists] = await Promise.all([
		Playlist.countDocuments(filter),
		Playlist.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(pageSize)
			.populate("owner", "username fullName avatar"),
	]);

	const totalPages = Math.ceil(total / pageSize) || 1;

	return res.status(200).json(
		new ApiResponse(200, {
			playlists,
			pagination: {
				total,
				page: pageNumber,
				limit: pageSize,
				totalPages,
			},
		}, "Public playlists fetched successfully"),
	);
});

// Update playlist metadata (only owner)
const updatePlaylist = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user?._id;
	const {
		playListTitle,
		description,
		coverImage,
		isPublic,
		tags,
		mood,
	} = req.body;

	const playlist = await Playlist.findById(id);
	if (!playlist) {
		throw new ApiError(404, "Playlist not found");
	}

	if (String(playlist.owner) !== String(userId)) {
		throw new ApiError(403, "You can only update your own playlists");
	}

	if (typeof playListTitle === "string" && playListTitle.trim()) {
		playlist.playListTitle = playListTitle.trim();
	}
	if (typeof description === "string") {
		playlist.description = description;
	}
	if (typeof coverImage === "string") {
		playlist.coverImage = coverImage;
	}
	if (typeof isPublic === "boolean") {
		playlist.isPublic = isPublic;
	}
	if (Array.isArray(tags)) {
		playlist.tags = tags;
	}
	if (Array.isArray(mood)) {
		playlist.mood = mood;
	}

	await playlist.save();

	const updatedPlaylist = await Playlist.findById(playlist._id)
		.populate({ path: "tracks", populate: { path: "artist album" } })
		.populate("owner", "username fullName avatar");

	return res
		.status(200)
		.json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"));
});

// Add a track to a playlist (only owner)
const addTrackToPlaylist = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { trackId } = req.body;
	const userId = req.user?._id;

	if (!trackId) {
		throw new ApiError(400, "trackId is required");
	}

	const playlist = await Playlist.findById(id);
	if (!playlist) {
		throw new ApiError(404, "Playlist not found");
	}

	if (String(playlist.owner) !== String(userId)) {
		throw new ApiError(403, "You can only modify your own playlists");
	}

	const track = await Track.findById(trackId);
	if (!track) {
		throw new ApiError(404, "Track not found");
	}

	const alreadyInPlaylist = playlist.tracks.some(
		(t) => String(t) === String(trackId),
	);
	if (!alreadyInPlaylist) {
		playlist.tracks.push(trackId);
		await playlist.save();
		await recalcPlaylistStats(playlist._id);
	}

	const updatedPlaylist = await Playlist.findById(playlist._id)
		.populate({ path: "tracks", populate: { path: "artist album" } })
		.populate("owner", "username fullName avatar");

	return res
		.status(200)
		.json(new ApiResponse(200, updatedPlaylist, "Track added to playlist"));
});

// Remove a track from a playlist (only owner)
const removeTrackFromPlaylist = asyncHandler(async (req, res) => {
	const { id, trackId } = req.params;
	const userId = req.user?._id;

	const playlist = await Playlist.findById(id);
	if (!playlist) {
		throw new ApiError(404, "Playlist not found");
	}

	if (String(playlist.owner) !== String(userId)) {
		throw new ApiError(403, "You can only modify your own playlists");
	}

	const beforeCount = playlist.tracks.length;
	playlist.tracks = playlist.tracks.filter(
		(t) => String(t) !== String(trackId),
	);

	if (playlist.tracks.length === beforeCount) {
		// Track was not in playlist; still return success
		return res
			.status(200)
			.json(new ApiResponse(200, playlist, "Track not present in playlist"));
	}

	await playlist.save();
	await recalcPlaylistStats(playlist._id);

	const updatedPlaylist = await Playlist.findById(playlist._id)
		.populate({ path: "tracks", populate: { path: "artist album" } })
		.populate("owner", "username fullName avatar");

	return res
		.status(200)
		.json(new ApiResponse(200, updatedPlaylist, "Track removed from playlist"));
});

// Delete a playlist (only owner)
const deletePlaylist = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const userId = req.user?._id;

	const playlist = await Playlist.findById(id);
	if (!playlist) {
		throw new ApiError(404, "Playlist not found");
	}

	if (String(playlist.owner) !== String(userId)) {
		throw new ApiError(403, "You can only delete your own playlists");
	}

	await Playlist.findByIdAndDelete(id);

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

export {
	createPlaylist,
	getMyPlaylists,
	getPlaylistById,
	getPublicPlaylists,
	updatePlaylist,
	addTrackToPlaylist,
	removeTrackFromPlaylist,
	deletePlaylist,
};


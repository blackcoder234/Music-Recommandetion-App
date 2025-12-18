import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import PlaybackHistory from "../models/playbackHistory.model.js";
import Track from "../models/track.model.js";

// Start playback for a track (create a history entry and bump play count)
const startPlayback = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const { trackId, device = "web", ipAddress } = req.body;

	if (!userId) {
		throw new ApiError(401, "Unauthorized: user not found in request");
	}

	if (!trackId) {
		throw new ApiError(400, "trackId is required");
	}

	const track = await Track.findById(trackId);
	if (!track) {
		throw new ApiError(404, "Track not found");
	}

	await Track.findByIdAndUpdate(trackId, { $inc: { playCount: 1 } });

	const history = await PlaybackHistory.create({
		user: userId,
		track: trackId,
		playedAt: new Date(),
		progressSeconds: 0,
		completed: false,
		device,
		ipAddress: ipAddress || req.ip,
	});

	const created = await PlaybackHistory.findById(history._id)
		.populate({ path: "track", populate: { path: "artist album" } })
		.populate("user", "username fullName avatar");

	return res
		.status(201)
		.json(new ApiResponse(201, created, "Playback started"));
});

// Update playback progress or completion status
const updatePlaybackProgress = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const { id } = req.params;
	const { progressSeconds, completed } = req.body;

	const history = await PlaybackHistory.findById(id);
	if (!history) {
		throw new ApiError(404, "Playback history entry not found");
	}

	if (String(history.user) !== String(userId)) {
		throw new ApiError(403, "You can only update your own playback entries");
	}

	if (typeof progressSeconds === "number" && progressSeconds >= 0) {
		history.progressSeconds = progressSeconds;
	}

	if (typeof completed === "boolean") {
		history.completed = completed;
	}

	await history.save();

	const updated = await PlaybackHistory.findById(history._id)
		.populate({ path: "track", populate: { path: "artist album" } })
		.populate("user", "username fullName avatar");

	return res
		.status(200)
		.json(new ApiResponse(200, updated, "Playback updated"));
});

// Get full playback history for the logged-in user
const getMyPlaybackHistory = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const { page = 1, limit = 20 } = req.query;

	const pageNumber = parseInt(page, 10) || 1;
	const pageSize = parseInt(limit, 10) || 20;
	const skip = (pageNumber - 1) * pageSize;

	const filter = { user: userId };

	const [total, history] = await Promise.all([
		PlaybackHistory.countDocuments(filter),
		PlaybackHistory.find(filter)
			.sort({ playedAt: -1 })
			.skip(skip)
			.limit(pageSize)
			.populate({ path: "track", populate: { path: "artist album" } }),
	]);

	const totalPages = Math.ceil(total / pageSize) || 1;

	return res.status(200).json(
		new ApiResponse(200, {
			history,
			pagination: {
				total,
				page: pageNumber,
				limit: pageSize,
				totalPages,
			},
		}, "Playback history fetched successfully"),
	);
});

// Get recent plays for the logged-in user (last N entries)
const getMyRecentPlays = asyncHandler(async (req, res) => {
	const userId = req.user?._id;
	const { limit = 10 } = req.query;

	const size = parseInt(limit, 10) || 10;

	const recent = await PlaybackHistory.find({ user: userId })
		.sort({ playedAt: -1 })
		.limit(size)
		.populate({ path: "track", populate: { path: "artist album" } });

	return res
		.status(200)
		.json(new ApiResponse(200, recent, "Recent plays fetched successfully"));
});

export {
	startPlayback,
	updatePlaybackProgress,
	getMyPlaybackHistory,
	getMyRecentPlays,
};


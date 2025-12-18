import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Track from "../models/track.model.js";
import PlaybackHistory from "../models/playbackHistory.model.js";
import { RecommendationLog } from "../models/recommendationLog.model.js";

// Rule-based "for-you" recommendations based on recent history and popular tracks
const getForYouRecommendations = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { limit = 20 } = req.query;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: user not found in request");
    }

    const size = parseInt(limit, 10) || 20;

    const recentPlays = await PlaybackHistory.find({ user: userId })
        .sort({ playedAt: -1 })
        .limit(50)
        .populate("track");

    const genreCount = new Map();
    const moodCount = new Map();
    const recentTrackIds = new Set();

    for (const entry of recentPlays) {
        if (!entry.track) continue;
        recentTrackIds.add(String(entry.track._id));

        for (const g of entry.track.genres || []) {
            genreCount.set(g, (genreCount.get(g) || 0) + 1);
        }
        for (const m of entry.track.mood || []) {
            moodCount.set(m, (moodCount.get(m) || 0) + 1);
        }
    }

    const favoriteGenres = Array.from(genreCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g);

    const favoriteMoods = Array.from(moodCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([m]) => m);

    const filter = {};
    if (favoriteGenres.length > 0) {
        filter.genres = { $in: favoriteGenres };
    }
    if (favoriteMoods.length > 0) {
        filter.mood = { $in: favoriteMoods };
    }

    let candidateQuery = Track.find(filter);

    if (Object.keys(filter).length === 0) {
        candidateQuery = Track.find({});
    }

    const candidates = await candidateQuery
        .sort({ playCount: -1, createdAt: -1 })
        .limit(size * 3);

    const filtered = candidates.filter(
        (t) => !recentTrackIds.has(String(t._id)),
    ).slice(0, size);

    const recommendedTracksPayload = filtered.map((t, index) => ({
        track: t._id,
        score: (t.playCount || 0) + 1 / (index + 1),
        rank: index + 1,
    }));

    const log = await RecommendationLog.create({
        user: userId,
        type: "for-you",
        source: "rule-based",
        inputContext: {
            favoriteGenres,
            recentTrackIds: Array.from(recentTrackIds),
            baseTrack: null,
        },
        recommendedTracks: recommendedTracksPayload,
        algorithmVersion: "v1-rule-based",
    });

    const populatedTracks = await Track.find({
        _id: { $in: filtered.map((t) => t._id) },
    }).populate("artist").populate("album");

    const tracksById = new Map(populatedTracks.map((t) => [String(t._id), t]));

    const orderedTracks = recommendedTracksPayload
        .map((r) => tracksById.get(String(r.track)))
        .filter(Boolean);

    return res.status(200).json(
        new ApiResponse(200, {
            tracks: orderedTracks,
            meta: {
                favoriteGenres,
                favoriteMoods,
                logId: log._id,
            },
        }, "Recommendations generated successfully"),
    );
});

export { getForYouRecommendations };

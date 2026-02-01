import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Track from "../models/track.model.js";
import PlaybackHistory from "../models/playbackHistory.model.js";
import { RecommendationLog } from "../models/recommendationLog.model.js";
import axios from "axios";

const RECOMMENDATION_ENGINE_URL = process.env.RECOMMENDATION_ENGINE_URL || "http://localhost:5000";

// Rule-based "for-you" recommendations based on recent history and popular tracks
const getForYouRecommendations = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { limit = 20 } = req.query;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: user not found in request");
    }

    const size = parseInt(limit, 10) || 20;

    // 1. Fetch User's History to find Last Played Track and Preferences
    const recentPlays = await PlaybackHistory.find({ user: userId })
        .sort({ playedAt: -1 })
        .limit(50)
        .populate("track");

    const genreCount = new Map();
    const moodCount = new Map();
    const recentTrackIds = new Set();
    let lastPlayedTrackId = null;

    if (recentPlays.length > 0 && recentPlays[0].track) {
        lastPlayedTrackId = String(recentPlays[0].track._id);
    }

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

    // 2. HYBRID FETCH: Call Python Engine for both Content & Collaborative
    let contentBasedIds = [];
    let collaborativeIds = [];
    
    try {
        const requests = [];
        
        // Request 1: Content-Based (if we have a last track)
        if (lastPlayedTrackId) {
            requests.push(
                axios.post(`${RECOMMENDATION_ENGINE_URL}/recommend/content-based`, null, {
                    params: { track_id: lastPlayedTrackId, limit: 10 }
                }).then(res => res.data.recommendations || []).catch(() => [])
            );
        } else {
            requests.push( Promise.resolve([]) );
        }

        // Request 2: Collaborative (User History)
        requests.push(
            axios.post(`${RECOMMENDATION_ENGINE_URL}/recommend/collaborative`, null, {
                params: { user_id: String(userId), limit: 10 }
            }).then(res => res.data.recommendations || []).catch(() => [])
        );

        const [cbResults, cfResults] = await Promise.all(requests);
        contentBasedIds = cbResults;
        collaborativeIds = cfResults;
        
    } catch (error) {
        console.error("[RecSys] Python Engine Unavailable:", error.message);
    }

    // 3. Prepare Rule-Based Query
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

    // Fetch more candidates than needed to allow for filtering
    const ruleBasedCandidates = await candidateQuery
        .sort({ playCount: -1, createdAt: -1 })
        .limit(size * 3);

    // 4. Merge Strategies (Hybrid Logic)
    // We want a mix: Collaborative (Discovery) > Content (Similarity) > Rule (Popularity)
    
    const finalTrackListIds = new Set();
    const explanationMap = new Map(); // Store why a track was picked

    // A. Add Collaborative (Top Priority)
    collaborativeIds.forEach(id => {
        if (!finalTrackListIds.has(id) && !recentTrackIds.has(id)) {
            finalTrackListIds.add(String(id));
            explanationMap.set(String(id), "Users like you listened to this");
        }
    });

    // B. Add Content-Based
    contentBasedIds.forEach(id => {
        if (!finalTrackListIds.has(id) && !recentTrackIds.has(id)) {
            finalTrackListIds.add(String(id));
            if (!explanationMap.has(id)) explanationMap.set(String(id), "Similar to your recent play");
        }
    });

    // C. Fill with Rule-Based until we hit the 'size' limit
    for (const t of ruleBasedCandidates) {
        const tId = String(t._id);
        if (finalTrackListIds.size >= size) break;
        
        if (!finalTrackListIds.has(tId) && !recentTrackIds.has(tId)) {
            finalTrackListIds.add(tId);
            explanationMap.set(tId, "Popular in your favorite genres");
        }
    }
    
    // If still not enough, grab random popular tracks
    if (finalTrackListIds.size < size) {
        for (const t of ruleBasedCandidates) {
            const tId = String(t._id);
            if (finalTrackListIds.size >= size) break;
            if (!finalTrackListIds.has(tId)) {
                finalTrackListIds.add(tId);
                explanationMap.set(tId, "Trending Now");
            }
        }
    }

    const finalIdsArray = Array.from(finalTrackListIds).slice(0, size);

    // 5. Hydrate Tracks (Fetch full details for all IDs)
    const populatedTracks = await Track.find({
        _id: { $in: finalIdsArray }
    }).populate("artist").populate("album");

    const tracksById = new Map(populatedTracks.map((t) => [String(t._id), t]));

    // Re-order based on our priority list
    const orderedTracks = finalIdsArray
        .map((id) => tracksById.get(id))
        .filter(Boolean);

    // 6. Log the Recommendation
    const recommendedTracksPayload = orderedTracks.map((t, index) => ({
        track: t._id,
        score: explanationMap.get(String(t._id)) === "Users like you listened to this" ? 1.0 : 0.8,
        rank: index + 1,
        reason: explanationMap.get(String(t._id))
    }));

    const log = await RecommendationLog.create({
        user: userId,
        type: "for-you",
        source: (collaborativeIds.length + contentBasedIds.length) > 0 ? "hybrid-v2-full" : "rule-based",
        inputContext: {
            favoriteGenres,
            recentTrackIds: Array.from(recentTrackIds),
            baseTrack: lastPlayedTrackId,
        },
        recommendedTracks: recommendedTracksPayload,
        algorithmVersion: "v2-hybrid-collab",
    });

    return res.status(200).json(
        new ApiResponse(200, {
            tracks: orderedTracks,
            meta: {
                favoriteGenres,
                favoriteMoods,
                source: aiRecommendedIds.length > 0 ? "AI + Rules" : "Rules Only",
                logId: log._id,
            },
        }, "Recommendations generated successfully"),
    );
});

export { getForYouRecommendations };

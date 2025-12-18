import { Router } from "express";
import {
    startPlayback,
    updatePlaybackProgress,
    getMyPlaybackHistory,
    getMyRecentPlays,
} from "../controllers/playback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All playback routes require authentication
router.use(verifyJWT);

// Start playback of a track
router.route("/start").post(startPlayback);

// Update progress/completion for a playback entry
router.route("/:id/progress").patch(updatePlaybackProgress);

// Full playback history for current user (paginated)
router.route("/history").get(getMyPlaybackHistory);

// Recent plays for current user (last N)
router.route("/recent").get(getMyRecentPlays);

export default router;

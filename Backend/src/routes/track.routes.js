import { Router } from "express";
import {
    getAllTracks,
    getTrackById,
    incrementPlayCount,
    likeTrack,
} from "../controllers/track.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: list tracks with filters and pagination
router.route("/").get(getAllTracks);

// Public: get single track details
router.route("/:id").get(getTrackById);

// Authenticated user: increment play count when a user plays a track
router.route("/:id/play").post(verifyJWT, incrementPlayCount);

// Authenticated user: like a track
router.route("/:id/like").post(verifyJWT, likeTrack);

export default router;

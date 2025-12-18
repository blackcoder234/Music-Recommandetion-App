import { Router } from "express";
import {
    createPlaylist,
    getMyPlaylists,
    getPlaylistById,
    getPublicPlaylists,
    updatePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public discovery: list public playlists
router.route("/public").get(getPublicPlaylists);

// All routes below require authentication
router.use(verifyJWT);

// Get playlists of the current user
router.route("/me").get(getMyPlaylists);

// Create a new playlist
router.route("/").post(createPlaylist);

// Get a playlist (owner or public), update, delete
router.route("/:id")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

// Add / remove tracks in a playlist
router.route("/:id/tracks")
    .post(addTrackToPlaylist);

router.route("/:id/tracks/:trackId")
    .delete(removeTrackFromPlaylist);

export default router;

import { Router } from "express";
import {
    getAllArtists,
    getArtistById,
} from "../controllers/artist.controller.js";

const router = Router();

// Public: list artists with filters and pagination
router.route("/").get(getAllArtists);

// Public: get single artist details
router.route("/:id").get(getArtistById);

export default router;

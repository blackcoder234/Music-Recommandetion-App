
import { Router } from "express";
import {
    getAllAlbums,
    getAlbumById,
} from "../controllers/album.controller.js";

const router = Router();

// Public routes
router.route("/").get(getAllAlbums);
router.route("/:id").get(getAlbumById);

export default router;

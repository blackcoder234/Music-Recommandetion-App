import { Router } from "express";
import { getForYouRecommendations } from "../controllers/recommendation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// Get rule-based "for-you" recommendations for the current user
router.route("/for-you").get(getForYouRecommendations);

export default router;

import { Router } from "express";
import ApiResponse from "../utils/ApiResponse.js";

const router = Router();

// Public, non-sensitive frontend config.
router.get("/public", (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        googleClientId: process.env.GOOGLE_CLIENT_ID || "",
        facebookAppId: process.env.FACEBOOK_APP_ID || "",
      },
      "Public config fetched"
    )
  );
});

export default router;

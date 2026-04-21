import express from "express";
import { addBanner, deleteBanner } from "../controller/banner_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post(
  "/admin/add-banner",
  verifyToken,
  upload.single("bannerimage"),
  addBanner,
);
router.post("/admin/delete-banner", verifyToken, deleteBanner);

export default router;

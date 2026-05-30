import express from "express";
import { addBanner, deleteBanner, getAllBanners } from "../controller/banner_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post(
  "/banner/add-banner",
  verifyToken,
  upload.single("bannerimage"),
  addBanner,
);
router.post("/banner/delete-banner", verifyToken, deleteBanner);
router.post("/banner/all-banners", getAllBanners);

export default router;

import express from "express";
import {
  addBanner,
  deleteBanner,
  getAllBanners,
  updateBanner,
  updateBannerStatus,
} from "../controller/banner_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post(
  "/banner/add-banner",
  verifyToken,
  upload.single("bannerimage"),
  addBanner,
);
router.post(
  "/banner/update-banner",
  verifyToken,
  upload.single("bannerimage"),
  updateBanner,
);
router.post("/banner/delete-banner", verifyToken, deleteBanner);
router.post("/banner/update-banner-status", verifyToken, updateBannerStatus);

router.post("/banner/all-banners", getAllBanners);

export default router;

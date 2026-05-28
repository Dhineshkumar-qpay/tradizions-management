import {
  sendOTP,
  verifyOTP,
  getProfile,
  updateProfile,
  addToNewsletter,
} from "../controller/auth_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";
import express from "express";
import { handleSendEmail } from "../../admin/controller/mailController.js";

const router = express.Router();

router.post("/auth/sendotp", sendOTP);
router.post("/auth/verifyotp", verifyOTP);
router.post("/auth/profile", verifyToken, getProfile);
router.post("/auth/updateprofile", verifyToken, updateProfile);
router.post("/auth/newsletter", addToNewsletter);
router.post("/order/place-order-mail", handleSendEmail);

export default router;

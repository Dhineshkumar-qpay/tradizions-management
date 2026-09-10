import { adminAndUser, adminOnly, verifyToken } from "../../middleware/auth_middleware.js";
import {
  getAllUsers,
  sendAdminOTP,
  verifyAdminOTP,
} from "../controller/admin_auth_controller.js";
import express from "express";

const router = express.Router();
router.post("/admin/send-otp", sendAdminOTP);
router.post("/admin/verify-otp", verifyAdminOTP);
router.post("/admin/getallusers", verifyToken, adminAndUser, getAllUsers);

export default router;

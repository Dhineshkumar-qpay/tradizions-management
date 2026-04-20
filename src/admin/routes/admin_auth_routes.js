import { sendAdminOTP ,verifyAdminOTP} from "../controller/admin_auth_controller.js";
import express from "express";

const router = express.Router();
router.post("/admin/send-otp", sendAdminOTP);
router.post("/admin/verify-otp", verifyAdminOTP);

export default router;

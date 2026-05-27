import { getAllUsers, sendAdminOTP ,verifyAdminOTP} from "../controller/admin_auth_controller.js";
import express from "express";
import { handleSendEmail } from "../controller/mailController.js";

const router = express.Router();
router.post("/admin/send-otp", sendAdminOTP);
router.post("/admin/verify-otp", verifyAdminOTP);
router.post("/admin/getallusers", getAllUsers);

router.post("/order/place-order-mail",handleSendEmail)

export default router;

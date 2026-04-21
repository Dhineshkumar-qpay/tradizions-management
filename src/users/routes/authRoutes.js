import { sendOTP, verifyOTP, getProfile, updateProfile, updateName, } from "../controller/auth_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";
import express from "express";

const router = express.Router();

router.post("/auth/sendotp", sendOTP);
router.post("/auth/verifyotp", verifyOTP);
router.post("/auth/profile", verifyToken, getProfile);
router.post("/auth/update-name", verifyToken, updateName);
router.put("/auth/updateprofile", verifyToken, upload.single("profileimage"), updateProfile);


export default router;

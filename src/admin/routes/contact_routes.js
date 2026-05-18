import { adminOnly, verifyToken } from "../../middleware/auth_middleware.js";
import {
  addCorporateContactUs,
  addNormalContactUs,
  deleteContactUs,
  getNormalContactUs,
} from "../controller/contact_controller.js";
import express from "express";

const router = express.Router();

router.post("/contact/add-normal-contactus", addNormalContactUs);
router.post("/contact/add-corporate-contactus", addCorporateContactUs);
router.post(
  "/contact/delete-contactus",
  verifyToken,
  adminOnly,
  deleteContactUs,
);
router.post(
  "/contact/get-contacts",
  verifyToken,
  adminOnly,
  getNormalContactUs,
);

export default router;

import express from "express";
import {
  addDistrict,
  getDistricts,
  addState,
  getState,
} from "../controller/state_district_controller.js";
import { adminOnly, verifyToken } from "../../middleware/auth_middleware.js";

const router = express.Router();

router.post("/admin/addstate", verifyToken, adminOnly, addState);
router.post("/admin/getstates", verifyToken, getState);
router.post("/admin/adddistrict", verifyToken, adminOnly, addDistrict);
router.post("/admin/getdistricts", verifyToken, getDistricts);

export default router;

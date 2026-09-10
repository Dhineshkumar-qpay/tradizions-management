import {
  addAddress,
  deleteAddress,
  getAllAddress,
} from "../controller/address_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

import express from "express";

const router = express.Router();

router.post("/address/add-address", verifyToken, addAddress);
router.post("/address/delete-address", verifyToken, deleteAddress);
router.post("/address/get-all-address", verifyToken, getAllAddress);

export default router;

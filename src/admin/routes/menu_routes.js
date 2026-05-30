import express from "express";
import { adminOnly, verifyToken } from "../../middleware/auth_middleware.js";
import {
  addMenu,
  getAllMenus,
  getAllMerchantMenus,
  updateMenu,
} from "../controller/menu_controller.js";

const router = express.Router();

router.post("/menu/add-menu", verifyToken, adminOnly, addMenu);
router.post("/menu/update-menu", verifyToken, adminOnly, updateMenu);
router.post("/menu/all-menu", verifyToken, adminOnly, getAllMenus);
router.post("/menu/merchant-menus", verifyToken, getAllMerchantMenus);

export default router;

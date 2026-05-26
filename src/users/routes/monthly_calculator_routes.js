import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  getCalculatedProducts,
  placeMonthlyOrder,
  addToMonthlyCart,
  getMonthlyCart,
  updateMonthlyOrderStatus,
  getMerchantMonthlyOrders,
} from "../controller/monthly_calculator_controller.js";

const router = express.Router();

router.post("/calculator/products", verifyToken, getCalculatedProducts);
router.post("/calculator/cart/add", verifyToken, addToMonthlyCart);
router.post("/calculator/cart/get", verifyToken, getMonthlyCart);
router.post(
  "/calculator/place-order",
  verifyToken,
  placeMonthlyOrder,
);

router.post("/calculator/update-order-status", verifyToken, updateMonthlyOrderStatus);
router.post("/calculator/merchant-orders", verifyToken, getMerchantMonthlyOrders);

export default router;

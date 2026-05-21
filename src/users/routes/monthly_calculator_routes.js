import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  getCalculatedProducts,
  buyNowCalculator,
  placeCalculatorOrder,
  getUserCalculatorOrders,
  getMerchantCalculatorOrders
} from "../controller/monthly_calculator_controller.js";

const router = express.Router();

router.post("/calculator/products", verifyToken, getCalculatedProducts);
router.post("/calculator/buy-now", verifyToken, buyNowCalculator);
router.post("/calculator/place-order", verifyToken, placeCalculatorOrder);
router.post("/calculator/user-orders", verifyToken, getUserCalculatorOrders);
router.post("/calculator/merchant-orders", verifyToken, getMerchantCalculatorOrders);

export default router;

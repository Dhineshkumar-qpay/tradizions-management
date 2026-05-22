import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  // calculateMonthlySubscription,
  getCalculatedProducts,
  placeMonthlySubscriptionOrder,
  monthlyOrderSummary,
  addToMonthlyCart,
  getMonthlyCart,
} from "../controller/monthly_calculator_controller.js";

const router = express.Router();

router.post("/calculator/products", verifyToken, getCalculatedProducts);
router.post("/calculator/order-summary", verifyToken, monthlyOrderSummary);
router.post(
  "/calculator/place-order",
  verifyToken,
  placeMonthlySubscriptionOrder,
);

router.post("/calculator/cart/add", verifyToken, addToMonthlyCart);
router.post("/calculator/cart/get", verifyToken, getMonthlyCart);

export default router;

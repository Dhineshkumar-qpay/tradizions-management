import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  getCalculatedProducts,
  placeMonthlyOrder,
  addToMonthlyCart,
  getMonthlyCart,
  getMonthlyOrders,
  getMonthlyOrderDetails,
  updateMonthlyOrderStatus,
  getMerchantMonthlyOrders,
} from "../controller/monthly_calculator_controller.js";

const router = express.Router();

router.post("/monthly/products", verifyToken, getCalculatedProducts);
router.post("/monthly/cart/add", verifyToken, addToMonthlyCart);
router.post("/monthly/cart/get", verifyToken, getMonthlyCart);
router.post(
  "/monthly/place-order",
  verifyToken,
  placeMonthlyOrder,
);
router.post("/monthly/orders", verifyToken, getMonthlyOrders);
router.post("/monthly/order-detail", verifyToken, getMonthlyOrderDetails);
router.post("/monthly/update-order-status", verifyToken, updateMonthlyOrderStatus);
router.post("/monthly/merchant-orders", verifyToken, getMerchantMonthlyOrders);

export default router;

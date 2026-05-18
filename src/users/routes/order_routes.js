import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  getMerchantOrders,
  getOrderItems,
  orderDetails,
  placeOrder,
} from "../controller/order_controller.js";
import express from "express";

const router = express.Router();

router.post("/order/placeorder", verifyToken, placeOrder);
router.post("/order/get-all-orders", verifyToken, getOrderItems);
router.post("/order/order-details", verifyToken, orderDetails);

router.post("/order/get-merchant-orders", verifyToken, getMerchantOrders);

export default router;

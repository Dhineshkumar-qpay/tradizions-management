import {
  adminAndUser,
  adminOnly,
  userOnly,
  verifyToken,
} from "../../middleware/auth_middleware.js";
import {
  getMerchantOrders,
  orderDetails,
  placeOrder,
  getAlluserOrders,
  updateOrderStatus,
  getAdminOrdersList,
  getUserOrders,
  updateOrderItemStatus,
} from "../controller/order_controller.js";
import express from "express";

const router = express.Router();

router.post("/order/placeorder", verifyToken, placeOrder);
router.post("/order/get-all-user-orders", verifyToken, getAlluserOrders);
router.post("/order/order-details", verifyToken, adminAndUser, orderDetails);
router.post("/order/get-all-orders", verifyToken, adminAndUser, getUserOrders);

router.post("/order/get-merchant-orders", verifyToken, getMerchantOrders);
router.post(
  "/admin/get-all-orders",
  verifyToken,
  adminOnly,
  getAdminOrdersList,
);
router.post("/order/update-item-status", verifyToken, updateOrderItemStatus);
router.post("/order/update-status", verifyToken, updateOrderStatus);

export default router;

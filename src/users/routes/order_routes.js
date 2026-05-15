import { verifyToken } from "../../middleware/auth_middleware.js";
import { placeOrder } from "../controller/order_controller.js";
import express from "express";

const router = express.Router();

router.post("/order/placeorder", verifyToken, placeOrder);

export default router;

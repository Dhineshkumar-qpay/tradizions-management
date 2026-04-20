import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
} from "../controller/cart_controller.js";

const router = express.Router();

router.post("/cart/addtocart", verifyToken, addToCart);
router.post("/cart/getcart", verifyToken, getCart);
router.post("/cart/update-quantity", verifyToken, updateCartQuantity);
router.post("/cart/remove", verifyToken, removeFromCart);

export default router;

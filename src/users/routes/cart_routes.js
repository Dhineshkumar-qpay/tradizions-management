import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  cartCount,
  selectGiftCard,
  checkoutDetail,
} from "../controller/cart_controller.js";

const router = express.Router();

router.post("/cart/addtocart", verifyToken, addToCart);
router.post("/cart/getcart", verifyToken, getCart);
router.post("/cart/update-giftcard", verifyToken, selectGiftCard);
router.post("/cart/update-quantity", verifyToken, updateCartQuantity);
router.post("/cart/remove", verifyToken, removeFromCart);
router.post("/cart/cart-count", verifyToken, cartCount);
router.post("/cart/checkout-detail", verifyToken, checkoutDetail);

export default router;

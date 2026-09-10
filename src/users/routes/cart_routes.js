import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  cartCount,
  updateGiftCard,
  checkoutDetail,
  buyNowCheckout,
  addCustomGiftToCart,
} from "../controller/cart_controller.js";

const router = express.Router();

router.post("/cart/addtocart", verifyToken, addToCart);
router.post("/cart/add-custom-gift-cart", verifyToken, addCustomGiftToCart);
router.post("/cart/getcart", verifyToken, getCart);
router.post("/cart/update-giftcard", verifyToken, updateGiftCard);

router.post("/cart/update-quantity", verifyToken, updateCartQuantity);
router.post("/cart/remove", verifyToken, removeFromCart);
router.post("/cart/cart-count", verifyToken, cartCount);
router.post("/cart/checkout-detail", verifyToken, checkoutDetail);
router.post("/cart/buy-now", verifyToken, buyNowCheckout);

export default router;

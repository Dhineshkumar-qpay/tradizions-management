import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  getAllProducts,
  getProductDetail,
  getAllGifts,
  giftDetails,
  getGiftcards,
} from "../controller/home_controller.js";
import express from "express";

const router = express.Router();

router.post("/product/getallproducts", getAllProducts);
router.post("/product/product-detail", getProductDetail);

router.post("/product/gifts", getAllGifts);
router.post("/product/gift-detail", giftDetails);
router.post("/product/gift-cards", getGiftcards);

export default router;

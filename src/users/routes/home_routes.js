import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  addProductRating,
  deleteRating,
  getAllProducts,
  getProductDetail,
  getAllGifts,
  giftDetails,
} from "../controller/home_controller.js";
import express from "express";

const router = express.Router();

router.post("/product/getallproducts", getAllProducts);
router.post("/product/product-detail", getProductDetail);

router.post("/product/gifts", getAllGifts);
router.post("/product/gift-detail", giftDetails);

router.post("/product/add-update-rating", verifyToken, addProductRating);
router.post("/product/delete-rating", verifyToken, deleteRating);

export default router;

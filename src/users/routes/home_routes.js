import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  addProductRating,
  deleteRating,
  getAllBanners,
  getAllCategories,
  getAllProducts,
  getProductDetail,
  getProductsByCategory,
  giftDetails,
} from "../controller/home_controller.js";
import express from "express";

const router = express.Router();

router.post("/product/getallproducts", verifyToken, getAllProducts);
router.post("/product/product-detail", verifyToken, getProductDetail);
router.post("/category/getallcategories", verifyToken, getAllCategories);
router.post("/product/get-cat-products", verifyToken, getProductsByCategory);
router.post("/gift/gift-detail", verifyToken, giftDetails);
router.post("/banner/getallbanners", verifyToken, getAllBanners);

router.post("/product/add-update-rating", verifyToken, addProductRating);
router.post("/product/delete-rating", verifyToken, deleteRating);

export default router;

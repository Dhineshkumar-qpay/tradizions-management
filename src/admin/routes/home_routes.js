import {
  adminOnly,
  userOnly,
  verifyToken,
} from "../../middleware/auth_middleware.js";
import {
  activeAppReview,
  addAppReview,
  addThinamoruKural,
  deleteAppReview,
  getAllAppReviews,
  getKural,
  getMerchantDashboardCounts,
  getProductStocks,
  getUserAppReviews,
  updateProductStock,
} from "../controller/home_controller.js";
import express from "express";
import { getAllProducts } from "../controller/product_gift_controller.js";

const router = express.Router();

router.post("/kural/addthinamorukural", verifyToken, addThinamoruKural);
router.post("/kural/get-kural", getKural);

router.post("/home/data-count", verifyToken, getMerchantDashboardCounts);
router.post("/home/product-stocks", verifyToken, getProductStocks);
router.post("/home/update-product-stock", verifyToken, updateProductStock);

router.post("/product/get-all-products", verifyToken, getAllProducts);

// Review
router.post(
  "/review/get-all-reviews",
  verifyToken,
  adminOnly,
  getAllAppReviews,
);
router.post("/review/delete-review", verifyToken, adminOnly, deleteAppReview);
router.post("/review/active-review", verifyToken, adminOnly, activeAppReview);

router.post("/review/add-review", verifyToken, userOnly, addAppReview);
router.post("/review/get-user-reviews", getUserAppReviews);

export default router;

import {
  adminOnly,
  userOnly,
  verifyToken,
} from "../../middleware/auth_middleware.js";
import {
  activeAppReview,
  addAppReview,
  addCorporateContactUs,
  addNormalContactUs,
  addThinamoruKural,
  deleteAppReview,
  deleteContactUs,
  getAllAppReviews,
  getHomeProducts,
  getKural,
  getNormalContactUs,
  getUserAppReviews,
  searchProducts,
} from "../controller/home_controller.js";
import express from "express";
import { getAllProducts } from "../controller/product_gift_controller.js";

const router = express.Router();

router.post("/kural/addthinamorukural", verifyToken, addThinamoruKural);
router.post("/kural/get-kural", getKural);

router.post("/product/get-home-products", getHomeProducts);
router.post("/product/search", searchProducts);

router.post("/product/get-all-products", verifyToken, getAllProducts);

// contact us routes
router.post("/contact/add-normal-contactus", addNormalContactUs);
router.post("/contact/add-corporate-contactus", addCorporateContactUs);
router.post(
  "/contact/delete-contactus",
  verifyToken,
  adminOnly,
  deleteContactUs,
);
router.post(
  "/contact/get-contacts",
  verifyToken,
  adminOnly,
  getNormalContactUs,
);

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

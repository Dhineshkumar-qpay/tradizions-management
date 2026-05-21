import {
  adminOnly,
  userOnly,
  verifyToken,
} from "../../middleware/auth_middleware.js";
import {
  addThinamoruKural,
  getKural,
  getMerchantDashboardCounts,
  getProductStocks,
  getSuperAdminDashboardData,
  getTotalStocksData,
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

router.post(
  "/admin/dashboard-counts",
  verifyToken,
  adminOnly,
  getSuperAdminDashboardData,
);
router.post(
  "/admin/stock-counts",
  verifyToken,
  adminOnly,
  getTotalStocksData,
);

export default router;

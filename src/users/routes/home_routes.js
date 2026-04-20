import { verifyToken } from "../../middleware/auth_middleware.js";
import { getAllCategories, getAllProducts, getProductsByCategory } from "../controller/home_controller.js";
import express from "express";

const router = express.Router();

router.post("/user/getallproducts", verifyToken, getAllProducts);
router.post("/user/getallcategories", verifyToken, getAllCategories);
router.post("/user/get-cat-products", verifyToken, getProductsByCategory);

export default router;

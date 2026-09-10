import express from "express";
import {
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getAllSubcategories,
  addSubcategory,
  deleteSubCategory,
} from "../controller/category_controllers.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post(
  "/category/addcategory",
  verifyToken,
  upload.single("categoryimage"),
  addCategory,
);
router.post(
  "/category/updatecategory",
  verifyToken,
  upload.single("categoryimage"),
  updateCategory,
);
router.post("/category/deletecategory", verifyToken, deleteCategory);
router.post("/category/getallcategories", getAllCategories);

router.post("/category/addsubcategory", verifyToken, addSubcategory);
router.post("/category/deletesubcategory", verifyToken, deleteSubCategory);
router.post("/category/getallsubcategories", getAllSubcategories);

export default router;

import express from "express";
import {
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
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
router.post("/category/getallcategory", verifyToken, getAllCategories);

export default router;

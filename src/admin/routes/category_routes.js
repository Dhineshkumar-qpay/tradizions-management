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
    "/bsuiness/addcategory",
    verifyToken,
    upload.single("categoryimage"),
    addCategory,
);
router.post(
    "/bsuiness/updatecategory",
    verifyToken,
    upload.single("categoryimage"),
    updateCategory,
);
router.post("/bsuiness/deletecategory", verifyToken, deleteCategory);
router.post("/bsuiness/getallcategory", verifyToken, getAllCategories);

export default router;

import express from "express";
import { verifyToken } from "../../middleware/auth_middleware.js";
import {
  addOrUpdateProductImages,
  addProduct,
  deleteProduct,
  deleteProductImage,
  getAllProducts,
  updateProduct,
  addGift,
  editGift,
  deleteGift,
  getGifts,
  addGiftImage,
  addProductImage,
} from "../controller/product_gift_controller.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post(
  "/business/upload-product-image",
  verifyToken,
  upload.single("productimage"),
  addProductImage,
);

router.post("/business/addproduct", verifyToken, addProduct);
router.post("/business/updateproduct", verifyToken, updateProduct);

router.post("/business/deleteproduct", verifyToken, deleteProduct);
router.post("/business/getproducts", verifyToken, getAllProducts);

router.post(
  "/business/upload-product-images",
  verifyToken,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addOrUpdateProductImages,
);

router.post("/business/delete-product-image", verifyToken, deleteProductImage);

router.post(
  "/business/upload-gift-image",
  verifyToken,
  upload.single("giftimage"),
  addGiftImage,
);
router.post("/business/addgift", verifyToken, addGift);
router.post("/business/editgift", verifyToken, editGift);
router.post("/business/deletegift", verifyToken, deleteGift);
router.post("/business/getgifts", verifyToken, getGifts);

export default router;

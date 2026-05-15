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
  getMerchantGifts,
  addGiftImage,
  addProductImage,
  addProductRating,
  deleteRating,
  getAllProductRatings,
  ratingStatusUpdate,
  addGiftCard,
  getGiftCards,
  deleteGiftCard,
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
  "/product/add-gift-card",
  verifyToken,
  upload.single("cardimage"),
  addGiftCard,
);
router.post("/product/get-gift-cards", verifyToken, getGiftCards);
router.post("/product/delete-gift-card", verifyToken, deleteGiftCard);

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
router.post("/business/getgifts", verifyToken, getMerchantGifts);

router.post("/product/add-update-rating", verifyToken, addProductRating);
router.post("/product/delete-rating", verifyToken, deleteRating);
router.post("/product/rating-status", verifyToken, ratingStatusUpdate);
router.post("/product/all-ratings", verifyToken, getAllProductRatings);

export default router;

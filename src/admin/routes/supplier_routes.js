import express from "express";
import {
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  addSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
  getAllSupplierProducts,
  searchProducts,
} from "../controller/supplier_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

// Supplier Routes
router.post("/supplier/add", verifyToken, upload.single("logo"), addSupplier);
router.post("/supplier/update", verifyToken, upload.single("logo"), updateSupplier);
router.post("/supplier/delete", verifyToken, deleteSupplier);
router.post("/supplier/getall", getAllSuppliers);
router.post("/supplier/getbyid", getSupplierById);

// Supplier Product Routes
router.post("/supplier/product/add", verifyToken, addSupplierProduct);
router.post("/supplier/product/update", verifyToken, updateSupplierProduct);
router.post("/supplier/product/delete", verifyToken, deleteSupplierProduct);
router.post("/supplier/product/getall", getAllSupplierProducts);
router.post("/supplier/product/search", verifyToken, searchProducts);

export default router;

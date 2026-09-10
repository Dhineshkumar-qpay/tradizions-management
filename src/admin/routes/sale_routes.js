import express from "express";
import { addSale, getAllSales, getSaleById, searchOrder, searchOrders, getOrderSuppliers, updateSale, deleteSale } from "../controller/sale_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

const router = express.Router();

router.post("/sales", verifyToken, addSale);
router.post("/sales/getall", verifyToken, getAllSales);
router.post("/sales/getbyid", getSaleById);
router.post("/sales/update", verifyToken, updateSale);
router.post("/sales/delete", verifyToken, deleteSale);
router.post("/sales/search-order", verifyToken, searchOrder);
router.post("/sales/search-orders", verifyToken, searchOrders);
router.post("/sales/order-suppliers", verifyToken, getOrderSuppliers);

export default router;

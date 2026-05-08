import { verifyToken } from "../../middleware/auth_middleware.js";
import { addThinamoruKural, getHomeProducts, getKural } from "../controller/home_controller.js";
import express from "express";

const router = express.Router();

router.post("/kural/addthinamorukural", verifyToken,addThinamoruKural);
router.post("/kural/get-kural",getKural);


router.post("/product/get-home-products",getHomeProducts);

export default router;
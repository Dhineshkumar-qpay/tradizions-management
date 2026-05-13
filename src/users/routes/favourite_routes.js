import express from "express";
import {
  addFavourite,
  getFavourites,
} from "../controller/favourite_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

const router = express.Router();

router.post("/product/add-favourite", verifyToken, addFavourite);
router.post("/product/get-favourites", verifyToken, getFavourites);

export default router;

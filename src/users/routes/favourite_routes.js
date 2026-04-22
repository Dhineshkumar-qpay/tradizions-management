import express from "express";
import {
    addFavourite,
    removeFavourite,
    getFavourites,
} from "../controller/favourite_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

const router = express.Router();

router.post("/product/add-favourite", verifyToken, addFavourite);
router.post("/product/remove-favourite", verifyToken, removeFavourite);
router.post("/product/get-favourites", verifyToken, getFavourites);

export default router;

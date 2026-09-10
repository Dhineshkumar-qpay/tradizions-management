import express from "express";
import { addPointsForPurchase, getWalletBalance } from "../controller/wallet_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

const WalletRouter = express.Router();

WalletRouter.post("/wallet/add-points", verifyToken, addPointsForPurchase);
WalletRouter.get("/wallet/balance", verifyToken, getWalletBalance);

export default WalletRouter;

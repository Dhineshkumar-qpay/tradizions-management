import express from "express";
import { createCoupon, applyCoupon, getAllCoupons, toggleCouponStatus, getActiveCoupons, editCoupon, deleteCoupon } from "../controller/coupon_controller.js";
import { verifyToken } from "../../middleware/auth_middleware.js";

const CouponRouter = express.Router();

CouponRouter.post("/coupon/create", createCoupon);
CouponRouter.post("/coupon/apply", verifyToken, applyCoupon);
CouponRouter.post("/coupon/toggle-status", toggleCouponStatus);
CouponRouter.get("/coupon/active-list", getActiveCoupons);
CouponRouter.get("/coupon/list", getAllCoupons);
CouponRouter.put("/coupon/edit", editCoupon);
CouponRouter.delete("/coupon/delete/:couponid", deleteCoupon);

export default CouponRouter;

import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import { connectDB, sequelize } from "./connection.js";
import { errorMiddleware } from "./src/middleware/error_middleware.js";
import { mode, current } from "./config/config.js";
import AdminAuthRouter from "./src/admin/routes/admin_auth_routes.js";
import BusinessRouter from "./src/admin/routes/business_routes.js";
import StateDistrictRouter from "./src/admin/routes/state_district_routes.js";
import CategoryRouter from "./src/admin/routes/category_routes.js";
import ProductGiftRouter from "./src/admin/routes/product_gift_routes.js";
import BannerRouter from "./src/admin/routes/banner_routes.js";
import HomeRouter from "./src/admin/routes/home_routes.js";
import ContactRouter from "./src/admin/routes/contact_routes.js";
import MenuRouter from "./src/admin/routes/menu_routes.js";
import GuideBlogRouter from "./src/admin/routes/guide_blog_routes.js";
import SupplierRouter from "./src/admin/routes/supplier_routes.js";
import SaleRouter from "./src/admin/routes/sale_routes.js";


import AuthRouter from "./src/users/routes/authRoutes.js";
import CartRouter from "./src/users/routes/cart_routes.js";
import ProductCategoryRouter from "./src/users/routes/home_routes.js";
import AddressRouter from "./src/users/routes/address_routes.js";
import FavouriteRouter from "./src/users/routes/favourite_routes.js";
import OrderRouter from "./src/users/routes/order_routes.js";
import MonthlyCalculatorRouter from "./src/users/routes/monthly_calculator_routes.js";
import WalletRouter from "./src/users/routes/wallet_routes.js";
import CouponRouter from "./src/users/routes/coupon_routes.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
/* Admin Routes */
app.use("/api", HomeRouter);
app.use("/api", AdminAuthRouter);
app.use("/api", StateDistrictRouter);
app.use("/api", BusinessRouter);
app.use("/api", CategoryRouter);
app.use("/api", ProductGiftRouter);
app.use("/api", BannerRouter);
app.use("/api", ContactRouter);
app.use("/api", MenuRouter);
app.use("/api", GuideBlogRouter);
app.use("/api", SupplierRouter);
app.use("/api", SaleRouter);
/* User Routes */
app.use("/api", AuthRouter);
app.use("/api", CartRouter);
app.use("/api", ProductCategoryRouter);
app.use("/api", AddressRouter);
app.use("/api", FavouriteRouter);
app.use("/api", OrderRouter);
app.use("/api", MonthlyCalculatorRouter);
app.use("/api", WalletRouter);
app.use("/api", CouponRouter);

app.use(errorMiddleware);

app.use("/", (req, res) => {
  res.send("Tradizions Management System");
})

const startServer = async () => {
  try {
    const portValue = process.env.PORT || current.server.port || 3000;
    const PORT = parseInt(portValue);

    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`-----------------------------------------`);
      console.log(`🚀 TRADIZIONS IS RUNNING`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Mode: ${mode}`);
      console.log(`-----------------------------------------`);
    });
  } catch (error) {
    console.error("Critical server startup error:", error);
  }
};

startServer();

export default app;

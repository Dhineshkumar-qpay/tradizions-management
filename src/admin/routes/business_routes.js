import express from "express";
import {
  activeBusinessStatus,
  addAddressInfo,
  addBank,
  addBasicInfo,
  addBusiness,
  addBusinessInfo,
  addKyc,
  deleteBusiness,
  getAddressInfo,
  getAllBusiness,
  getBankInfo,
  getBasicInfo,
  getBusinessInfo,
  getKyc,
  getTotalBusiness,
  updateKyc,
} from "../controller/business_controllers.js";
import { adminOnly, verifyToken } from "../../middleware/auth_middleware.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

router.post("/admin/businesses", verifyToken, getTotalBusiness);

router.post("/business/addbusiness", verifyToken, addBusiness);
router.post(
  "/business/active-business",
  verifyToken,
  adminOnly,
  activeBusinessStatus,
);
router.post("/business/deletebusiness", verifyToken, deleteBusiness);
router.post("/business/getallbusiness", verifyToken, getAllBusiness);

// Basic Deatils
router.post("/business/addbasicinfo", verifyToken, addBasicInfo);
router.post("/business/getbasicinfo", verifyToken, getBasicInfo);

router.post(
  "/business/addbusinessinfo",
  verifyToken,
  upload.single("businessimage"),
  addBusinessInfo,
);
router.post("/business/getbusinessinfo", verifyToken, getBusinessInfo);

router.post("/business/addaddressinfo", verifyToken, addAddressInfo);
router.post("/business/getaddressinfo", verifyToken, getAddressInfo);

router.post(
  "/business/addkyc",
  verifyToken,
  upload.fields([
    { name: "aadhaarfront", maxCount: 1 },
    { name: "aadhaarback", maxCount: 1 },
    { name: "panpic", maxCount: 1 },
  ]),
  addKyc,
);
router.post(
  "/business/updatekyc",
  verifyToken,
  upload.fields([
    { name: "aadhaarfront", maxCount: 1 },
    { name: "aadhaarback", maxCount: 1 },
    { name: "panpic", maxCount: 1 },
  ]),
  updateKyc,
);
router.post("/business/getkycinfo", verifyToken, getKyc);

router.post(
  "/business/addbankinfo",
  verifyToken,
  upload.single("passbook"),
  addBank,
);

router.post("/business/getbankinfo", verifyToken, getBankInfo);

export default router;

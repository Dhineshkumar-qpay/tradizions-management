import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "./uploads";

    switch (file.fieldname) {
      case "businessimage":
        uploadPath = "./uploads/business/";
        break;

      case "aadhaarfront":
      case "aadhaarback":
      case "panpic":
        uploadPath = "./uploads/kyc/";
        break;

      case "passbook":
        uploadPath = "./uploads/bank/";
        break;

      case "categoryimage":
        uploadPath = "./uploads/category/";
        break;

      case "productimage":
        uploadPath = "./uploads/products/";
        break;

      case "giftimage":
        uploadPath = "./uploads/gifts/";
        break;

      case "bannerimage":
        uploadPath = "./uploads/banner/";
        break;

      case "cardimage":
        uploadPath = "./uploads/giftcards/";
        break;

      case "goalimage":
        uploadPath = "./uploads/goalimage/";
        break;

      default:
        uploadPath = "./uploads/";
        break;
    }

    ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase();

      const fileName = Date.now() + ext;

      cb(null, fileName);
    } catch (error) {
      cb(error);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only image files allowed"), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

// --------------------------- upload Json file  ---------------------------

export const uploadJson = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads/");
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + ".json");
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only JSON files are allowed!"), false);
    }
  },
});

import express from "express";
import {
  uploadBlogImage,
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadGuideImage,
  createCookingGuide,
  getCookingGuides,
  getCookingGuideById,
  updateCookingGuide,
  deleteCookingGuide,
} from "../controller/guides_blog.js";
import { upload } from "../../middleware/multer_middleware.js";

const router = express.Router();

// --- BLOG ROUTES ---
// 1. Endpoint exclusively for uploading a blog image
router.post("/blog/upload-blog-image", upload.single("blogimage"), uploadBlogImage);

// 2. Data endpoints (no multer middleware here, just expects JSON)
router.post("/blog/add-blog", createBlog);
router.post("/blog/get-blogs", getBlogs);
router.post("/get-blog-by-id", getBlogById);
router.post("/update-blog", updateBlog);
router.post("/delete-blog", deleteBlog);


// --- COOKING GUIDE ROUTES ---
// 1. Endpoint exclusively for uploading a cooking guide image
router.post("/upload-guide-image", upload.single("guideimage"), uploadGuideImage);

// 2. Data endpoints (no multer middleware here, just expects JSON)
router.post("/guide/add-cooking-guide", createCookingGuide);
router.post("/guide/get-cooking-guides", getCookingGuides);
router.post("/get-cooking-guide-by-id", getCookingGuideById);
router.post("/update-cooking-guide", updateCookingGuide);
router.post("/delete-cooking-guide", deleteCookingGuide);


export default router;

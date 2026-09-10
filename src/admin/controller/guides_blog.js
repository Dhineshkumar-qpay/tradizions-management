import { BlogModel, CookingGuideModel } from "../../model/guide_blog_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fs from "fs";

// --- BLOG CONTROLLERS ---

export const uploadBlogImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image provided");
  }
  const blogimage = `/${req.file.path.replace(/\\/g, "/")}`;
  return res.status(200).json(new ApiResponse(200, blogimage));
});

export const createBlog = asyncHandler(async (req, res) => {
  const { title, description, author, status, blogimage } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const newBlog = await BlogModel.create({
    title,
    description,
    author,
    blogimage,
    status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Blog created successfully"));
});

export const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await BlogModel.findAll();
  return res.status(200).json(new ApiResponse(200, blogs));
});

export const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new ApiError(400, "Blog ID is required");

  const blog = await BlogModel.findByPk(id);
  if (!blog) throw new ApiError(404, "Blog not found");

  return res.status(200).json(new ApiResponse(200, blog));
});

export const updateBlog = asyncHandler(async (req, res) => {
  const { id, title, description, author, status, blogimage } = req.body;
  if (!id) throw new ApiError(400, "Blog ID is required");

  const blog = await BlogModel.findByPk(id);
  if (!blog) throw new ApiError(404, "Blog not found");

  if (blogimage && blog.blogimage && blogimage !== blog.blogimage) {
    const oldPath = blog.blogimage.startsWith("/")
      ? blog.blogimage.substring(1)
      : blog.blogimage;
    try {
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (error) {
      console.error("Failed to delete old blog image:", error);
    }
  }

  await blog.update({
    title: title ?? blog.title,
    description: description ?? blog.description,
    author: author ?? blog.author,
    status: status ?? blog.status,
    blogimage: blogimage ?? blog.blogimage,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Blog updated successfully"));
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new ApiError(400, "Blog ID is required");

  const blog = await BlogModel.findByPk(id);
  if (!blog) throw new ApiError(404, "Blog not found");

  const imagePath = blog.blogimage;
  if (imagePath) {
    const oldPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    try {
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (error) {
      console.error("Failed to delete blog image:", error);
    }
  }

  await blog.destroy();
  return res
    .status(200)
    .json(new ApiResponse(200, "Blog deleted successfully"));
});

// --- COOKING GUIDE CONTROLLERS ---

export const uploadGuideImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No image provided");
  }
  const guideimage = `/${req.file.path.replace(/\\/g, "/")}`;
  return res.status(200).json(new ApiResponse(200, guideimage));
});

export const createCookingGuide = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    difficulty,
    status,
    guideimage,
  } = req.body;

  if (!title || !description || !ingredients || !instructions) {
    throw new ApiError(
      400,
      "Title, description, ingredients, and instructions are required",
    );
  }

  const newGuide = await CookingGuideModel.create({
    title,
    description,
    guideimage,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    difficulty,
    status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Cooking Guide created successfully"));
});

export const getCookingGuides = asyncHandler(async (req, res) => {
  const guides = await CookingGuideModel.findAll({
    attributes: { exclude: ["createdAt", "updatedAt"] },
  });

  const updatedGuides = await guides.map((item) => {
    return {
      ...item.dataValues,
      ingredients:
        typeof item.dataValues.ingredients === "string"
          ? JSON.parse(item.dataValues.ingredients)
          : item.dataValues.ingredients,
      instructions:
        typeof item.dataValues.instructions === "string"
          ? JSON.parse(item.dataValues.instructions)
          : item.dataValues.instructions,
    };
  });
  return res.status(200).json(new ApiResponse(200, updatedGuides));
});

export const getCookingGuideById = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new ApiError(400, "Guide ID is required");

  const guide = await CookingGuideModel.findByPk(id);
  if (!guide) throw new ApiError(404, "Cooking Guide not found");

  return res.status(200).json(new ApiResponse(200, guide));
});

export const updateCookingGuide = asyncHandler(async (req, res) => {
  const {
    id,
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    difficulty,
    status,
    guideimage,
  } = req.body;
  if (!id) throw new ApiError(400, "Guide ID is required");

  const guide = await CookingGuideModel.findByPk(id);
  if (!guide) throw new ApiError(404, "Cooking Guide not found");

  if (guideimage && guide.guideimage && guideimage !== guide.guideimage) {
    const oldPath = guide.guideimage.startsWith("/")
      ? guide.guideimage.substring(1)
      : guide.guideimage;
    try {
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (error) {
      console.error("Failed to delete old guide image:", error);
    }
  }

  await guide.update({
    title: title ?? guide.title,
    description: description ?? guide.description,
    guideimage: guideimage ?? guide.guideimage,
    ingredients: ingredients ?? guide.ingredients,
    instructions: instructions ?? guide.instructions,
    prep_time: prep_time ?? guide.prep_time,
    cook_time: cook_time ?? guide.cook_time,
    difficulty: difficulty ?? guide.difficulty,
    status: status ?? guide.status,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Cooking Guide updated successfully"));
});

export const deleteCookingGuide = asyncHandler(async (req, res) => {
  const { id } = req.body;
  if (!id) throw new ApiError(400, "Guide ID is required");

  const guide = await CookingGuideModel.findByPk(id);
  if (!guide) throw new ApiError(404, "Cooking Guide not found");

  const imagePath = guide.guideimage;
  if (imagePath) {
    const oldPath = imagePath.startsWith("/")
      ? imagePath.substring(1)
      : imagePath;
    try {
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    } catch (error) {
      console.error("Failed to delete guide image:", error);
    }
  }

  await guide.destroy();
  return res
    .status(200)
    .json(new ApiResponse(200, "Cooking Guide deleted successfully"));
});

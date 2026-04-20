import { CategoryModel } from "../../model/category_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fs from "fs";

export const addCategory = asyncHandler(async (req, res) => {
  const { categoryname, description } = req.body;
  const file = req.file;

  try {
    if (!categoryname?.trim()) {
      throw new ApiError(400, "Category name is required");
    }

    if (!file) {
      throw new ApiError(400, "Category image is required");
    }

    const category = await CategoryModel.create({
      categoryname: categoryname.trim(),
      description: description?.trim(),
      categoryimage: `/${file.path.replace(/\\/g, "/")}`,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Category added successfully", category));
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { cid, categoryname, description } = req.body;
  const file = req.file;

  try {
    if (!cid) {
      throw new ApiError(400, "Category ID is required");
    }

    const category = await CategoryModel.findByPk(cid);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const oldImage = category.categoryimage;
    const newImagePath = file?.path;

    const categoryimage = newImagePath
      ? `/${newImagePath.replace(/\\/g, "/")}`
      : oldImage;

    await category.update({
      categoryname: categoryname?.trim() || category.categoryname,
      description:
        description !== undefined ? description.trim() : category.description,
      categoryimage,
    });

    if (newImagePath && oldImage) {
      const p = oldImage.startsWith("/") ? oldImage.slice(1) : oldImage;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Category updated successfully", category));
  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { cid } = req.body;

  if (!cid) {
    throw new ApiError(400, "Category ID is required");
  }

  const category = await CategoryModel.findByPk(cid);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const imagePath = category.categoryimage;
  await category.destroy();

  if (imagePath) {
    const p = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Category deleted successfully"));
});

export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryModel.findAll({
    attributes: {
      exclude: ["createdAt", "updatedAt"],
    },
  });
  return res.status(200).json(new ApiResponse(200, categories));
});

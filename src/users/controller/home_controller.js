import { CategoryModel } from "../../model/category_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  try {
    let { page = 1 } = req.body;

    const limit = 30;

    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductModel.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(
      new ApiResponse(200, {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count,
        hasMore: page * limit < count,
        products: rows,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getAllCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await CategoryModel.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const updatedCategories = await Promise.all(
      categories.map(async (category) => {
        const data = category.toJSON();

        const productCount = await ProductModel.count({
          where: { categoryid: data.categoryid },
        });

        return {
          ...data,
          products: productCount,
        };
      }),
    );

    return res.status(200).json(new ApiResponse(200, updatedCategories));
  } catch (error) {
    throw error;
  }
});

export const getProductsByCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryid } = req.body;
    let { page = 1 } = req.body;

    const limit = 30;

    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductModel.findAndCountAll({
      where: { categoryid },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(
      new ApiResponse(200, {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count,
        hasMore: page * limit < count,
        products: rows,
      }),
    );
  } catch (error) {
    throw error;
  }
});

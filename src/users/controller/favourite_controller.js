import { FavouriteProductModel } from "../../model/favourite_model.js";
import { ProductModel } from "../../model/product_gift_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addFavourite = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { productid } = req.body;

    if (!productid) throw new ApiError(400, "Product ID is required");

    const product = await ProductModel.findByPk(productid);
    if (!product) throw new ApiError(404, "Product not found");

    const existingFavourite = await FavouriteProductModel.findOne({
      where: { userid, productid },
    });

    if (existingFavourite) {
      return res
        .status(200)
        .json(new ApiResponse(200, "Product is already in favorites"));
    }

    await FavouriteProductModel.create({ userid, productid });

    return res
      .status(200)
      .json(new ApiResponse(200, "Product added to favorites"));
  } catch (error) {
    throw error;
  }
});

export const removeFavourite = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { productid } = req.body;

    if (!userid) throw new ApiError(401, "User not authenticated");
    if (!productid) throw new ApiError(400, "Product ID is required");

    const result = await FavouriteProductModel.destroy({
      where: { userid, productid },
    });

    if (result === 0) throw new ApiError(404, "Product not found in favorites");

    return res
      .status(200)
      .json(new ApiResponse(200, "Product removed from favorites"));
  } catch (error) {
    throw error;
  }
});

export const getFavourites = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) throw new ApiError(401, "User not authenticated");

    const favourites = await FavouriteProductModel.findAll({
      where: { userid },
      include: [
        {
          model: ProductModel,
          as: "product",
          attributes: {
            exclude: ["createdAt", "updatedAt", "specs"],
          },
        },
      ],
    });

    const updatedFavourites = favourites.map((fav) => {
      const data = fav.toJSON();
      return data.product;
    });

    return res.status(200).json(new ApiResponse(200, updatedFavourites));
  } catch (error) {
    throw error;
  }
});

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
      await existingFavourite.destroy();
      return res
        .status(200)
        .json(new ApiResponse(200, "Product removed from favorites"));
    }

    await FavouriteProductModel.create({ userid, productid });

    return res
      .status(200)
      .json(new ApiResponse(200, "Product added to favorites"));
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
          attributes: [
            "productid",
            "bid",
            "productimage",
            "productname",
            "categoryid",
            "subcategoryid",
            "price",
            "sellingprice",
            "isFavourite",
            "itemtype",
          ],
        },
      ],
    });

    const updatedFavourites = favourites.map((fav) => {
      const data = fav.toJSON();
      return {
        ...data.product,
        isFavourite: true,
      };
    });

    return res.status(200).json(new ApiResponse(200, updatedFavourites));
  } catch (error) {
    console.log(`{-------------------------------}`+req.user.userid);
    
    if (req.user.userid) {
      throw error;
    }
  }
});

import { where } from "sequelize";
import {
  ContactUsModel,
  ThinamOruKuralModel,
  TradizionsReviewModel,
} from "../../model/home_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  ProductImagesModel,
  ProductModel,
} from "../../model/product_gift_model.js";
import { type } from "os";
import { Op } from "sequelize";
import { OrderItemModel } from "../../model/order_model.js";

export const addThinamoruKural = asyncHandler(async (req, res) => {
  try {
    const { kuralList } = req.body;

    if (!Array.isArray(kuralList)) {
      throw new ApiError(400, "Kural list is required");
    }

    const result = ThinamOruKuralModel.bulkCreate(kuralList, {
      validate: true,
      ignoreDuplicates: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Kural Added Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getKural = asyncHandler(async (req, res) => {
  try {
    const kural = await ThinamOruKuralModel.findAll();
    return res.status(200).json(new ApiResponse(200, kural));
  } catch (error) {
    throw error;
  }
});

/* ---------------- App Reviews ------------------ */

export const addAppReview = asyncHandler(async (req, res) => {
  try {
    const { username, email, rating, review } = req.body;

    const userid = req.user.userid;

    if (!username || !email || !review || !rating) {
      throw new ApiError(400, "All fields are required");
    }

    const reviewExists = await TradizionsReviewModel.findOne({
      where: {
        userid: userid,
      },
    });

    if (reviewExists) {
      await reviewExists.update({
        username: username.trim(),
        email: email.trim(),
        review: review.trim(),
        rating: rating,
      });

      return res
        .status(200)
        .json(new ApiResponse(200, "Review Updated Successfully"));
    }

    const newReview = await TradizionsReviewModel.create({
      userid: userid,
      username: username.trim(),
      email: email.trim(),
      review: review.trim(),
      rating: rating,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Review Added Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllAppReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await TradizionsReviewModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(new ApiResponse(200, reviews));
  } catch (error) {
    throw error;
  }
});

export const deleteAppReview = asyncHandler(async (req, res) => {
  try {
    const { reviewid } = req.body;

    if (!reviewid) {
      throw new ApiError(400, "Review Id is required");
    }

    const existingReview = await TradizionsReviewModel.findByPk(reviewid);

    if (!existingReview) {
      throw new ApiError(404, "Review not found");
    }

    await TradizionsReviewModel.destroy({
      where: {
        reviewid: reviewid,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Review Deleted Successfully"));
  } catch (error) {
    throw error;
  }
});

export const getUserAppReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await TradizionsReviewModel.findAll({
      where: {
        isActive: true,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(new ApiResponse(200, reviews));
  } catch (error) {
    throw error;
  }
});

export const activeAppReview = asyncHandler(async (req, res) => {
  try {
    const { reviewid, isActive } = req.body;
    if (!reviewid) {
      throw new ApiError(400, "Review ID is required");
    }

    const review = await TradizionsReviewModel.findByPk(reviewid);

    if (!review) {
      throw new ApiError(400, "Review not found");
    }

    await review.update({
      isActive: isActive,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Review update successfully"));
  } catch (error) {
    throw error;
  }
});

// -------------------- Home Product --------------------

export const getMerchantDashboardCounts = asyncHandler(async (req, res) => {
  try {
    const { bid } = req.body;
    if (!bid) throw new ApiError(400, "Business id is required");

    const [totalProducts, totalOrders] = await Promise.all([
      await ProductModel.count({
        where: {
          bid: bid,
        },
      }),
      await OrderItemModel.count({
        where: {
          bid: bid,
        },
      }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        totalproducts: totalProducts,
        totalorders: totalOrders,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getProductStocks = asyncHandler(async (req, res) => {
  try {
    const { bid } = req.body;

    const attributes = [
      "productid",
      "bid",
      "productname",
      "productimage",
      "availablestock",
      "price",
      "sellingprice",
    ];

    const [inStockProducts, lowStockProducts, outofstockProdcuts] =
      await Promise.all([
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: {
              [Op.gt]: 10,
            },
          },
          attributes: attributes,
        }),
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: {
              [Op.gt]: 0,
              [Op.lte]: 10,
            },
          },
          attributes: attributes,
        }),
        await ProductModel.findAll({
          where: {
            bid: bid,
            availablestock: 0,
          },
          attributes: attributes,
        }),
      ]);

    return res.status(200).json(
      new ApiResponse(200, {
        instock: inStockProducts,
        lowstock: lowStockProducts,
        outofstock: outofstockProdcuts,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const updateProductStock = asyncHandler(async (req, res) => {
  try {
    const { productid, bid, availablestock } = req.body;
    if (!productid || !bid || !availablestock) {
      throw new ApiError(400, "Product id, business id and stock is required");
    }

    const product = await ProductModel.findOne({
      where: {
        productid: productid,
        bid: bid,
      },
    });

    if (!product) throw new ApiError(400, "Product not found");
    await product.update({
      availablestock: availablestock,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Stock updated successfully"));
  } catch (error) {
    throw error;
  }
});

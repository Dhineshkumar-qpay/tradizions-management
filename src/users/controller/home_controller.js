import { Json } from "sequelize/lib/utils";
import { AuthModel } from "../../model/auth_model.js";
import { BannerModel } from "../../model/banner_model.js";
import { CategoryModel } from "../../model/category_model.js";
import { FavouriteProductModel } from "../../model/favourite_model.js";
import {
  GiftModel,
  ProductImagesModel,
  ProductModel,
  ProductReviewModel,
} from "../../model/product_gift_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Op } from "sequelize";

export const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const {
      categoryid,
      subcategoryid,
      weight,
      pricerange,
      sortby,
      page = 1,
      limit = 20,
    } = req.body;

    const whereCondition = {
      isActive: true,
    };

    if (categoryid) {
      whereCondition.categoryid = categoryid;
    }

    if (subcategoryid) {
      whereCondition.subcategoryid = subcategoryid;
    }

    if (weight) {
      whereCondition.weight = weight;
    }

    if (pricerange) {
      switch (pricerange) {
        case "0-500":
          whereCondition.sellingprice = {
            [Op.between]: [0, 500],
          };
          break;

        case "500-1000":
          whereCondition.sellingprice = {
            [Op.between]: [500, 1000],
          };
          break;

        case "1000-1500":
          whereCondition.sellingprice = {
            [Op.between]: [1000, 1500],
          };
          break;

        case "above-1500":
          whereCondition.sellingprice = {
            [Op.gt]: 1500,
          };
          break;

        default:
          break;
      }
    }

    let order = [["productid", "DESC"]];

    switch (sortby) {
      case "price-low-high":
        order = [["sellingprice", "ASC"]];
        break;

      case "price-high-low":
        order = [["sellingprice", "DESC"]];
        break;

      default:
        break;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductModel.findAndCountAll({
      where: whereCondition,
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order,
      limit: Number(limit),
      offset: Number(offset),
    });

    if (!rows.length) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totalProducts: 0,
            totalPages: 0,
            currentPage: Number(page),
            products: [],
          },
          "No products found",
        ),
      );
    }

    return res.status(200).json(
      new ApiResponse(200, {
        totalProducts: count,
        totalPages: Math.ceil(count / limit),
        currentPage: Number(page),
        products: rows,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getProductDetail = asyncHandler(async (req, res) => {
  const { productid } = req.body;

  if (!productid) throw new ApiError(400, "productid is required");

  // const userid = req.user?.userid;
  const [productDetail, productImages, productReviews, isFavourite] =
    await Promise.all([
      ProductModel.findByPk(productid),

      ProductImagesModel.findOne({
        where: { productid },
      }),

      ProductReviewModel.findAll({
        where: { productid, status: "active" },
      }),
      // FavouriteProductModel.findOne({
      //   where: { userid, productid },
      // }),
    ]);

  if (!productDetail) throw new ApiError(400, "product not found");

  const totalRating = productReviews.reduce(
    (sum, item) => sum + (item.rating || 0),
    0,
  );

  const avgRating = productReviews.length
    ? (totalRating / productReviews.length).toFixed(1)
    : 0;

  const updatedProductDetail = {
    ...productDetail.toJSON(),
    image1: productImages?.image1 ?? null,
    image2: productImages?.image2 ?? null,
    image3: productImages?.image3 ?? null,
    image4: productImages?.image4 ?? null,
    isfavourite: isFavourite ? true : false,
  };

  const updatedProductReviews = productReviews.map((review) => {
    const data = review.toJSON();
    return {
      reviewid: data.reviewid,
      productid: data.productid,
      rating: data.rating || 0.0,
      review: data.review || null,
      userid: data.userid,
      title: data.title || null,
      name: data.name || null,
      createdAt: data.createdAt,
    };
  });

  const updatedData = {
    productdetail: updatedProductDetail,
    reviews: updatedProductReviews,
    avgrating: avgRating || "0.0",
    totalreviews: productReviews.length,
  };

  return res.status(200).json(new ApiResponse(200, updatedData));
});

// ---------------------------Gift Detail ---------------------------

export const getAllGifts = asyncHandler(async (req, res) => {
  try {
    const gifts = await GiftModel.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    return res.status(200).json(new ApiResponse(200, gifts));
  } catch (error) {
    throw error;
  }
});

export const giftDetails = asyncHandler(async (req, res) => {
  const { giftid } = req.body;
  if (!giftid) throw new ApiError(400, "giftid is required");

  const gift = await GiftModel.findOne({
    where: { giftid },
  });

  const updatedGiftData = {
    ...gift.toJSON(),
    productlist: JSON.parse(gift.productlist) || [],
  };

  return res
    .status(200)
    .json(new ApiResponse(200, updatedGiftData || "Gift not found"));
});

// --------------------------- Reviews ---------------------------

export const addProductRating = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const { review, rating, productid, title, email, name } = req.body;

    const existingReview = await ProductReviewModel.findOne({
      where: {
        userid,
        productid,
      },
    });
    if (existingReview) {
      await existingReview.update({
        review,
        rating,
        title,
        email,
        name,
      });
    } else {
      await ProductReviewModel.create({
        review,
        rating,
        userid,
        productid,
        title,
        email,
        name,
      });
    }
    return res.status(200).json(new ApiResponse(200, "rating submitted"));
  } catch (error) {
    throw error;
  }
});

export const deleteRating = asyncHandler(async (req, res) => {
  try {
    const { userid, productid } = req.body;
    const review = await ProductReviewModel.findOne({
      where: {
        userid,
        productid,
      },
    });
    if (!review) {
      throw new ApiError(400, "Review not found");
    }
    await review.destroy();
    return res.status(200).json(new ApiResponse(200, "Review deleted"));
  } catch (error) {
    throw error;
  }
});

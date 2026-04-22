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

export const getAllProducts = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    let { page = 1 } = req.body;

    const limit = 30;

    page = parseInt(page) || 1;

    const offset = (page - 1) * limit;

    const { count, rows } = await ProductModel.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["specs", "createdAt", "updatedAt"],
      },
    });

    const updatedProducts = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();
        const reviews = await ProductReviewModel.findAll({
          where: { productid: productData.productid },
        });

        const totalRating = reviews.reduce(
          (sum, item) => sum + (item.rating || 0),
          0,
        );

        const avgRating = reviews.length
          ? (totalRating / reviews.length).toFixed(1)
          : "0.0";

        const isFavourite = await FavouriteProductModel.findOne({
          where: { userid, productid: productData.productid },
        });

        return {
          ...productData,
          averagerating: avgRating,
          isfavourite: isFavourite ? true : false,
        };
      }),
    );

    return res.status(200).json(
      new ApiResponse(200, {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count,
        hasMore: page * limit < count,
        products: updatedProducts,
      }),
    );
  } catch (error) {
    throw error;
  }
});

export const getProductDetail = asyncHandler(async (req, res) => {
  const { productid } = req.body;

  if (!productid) throw new ApiError(400, "productid is required");

  const userid = req.user?.userid;
  const [productDetail, productImages, productReviews, isFavourite] =
    await Promise.all([
      ProductModel.findByPk(productid),

      ProductImagesModel.findOne({
        where: { productid },
      }),

      ProductReviewModel.findAll({
        where: { productid },
        include: [
          {
            model: AuthModel,
            as: "user",
            attributes: ["username"],
          },
        ],
      }),
      FavouriteProductModel.findOne({
        where: { userid, productid },
      }),
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
    specs: productDetail.specs ? JSON.parse(productDetail.specs) : [],
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
      username: data.user.username || null,
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

    const { review, rating, productid } = req.body;

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
      });
    } else {
      await ProductReviewModel.create({
        review,
        rating,
        userid,
        productid,
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

// --------------------------- Category ---------------------------

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
      attributes: {
        exclude: ["specs", "createdAt", "updatedAt"],
      },
    });

    const userid = req.user?.userid;
    const updatedProducts = await Promise.all(
      rows.map(async (product) => {
        const productData = product.toJSON();
        const isFavourite = await FavouriteProductModel.findOne({
          where: { userid, productid: productData.productid },
        });
        return {
          ...productData,
          isfavourite: isFavourite ? true : false,
        };
      }),
    );

    return res.status(200).json(
      new ApiResponse(200, {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalProducts: count,
        hasMore: page * limit < count,
        products: updatedProducts,
      }),
    );
  } catch (error) {
    throw error;
  }
});

// --------------------------- Banners ---------------------------

export const getAllBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await BannerModel.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(new ApiResponse(200, banners));
  } catch (error) {
    throw error;
  }
});

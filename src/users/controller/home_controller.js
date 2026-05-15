import { Json } from "sequelize/lib/utils";
import { AuthModel } from "../../model/auth_model.js";
import { BannerModel } from "../../model/banner_model.js";
import { CategoryModel } from "../../model/category_model.js";
import { FavouriteProductModel } from "../../model/favourite_model.js";
import {
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
      itemtype = "",
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

    if (itemtype) {
      whereCondition.itemtype = itemtype;
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
      isActive: true,
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
      ProductModel.findOne({
        where: { productid, itemtype: "product" },
      }),

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
    const gifts = await ProductModel.findAll({
      where: { itemtype: "gift" },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const formattedGifts = gifts.map((gift) => {
      const data = gift.toJSON();
      let parsedProductList = data.productlist;
      if (typeof parsedProductList === "string") {
        try {
          parsedProductList = JSON.parse(parsedProductList);
        } catch (e) {
          parsedProductList = [];
        }
      }
      return {
        giftid: data.productid,
        bid: data.bid,
        giftname: data.productname,
        giftimage: data.productimage,
        categoryid: data.categoryid,
        categoryname: data.categoryname,
        subcategoryid: data.subcategoryid,
        subcategoryname: data.subcategoryname,
        giftdescription: data.description,
        productlist: parsedProductList || [],
        giftprice: data.price,
        giftsellingprice: data.sellingprice,
        stock: data.availablestock,
        packingtype: data.packingtype,
      };
    });

    return res.status(200).json(new ApiResponse(200, formattedGifts));
  } catch (error) {
    throw error;
  }
});

export const giftDetails = asyncHandler(async (req, res) => {
  const { giftid } = req.body;
  if (!giftid) {
    throw new ApiError(400, "giftid is required");
  }

  const parsedGiftId = Number(giftid);

  if (isNaN(parsedGiftId)) {
    throw new ApiError(400, "Invalid giftid");
  }

  const [gift, giftImages, productReviews] = await Promise.all([
    ProductModel.findOne({
      where: {
        productid: parsedGiftId,
        itemtype: "gift",
      },
    }),

    ProductImagesModel.findOne({
      where: {
        productid: parsedGiftId,
      },
    }),

    ProductReviewModel.findAll({
      where: {
        productid: parsedGiftId,
        status: "active",
      },

      order: [["createdAt", "DESC"]],
    }),
  ]);

  if (!gift) {
    throw new ApiError(404, "Gift not found");
  }

  const giftData = gift.toJSON();

  let parsedProductList = [];

  try {
    parsedProductList =
      typeof giftData.productlist === "string"
        ? JSON.parse(giftData.productlist)
        : giftData.productlist || [];
  } catch (error) {
    parsedProductList = [];
  }

  const totalRating = productReviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  );

  const averageRating = productReviews.length
    ? (totalRating / productReviews.length).toFixed(1)
    : "0.0";

  const discount =
    giftData.sellingprice > 0 &&
    giftData.price > 0 &&
    giftData.price > giftData.sellingprice
      ? Math.round(
          ((giftData.price - gift.sellingprice) / giftData.price) * 100,
        )
      : 0;

  const formattedReviews = productReviews.map((review) => {
    const reviewData = review.toJSON();
    return {
      reviewid: reviewData.reviewid,
      productid: reviewData.productid,
      userid: reviewData.userid,
      name: reviewData.name || null,
      title: reviewData.title || null,
      review: reviewData.review || null,
      rating: Number(reviewData.rating || 0),
      createdAt: reviewData.createdAt,
    };
  });

  const formattedGiftData = {
    giftid: giftData.productid,
    bid: giftData.bid,
    giftname: giftData.productname,
    giftimage: giftData.productimage,
    categoryid: giftData.categoryid,
    categoryname: giftData.categoryname,
    subcategoryid: giftData.subcategoryid,
    subcategoryname: giftData.subcategoryname,
    giftdescription: giftData.description,
    productlist: parsedProductList,
    giftprice: giftData.price,
    giftsellingprice: giftData.sellingprice,
    stock: giftData.availablestock,
    packingtype: giftData.packingtype,
    discount: discount,
    isFavourite: giftData.isFavourite,
    image1: giftImages?.image1 || null,
    image2: giftImages?.image2 || null,
    image3: giftImages?.image3 || null,
    image4: giftImages?.image4 || null,
  };

  return res.status(200).json(
    new ApiResponse(200, {
      giftdetail: formattedGiftData,
      reviews: formattedReviews,
      avgrating: averageRating,
      totalreviews: productReviews.length,
    }),
  );
});

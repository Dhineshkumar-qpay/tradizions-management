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

/* ---------------- Home Products ------------------ */

export const getHomeProducts = asyncHandler(async (req, res) => {
  const attributes = [
    "productid",
    "bid",
    "productimage",
    "productname",
    "categoryid",
    "subcategoryid",
    "price",
    "availablestock",
    "sellingprice",
    "isFavourite",
  ];
  try {
    const [featuredProducts, newArrivalProducts, giftHampers, poojaHampers] =
      await Promise.all([
        ProductModel.findAll({
          where: {
            isFeatured: true,
            itemtype: "product",
          },
          order: [["createdAt", "DESC"]],
          attributes: attributes,
          limit: 10,
        }),

        ProductModel.findAll({
          where: {
            itemtype: "product",
          },
          order: [["createdAt", "DESC"]],
          attributes: attributes,
          limit: 10,
        }),

        ProductModel.findAll({
          where: {
            itemtype: "gift",
            gifttype: "nuts",
          },
          order: [["createdAt", "DESC"]],
          attributes: attributes,
          limit: 10,
        }),

        ProductModel.findAll({
          where: {
            itemtype: "gift",
            gifttype: "pooja",
          },
          order: [["createdAt", "DESC"]],
          attributes: attributes,
          limit: 10,
        }),
      ]);

    const updatedHomeProducts = {
      featured: featuredProducts,
      newarrivals: newArrivalProducts,
      gifthampers: giftHampers,
      poojahampers: poojaHampers,
    };

    return res.status(200).json(new ApiResponse(200, updatedHomeProducts));
  } catch (error) {
    throw error;
  }
});

export const searchProducts = asyncHandler(async (req, res) => {
  try {
    const { search } = req.body;

    if (!search) {
      return res.status(200).json(new ApiResponse(200, []));
    }

    const products = await ProductModel.findAll({
      where: {
        [Op.or]: [
          {
            productname: {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      },
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
      ],
      limit: 10,
    });

    return res.status(200).json(new ApiResponse(200, products));
  } catch (error) {
    throw error;
  }
});

/* ---------------- Contact Us ------------------ */

export const addNormalContactUs = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, description } = req.body;

    if (!name || !email || !phone || !description) {
      throw new ApiError(400, "All fields are required");
    }

    const contactUs = await ContactUsModel.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone,
      description: description.trim(),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Message sent successfully"));
  } catch (error) {
    throw error;
  }
});

export const getNormalContactUs = asyncHandler(async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) throw new ApiError(400, "Type is required");
    const contactUs = await ContactUsModel.findAll({
      where: {
        type: type,
      },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(new ApiResponse(200, contactUs));
  } catch (error) {
    throw error;
  }
});

export const deleteContactUs = asyncHandler(async (req, res) => {
  try {
    const { contactid } = req.body;

    const contactUs = await ContactUsModel.destroy({
      where: {
        contactid: contactid,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Message deleted successfully"));
  } catch (error) {
    throw error;
  }
});

export const addCorporateContactUs = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, description, quantity } = req.body;

    if (!name || !email || !phone || !description) {
      throw new ApiError(400, "All fields are required");
    }

    const contactUs = await ContactUsModel.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone,
      description: description.trim(),
      type: "corporate",
      quantity: quantity,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Message sent successfully"));
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

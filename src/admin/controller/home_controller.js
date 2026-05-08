import { where } from "sequelize";
import { ThinamOruKuralModel } from "../../model/home_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  ProductImagesModel,
  ProductModel,
} from "../../model/product_gift_model.js";

export const addThinamoruKural = asyncHandler(async (req, res) => {
  try {
    const { kural, meaning, kuralid } = req.body;

    if (!kural || !meaning) {
      throw new ApiError(400, "All fields are required");
    }

    if (kuralid) {
      const existingKural = await ThinamOruKuralModel.findByPk(kuralid);

      if (!existingKural) {
        throw new ApiError(400, "Invalid Kural ID");
      }

      await existingKural.update({
        kural: kural.trim(),
        meaning: meaning.trim(),
      });

      return res
        .status(200)
        .json(new ApiResponse(200, "Kural Updated Successfully"));
    }

    const newKural = await ThinamOruKuralModel.create({
      kural: kural.trim(),
      meaning: meaning.trim(),
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Kural Added Successfully"));
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
  try {
    const [featuredProducts, newArrivalProducts] = await Promise.all([
      await ProductModel.findAll({
        where: {
          isFeatured: true,
        },
        limit: 10,
      }),
      await ProductModel.findAll({
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
    ]);

    const updatedHomeProduts = {
      featured: featuredProducts,
      newArrivals: newArrivalProducts,
    };

    return res.status(200).json(new ApiResponse(200, updatedHomeProduts));
  } catch (error) {
    throw error;
  }
});

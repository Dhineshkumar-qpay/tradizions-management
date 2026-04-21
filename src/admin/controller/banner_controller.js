import { BannerModel } from "../../model/banner_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import fs from "fs";

export const addBanner = asyncHandler(async (req, res) => {
  try {
    const { bannername, description } = req.body;
    const bannerimage = req.file
      ? `/${req.file.path.replace(/\\/g, "/")}`
      : null;

    if (!bannername || !bannerimage) {
      throw new ApiError(400, "Banner name and image are required");
    }

    const banner = await BannerModel.create({
      bannername,
      description,
      bannerimage,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, banner, "Banner added successfully"));
  } catch (error) {
    throw error;
  }
});

export const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const { bannerid } = req.body;

    if (!bannerid) {
      throw new ApiError(400, "Banner ID is required");
    }

    const banner = await BannerModel.findByPk(bannerid);

    if (!banner) {
      throw new ApiError(404, "Banner not found");
    }

    const imagePath = banner.bannerimage;
    if (imagePath && imagePath.startsWith("/uploads")) {
      const fullPath = `.${imagePath}`;
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await banner.destroy();

    return res
      .status(200)
      .json(new ApiResponse(200, "Banner deleted successfully"));
  } catch (error) {
    throw error;
  }
});

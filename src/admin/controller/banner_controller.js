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
      .status(200)
      .json(new ApiResponse(200, "Banner added successfully"));
  } catch (error) {
    throw error;
  }
});


export const updateBanner = asyncHandler(async (req, res) => {
  const { bannerid, bannername, description } = req.body;

  if (!bannerid) {
    throw new ApiError(400, "Banner ID is required");
  }

  const banner = await BannerModel.findOne({
    where: { bannerid },
  });

  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  let bannerimage = banner.bannerimage;

  if (req.file) {
    if (banner.bannerimage) {
      const oldPath = banner.bannerimage.startsWith("/")
        ? banner.bannerimage.substring(1)
        : banner.bannerimage;

      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (error) {
        console.error("Failed to delete old banner image:", error);
      }
    }

    bannerimage = `/${req.file.path.replace(/\\/g, "/")}`;
  }

  await banner.update({
    bannername: bannername ?? banner.bannername,
    description: description ?? banner.description,
    bannerimage,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Banner updated successfully"));
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

export const updateBannerStatus = asyncHandler(async (req, res) => {
  try {
    const { bannerid, status } = req.body;

    if (!bannerid) {
      throw new ApiError(400, "Banner ID is required");
    }

    const banner = await BannerModel.findByPk(bannerid);

    if (!banner) {
      throw new ApiError(404, "Banner not found");
    }

    await banner.update({ status: status });

    return res
      .status(200)
      .json(new ApiResponse(200, "Banner status updated successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await BannerModel.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    return res.status(200).json(new ApiResponse(200, banners));
  } catch (error) {
    throw error;
  }
});

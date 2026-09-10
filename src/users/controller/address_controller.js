import { AddressModel } from "../../model/address_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addAddress = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    if (!userid) {
      throw new ApiError(401, "User not authenticated");
    }

    const { addressid } = req.body;

    let data;

    if (addressid) {
      data = await AddressModel.findOne({
        where: {
          addressid,
          userid,
        },
      });

      if (!data) {
        throw new ApiError(404, "Address not found");
      }

      await data.update(req.body);

      return res
        .status(200)
        .json(new ApiResponse(200, "Address updated successfully", data));
    }

    data = await AddressModel.create({
      ...req.body,
      userid,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Address created successfully", data));
  } catch (error) {
    throw error;
  }
});

export const deleteAddress = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { addressid } = req.body;

    if (!addressid) {
      throw new ApiError(400, "Address ID is required");
    }

    const existingAddress = await AddressModel.findOne({
      where: {
        userid,
        addressid,
      },
    });

    if (!existingAddress) {
      throw new ApiError(404, "Address not found");
    }

    await existingAddress.destroy();

    return res
      .status(200)
      .json(new ApiResponse(200, "Address deleted successfully"));
  } catch (error) {
    throw error;
  }
});

export const getAllAddress = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;

    const addresses = await AddressModel.findAll({
      where: {
        userid,
      },
    });

    return res.status(200).json(new ApiResponse(200, addresses));
  } catch (error) {
    throw error;
  }
});

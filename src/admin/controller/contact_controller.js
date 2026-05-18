import { ContactUsModel } from "../../model/home_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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

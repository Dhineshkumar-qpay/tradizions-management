import { AuthModel } from "../../model/auth_model.js";
import { sendOTPEmail } from "../../../config/mailer.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { current } from "../../../config/config.js";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import { where } from "sequelize";

export const sendOTP = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new ApiError(400, "Mobile number is required");
    }

    const otp = "123456";
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user = await AuthModel.findOne({
      where: { phone: phone },
    });

    if (user) {
      await user.update({
        otp: otp,
        otp_expires_at: otpExpiresAt,
      });
    } else {
      user = await AuthModel.create({
        phone: phone,
        otp: otp,
        otp_expires_at: otpExpiresAt,
        role: "user",
      });
    }

    return res.status(200).json(new ApiResponse(200, "OTP sent successfully"));
  } catch (error) {
    throw error;
  }
});

export const verifyOTP = asyncHandler(async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new ApiError(400, "Phone and OTP are required");
    }

    const user = await AuthModel.findOne({
      where: { phone: phone, role: "user" },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.otp || user.otp !== String(otp)) {
      throw new ApiError(400, "Invalid OTP");
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      throw new ApiError(400, "OTP has expired");
    }

    await user.update({
      otp: null,
      otp_expires_at: null,
    });

    const token = jwt.sign(
      {
        userid: user.userid,
        role: user.role,
      },
      current.jwtSecret,
      {
        expiresIn: "10d",
      },
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          userid: user.userid,
          role: user.role,
          token: token,
        },
        "User login successful",
      ),
    );
  } catch (error) {
    throw error;
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  const userid = req.user?.userid;

  if (!userid) {
    throw new ApiError(401, "User ID not found in token");
  }

  const user = await AuthModel.findByPk(userid, {
    attributes: {
      exclude: ["otp", "otp_expires_at", "createdAt", "updatedAt", "role"],
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { username, email } = req.body;

    if (!username && !email) {
      throw new ApiError(400, "At least one field is required for update");
    }

    if (!userid) {
      throw new ApiError(401, "User ID not found in token");
    }

    const user = await AuthModel.findByPk(userid);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Profile updated successfully"));
  } catch (error) {
    throw error;
  }
});

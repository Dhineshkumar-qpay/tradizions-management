import { current } from "../../../config/config.js";
import { AuthModel } from "../../model/auth_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const sendAdminOTP = asyncHandler(async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new ApiError(400, "Mobile number is required");
    }

    if (phone !== "9876543210") {
      throw new ApiError(403, "Not authorized as admin");
    }

    const otp = "540148";
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let admin = await AuthModel.findOne({
      where: { phone: phone },
    });

    if (admin) {
      await admin.update({
        otp: otp,
        otp_expires_at: otpExpiresAt,
      });
    } else {
      admin = await AuthModel.create({
        phone: phone,
        otp: otp,
        otp_expires_at: otpExpiresAt,
        role: "admin",
      });
    }

    return res.status(200).json(new ApiResponse(200, "OTP sent successfully"));
  } catch (error) {
    throw error;
  }
});

export const verifyAdminOTP = asyncHandler(async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new ApiError(400, "Phone and OTP are required");
    }

    const user = await AuthModel.findOne({
      where: { phone: phone },
    });

    if (!user) {
      throw new ApiError(404, "Admin not found");
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
        "Admin login successful",
      ),
    );
  } catch (error) {
    throw error;
  }
});

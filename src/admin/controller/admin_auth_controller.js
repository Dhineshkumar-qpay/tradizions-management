import { current } from "../../../config/config.js";
import { AuthModel } from "../../model/auth_model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const sendAdminOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (email !== "admin@gmail.com") {
    throw new ApiError(403, "Not authorized as admin");
  }

  const otp = "540148";
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  let admin = await AuthModel.findOne({ where: { email } });

  if (admin) {
    admin.otp = otp;
    admin.otp_expires_at = otpExpiresAt;
    await admin.save();
  } else {
    admin = await AuthModel.create({
      email,
      otp,
      otp_expires_at: otpExpiresAt,
      role: "admin",
    });
  }

  return res.status(200).json(new ApiResponse(200, "Admin OTP successfully"));
});

export const verifyAdminOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await AuthModel.findOne({ where: { email } });

  if (!user) throw new ApiError(404, "User not found");

  if (user.otp === null || user.otp !== `${otp}`) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
    throw new ApiError(400, "OTP has expired");
  }

  user.otp = null;
  user.otp_expires_at = null;
  await user.save();

  const token = jwt.sign(
    { userid: user.userid, role: user.role },
    current.jwtSecret,
    { expiresIn: "10d" },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userid: user.userid,
        token,
      },
      "Login successfully",
    ),
  );
});

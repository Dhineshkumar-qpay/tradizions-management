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
  const email = req.body?.email?.trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const otp = otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  let user = await AuthModel.findOne({ where: { email } });

  if (user) {
    user.otp = parseInt(otp);
    user.otp_expires_at = otpExpiresAt;
    await user.save();
  } else {
    user = await AuthModel.create({
      email,
      otp: parseInt(otp),
      otp_expires_at: otpExpiresAt,
      role: "user",
    });
  }

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to send OTP email");
  }

  return res.status(200).json(new ApiResponse(200, "OTP sent successfully"));
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const otp = req.body?.otp?.toString().trim();

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await AuthModel.findOne({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.otp === null || `${user.otp}` !== `${otp}`) {
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

export const updateName = asyncHandler(async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { firstname, lastname } = req.body;

    const userUpdate = await AuthModel.update(
      {
        username: `${firstname} ${lastname}`,
      },
      {
        where: { userid: userid },
      },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, "Name updated successfully"));
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
  const userid = req.user?.userid;
  const { username, phone, fcmToken } = req.body;

  if (!userid) {
    throw new ApiError(401, "User ID not found in token");
  }

  const user = await AuthModel.findByPk(userid);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (username) user.username = username;
  if (phone) user.phone = phone;
  if (fcmToken) user.fcmToken = fcmToken;

  if (req.file) {
    user.profileimage = req.file.path.replace(/\\/g, "/");
  }

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully"));
});

import { AuthModel, NewsLetterModel } from "../../model/auth_model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { current } from "../../../config/config.js";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import { where, Op } from "sequelize";
import { sendOTPEmail } from "../../../config/mailer.js";



export const sendOTP = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const ADMIN_EMAIL = "admin@gmail.com";
    const ADMIN_OTP = "540148";

    const isAdmin = normalizedEmail === ADMIN_EMAIL;

    // Admin -> fixed OTP
    // User -> random OTP
    const otp = isAdmin
      ? ADMIN_OTP
      : Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Find existing user
    let user = await AuthModel.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (user) {
      await user.update({
        otp,
        otp_expires_at: otpExpiresAt,
        ...(isAdmin ? { role: "admin" } : { role: user.role }),
      });
    } else {
      user = await AuthModel.create({
        email: normalizedEmail,
        otp,
        otp_expires_at: otpExpiresAt,
        role: isAdmin ? "admin" : "user",
      });
    }

    if (!isAdmin) {
      await sendOTPEmail(normalizedEmail, otp);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "OTP sent successfully"));
  } catch (error) {
    throw error;
  }
});



export const verifyOTP = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await AuthModel.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.status === "inactive") {
      throw new ApiError(
        403,
        "Your account is inactive. Please contact support.",
      );
    }

    // Check OTP
    if (!user.otp || user.otp !== String(otp)) {
      throw new ApiError(400, "Invalid OTP");
    }

    // Check OTP expiry
    if (
      user.otp_expires_at &&
      new Date() > new Date(user.otp_expires_at)
    ) {
      throw new ApiError(400, "OTP has expired");
    }

    // Clear OTP after successful verification
    await user.update({
      otp: null,
      otp_expires_at: null,
    });

    // Create JWT token
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
      new ApiResponse(200, {
        userid: user.userid,
        token: token,
        role: user.role,
      }),
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

export const addToNewsletter = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const existingEmail = await NewsLetterModel.findOne({
      where: { email: email },
    });

    if (existingEmail) {
      throw new ApiError(400, "Email already subscribed");
    }

    await NewsLetterModel.create({
      email: email,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "Email added to newsletter successfully"));
  } catch (error) {
    throw error;
  }
});


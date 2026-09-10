import jwt from "jsonwebtoken";
import { current } from "../../config/config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthModel } from "../model/auth_model.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Token missing or invalid");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Token is required");
  }

  try {
    const decoded = jwt.verify(token, current.jwtSecret);

    if (!decoded?.userid) {
      throw new ApiError(401, "Invalid token payload");
    }

    const existingUser = await AuthModel.findByPk(decoded.userid);

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    if (existingUser.status === "inactive") {
      throw new ApiError(
        403,
        "Your account is inactive. Please contact support.",
      );
    }

    req.user = existingUser;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired. Please login again.");
    }

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }

    throw new ApiError(500, "Authentication failed");
  }
});

export const adminOnly = (req, res, next) => {
  if (req.user && req.user?.role === "admin") {
    next();
  } else {
    throw new ApiError(403, "Access denied: Admin only");
  }
};

export const userOnly = (req, res, next) => {
  if (req.user && req.user?.role === "user") {
    next();
  } else {
    throw new ApiError(403, "Access denied: User only");
  }
};

export const adminAndUser = (req, res, next) => {
  if (
    req.user &&
    (req.user?.role === "admin" ||
      req.user?.role === "merchant" ||
      req.user?.role === "user")
  ) {
    next();
  } else {
    throw new ApiError(403, "Access denied: Admin and User only");
  }
};

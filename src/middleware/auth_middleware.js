import jwt from "jsonwebtoken";
import { current } from "../../config/config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Token missing or invalid");
  }

  const token = authHeader.split(" ")[1];

  if (!token) throw new ApiError(403, "Token is required");

  try {
    const decoded = jwt.verify(token, current.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid token");
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
    (req.user?.role === "admin" || req.user?.role === "user")
  ) {
    next();
  } else {
    throw new ApiError(
      403,
      "Access denied: Admin and User only"
    );
  }
};
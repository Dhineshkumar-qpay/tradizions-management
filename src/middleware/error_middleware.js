import { ApiError } from "../utils/ApiError.js";
import { mode } from "../../config/config.js";
import { ValidationError } from "sequelize";

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      statusCode: 400,
      status: false,
      message: err.errors[0].message,
    });
  }
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = mode === "production" ? "Internal Server Error" : err.message;
  }

  const response = {
    statusCode,
    message: err.message || message,
    status: false,
    ...(err.errors ? { errors: err.errors } : {}),
  };

  res.status(statusCode).json(response);
};

export { errorMiddleware };

import { ApiError } from "../utils/ApiError.js";
import { mode } from "../../config/config.js";

const errorMiddleware = (err, req, res, next) => {
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

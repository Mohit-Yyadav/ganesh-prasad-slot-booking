/**
 * Small helper so controllers can throw a clean, user-facing error.
 * Usage: throw new AppError("This slot has already been allotted.", 409)
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function notFound(req, res, next) {
  next(new AppError("The requested resource was not found.", 404));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : "Something went wrong. Please try again.";

  // Duplicate key error (e.g. unique index race) -> friendly message
  if (err.code === 11000) {
    statusCode = 409;
    if (err.keyPattern && err.keyPattern.date && err.keyPattern.session) {
      message = "This slot has already been allotted. Please select another slot.";
    } else if (err.keyPattern && err.keyPattern.applicationId) {
      message = "Could not generate a unique application ID. Please try again.";
    } else {
      message = "This record already exists.";
    }
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid request. Please check the information provided.";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({ message });
}

module.exports = { AppError, notFound, errorHandler };

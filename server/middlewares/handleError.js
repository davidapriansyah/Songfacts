const errorHandler = (error, req, res, next) => {
  console.log(error);

  let status = 500;
  let message = "Internal server error";
  console.log(error);
  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError"
  ) {
    status = 400;
    message = error.errors[0].message;
  }

  if (error.name === "UniqueFav") {
    status = 400;
    message = "Song already exists";
  }

  if (error.name === "BadRequestEmail") {
    status = 400;
    message = "Email is required";
  }

  if (error.name === "BadRequestPassword") {
    status = 400;
    message = "Password is required";
  }

  if (error.name === "Unauthorized") {
    status = 401;
    message = "Invalid email/password";
  }

  if (error.name === "Unauthorized" || error.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  }

  if (error.name === "Forbidden") {
    status = 403;
    message = "You are not authorized";
  }

  if (error.name === "NotFound") {
    status = 404;
    message = "Data not found";
  }

  res.status(status).json({
    message,
  });
};

module.exports = errorHandler;

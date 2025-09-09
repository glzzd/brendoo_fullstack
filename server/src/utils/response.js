// Standard API response format
class ApiResponse {
  constructor(success, message, data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  // Success response
  static success(message, data = null, statusCode = 200) {
    return new ApiResponse(true, message, data, statusCode);
  }

  // Error response
  static error(message, statusCode = 500, data = null) {
    return new ApiResponse(false, message, data, statusCode);
  }

  // Send response
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      ...(this.data && { data: this.data }),
      timestamp: this.timestamp
    });
  }
}

// Helper functions for common responses
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return ApiResponse.success(message, data, statusCode).send(res);
};

const sendError = (res, message, statusCode = 500, data = null) => {
  return ApiResponse.error(message, statusCode, data).send(res);
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError,
  sendValidationError
};
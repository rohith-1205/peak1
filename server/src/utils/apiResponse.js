class ApiResponse {
  static success(res, data = null, message = 'Operation successful', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'An error occurred', statusCode = 500, errorCode = 'SERVER_ERROR', errors = null) {
    const response = {
      success: false,
      message,
      errorCode
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;

class ApiResponse {
  constructor(statusCode, data = null) {
    this.statusCode = statusCode;
    if (data !== null) {
      this.data = data;
    }
  }
}

export { ApiResponse };

class ApiResponse {
  constructor(statusCode, data = null) {
    this.statusCode = statusCode;
    this.data = data;
  }
}

export { ApiResponse };

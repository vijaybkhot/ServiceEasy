class CustomError extends Error {
  constructor({message, statusCode, pageToRender}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.pageToRender = pageToRender || 'globalError';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;

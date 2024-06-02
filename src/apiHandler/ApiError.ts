import { FastifyReply } from 'fastify';
import { ERROR_CODE } from '../constant';

/**
 * Creates a new ApiError instance.
 * @param {number} statusCode - The HTTP status code of the error.
 * @param {string} message - The error message.
 */
export default class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;

    // Store the stack trace in the 'stack' property
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleApiError = (reply: FastifyReply, error: any) => {
  if (error instanceof ApiError) {
    return reply.status(error.statusCode || ERROR_CODE.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: error.message,
    });
  } else {
    return reply.status(ERROR_CODE.INTERNAL_SERVER_ERROR).send({
      success: false,
      message: error.message || 'Internal server error.',
    });
  }
};

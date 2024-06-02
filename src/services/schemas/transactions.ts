import { FastifySchema } from 'fastify';

// Schema for sending a transaction
const sendTransaction: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      toAddress: { type: 'string' },
      accountId: { type: 'string' },
    },
    required: ['amount', 'toAddress', 'accountId'], // Required fields for sending a transaction
  },
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }, // Authorization header with the token
    },
    required: ['authorization'], // Authorization header is required
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Schema for withdrawing a transaction
const withdrawTransaction: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0.01 }, // Amount to withdraw, must be at least 0.01
      accountId: { type: 'string' }, // Account ID from which to withdraw
    },
    required: ['amount', 'accountId'], // Required fields for withdrawing a transaction
  },
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' },
    },
    required: ['authorization'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

// Export schemas for use in route definitions
export { sendTransaction, withdrawTransaction };

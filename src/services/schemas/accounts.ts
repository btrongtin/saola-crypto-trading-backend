import { FastifySchema } from 'fastify';

// Schema for user registration
const registerUser: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      accounts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            balance: { type: 'number', default: 0 },
          },
          required: ['type'],
        },
      },
    },
    required: ['email', 'password'],
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

// Schema for user login
const loginUser: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
    required: ['email', 'password'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  },
};

// Schema for getting user accounts
const getUserAccounts: FastifySchema = {
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
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              balance: { type: 'number' },
              userId: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

// Schema for getting transactions of a specific account
const getAccountTransactions: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' },
    },
    required: ['authorization'],
  },
  params: {
    type: 'object',
    properties: {
      accountId: { type: 'string' },
    },
    required: ['accountId'],
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              toAddress: { type: 'string' },
              currency: { type: 'string' },
              status: { type: 'string' },
              type: { type: 'string' },
              accountId: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

// Export schemas for use in route definitions
export { registerUser, loginUser, getUserAccounts, getAccountTransactions };

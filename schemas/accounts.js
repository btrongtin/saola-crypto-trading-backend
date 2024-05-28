const registerUser = {
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

const loginUser = {
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

const getUserAccounts = {
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

const getAccountTransactions = {
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

export { registerUser, loginUser, getUserAccounts, getAccountTransactions };

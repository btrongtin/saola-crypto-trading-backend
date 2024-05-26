const sendTransaction = {
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      toAddress: { type: 'string' },
      accountId: { type: 'string' },
      currency: { type: 'string' },
    },
    required: ['amount', 'toAddress', 'accountId', 'currency'],
  },
  headers: {
    type: 'object',
    properties: {
      authToken: { type: 'string' },
    },
    required: ['authToken'],
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

const withdrawTransaction = {
  body: {
    type: 'object',
    properties: {
      amount: { type: 'number', minimum: 0.01 },
      accountId: { type: 'string' },
      currency: { type: 'string' },
    },
    required: ['amount', 'accountId', 'currency'],
  },
  headers: {
    type: 'object',
    properties: {
      authToken: { type: 'string' },
    },
    required: ['authToken'],
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

export { sendTransaction, withdrawTransaction };

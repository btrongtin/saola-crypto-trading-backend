// Default page size for pagination
const DEFAULT_PAGE_SIZE: number = 20;

// Cache Time-To-Live (TTL) in milliseconds
const CACHE_TTL: number = 60 * 1000; // 1 minute

// Internal API codes
const GENERAL_CODE = {
  OK: 200,
  CREATED: 201,
};
const ERROR_CODE = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Third party error codes
const ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
const DUPLICATE_CONSTRAINT = 'P2002'; // from Prisma

// Money exchange rate
const MONEY_EXCHANGE_RATE = {
  USD: 1,
  VND: 1 / 25000,
};

export {
  DEFAULT_PAGE_SIZE,
  CACHE_TTL,
  GENERAL_CODE,
  ERROR_CODE,
  ERR_BAD_REQUEST,
  MONEY_EXCHANGE_RATE,
  DUPLICATE_CONSTRAINT,
};

import { DEFAULT_PAGE_SIZE } from '../../constant.js';

/**
 * Validates and sanitizes query parameters for pagination and sorting.
 * @param {Object} query - The query parameters from the request.
 * @returns {Object} - An object containing sanitized limit, skip, sortBy, and order.
 */
export default (query) => {
  let {
    limit = DEFAULT_PAGE_SIZE,
    skip = 0,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  // Ensure limit and skip are non-negative integers
  limit = Math.max(parseInt(limit), 0);
  skip = Math.max(parseInt(skip), 0);

  // Ensure order is either 'asc' or 'desc'
  order = order === 'asc' ? 'asc' : 'desc';

  return { limit, skip, sortBy, order };
};

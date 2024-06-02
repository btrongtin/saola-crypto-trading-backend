import { DEFAULT_PAGE_SIZE } from '../../constant';

/**
 * Validates and sanitizes query parameters for pagination and sorting.
 * @param {Record<string, any>} query - The query parameters from the request.
 * @returns {{ limit: number, skip: number, sortBy: string, order: 'asc' | 'desc' }} - An object containing sanitized limit, skip, sortBy, and order.
 */
const validateAndSanitizeQueryParams = (
  query: Record<string, any>,
): { limit: number; skip: number; sortBy: string; order: 'asc' | 'desc' } => {
  // Destructure query parameters with default values
  // eslint-disable-next-line prefer-const
  let { limit = DEFAULT_PAGE_SIZE, skip = 0, sortBy = 'createdAt', order = 'desc' } = query;

  // Ensure limit and skip are non-negative integers
  limit = Math.max(parseInt(limit, 10), 0);
  skip = Math.max(parseInt(skip, 10), 0);

  // Ensure order is either 'asc' or 'desc'
  order = order === 'asc' ? 'asc' : 'desc';

  return { limit, skip, sortBy, order };
};

export default validateAndSanitizeQueryParams;

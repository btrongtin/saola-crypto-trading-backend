import axios from 'axios';
import firebase from '../firebase/index';
import { getAccountTransactions, getUserAccounts, loginUser, registerUser } from './schemas/accounts';
import validatePaginationAndSorting from './utils/validatePaginationAndSorting';
import { CACHE_TTL, ERROR_CODE, ERR_BAD_REQUEST, GENERAL_CODE } from '../constant';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RouteShorthandOptions } from 'fastify/types/route';
import { ILoginRequestBody, IRegisterRequestBody } from './types/account.types';
import ApiError, { handleApiError } from '../apiHandler/ApiError';
import rollbackCreatedUser from './utils/rollbackCreatedUser';
import { AccountType, Currency } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    cache: any;
  }
}

export default async function accountsService(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // Register a new user
  fastify.post<{ Body: IRegisterRequestBody }>(
    '/register',
    { schema: registerUser } as RouteShorthandOptions,
    async function (request, reply) {
      let user;
      try {
        // Destructure request body to extract user details
        const { email, password, accounts } = request.body;
        // Prepare accounts list
        const accountsList = accounts
          ? accounts.map((account) => ({
              type: account.type || AccountType.DEBIT,
              balance: account.balance || 0,
              currency: account.currency || Currency.USD,
            }))
          : [];
        // Create user in Firebase
        user = await firebase.auth().createUser({ email, password });
        // Create user in Prisma
        await fastify.prisma.user.create({
          data: {
            email,
            accounts: {
              create: accountsList,
            },
          },
        });
        reply.status(GENERAL_CODE.CREATED).send({ success: true, message: 'Register successfully.' });
      } catch (error) {
        if (user) {
          // Remove user from Firebase if any error occurs when creating user with Prisma
          await rollbackCreatedUser(user.uid);
        }
        // Error code P2002 from Prisma: Duplicate account type
        if ((error as any).code === 'P2002') {
          return handleApiError(reply, new ApiError(ERROR_CODE.CONFLICT, 'Duplicate account type.'));
        }
        handleApiError(reply, error);
      }
    },
  );

  // User login
  fastify.post<{ Body: ILoginRequestBody }>(
    '/login',
    { schema: loginUser } as RouteShorthandOptions,
    async function (request, reply) {
      try {
        // Destructure request body to extract user details
        const { email, password } = request.body;

        // Authenticate user with Firebase
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
          {
            email,
            password,
            returnSecureToken: true,
          },
        );
        // Get access token to send back to client
        const { idToken } = response.data;
        reply.send({ success: true, accessToken: idToken });
      } catch (error) {
        // Error from google authentication
        if (error.code === ERR_BAD_REQUEST) {
          return handleApiError(reply, new ApiError(ERROR_CODE.UNAUTHORIZED, 'Invalid email or password.'));
        }
        handleApiError(reply, error);
      }
    },
  );

  // Get user accounts with pagination and sorting
  fastify.get<{
    Querystring: IQuerystring;
  }>(
    '/',
    {
      preValidation: [fastify.authenticate],
      schema: getUserAccounts,
    } as RouteShorthandOptions,
    async (request, reply) => {
      // Validate and sanitize pagination and sorting parameters
      const { limit, skip, sortBy, order } = validatePaginationAndSorting(request.query);
      // Caching request to reduce database queries
      const cacheKey = `user_accounts_${request.user.email}_${limit}_${skip}_${sortBy}_${order}`;
      const cachedData = fastify.cache.get(cacheKey);
      // If data is found in cache, return it
      if (cachedData) {
        return reply.send({ success: true, data: cachedData });
      }
      try {
        // Retrieve the logged-in user from the database
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: {
            accounts: {
              orderBy: { [sortBy]: order },
              skip,
              take: limit,
            },
          },
        });
        if (user) {
          // Set data in cache and send response
          fastify.cache.set(cacheKey, user.accounts, CACHE_TTL);
          return reply.send({ success: true, data: user.accounts });
        } else {
          throw new ApiError(ERROR_CODE.NOT_FOUND, 'User not found');
        }
      } catch (error) {
        handleApiError(reply, error);
      }
    },
  );

  // Get account transactions with pagination and sorting
  fastify.get<{
    Querystring: IQuerystring;
    Params: { accountId: string };
  }>(
    '/:accountId/transactions',
    {
      preValidation: [fastify.authenticate],
      schema: getAccountTransactions,
    } as RouteShorthandOptions,
    async (request, reply) => {
      try {
        // Validate and sanitize pagination and sorting parameters
        const { limit, skip, sortBy, order } = validatePaginationAndSorting(request.query);
        const { accountId } = request.params;
        const requestedAccount = await fastify.prisma.account.findUnique({
          where: { id: accountId },
        });
        if (!requestedAccount) throw new ApiError(ERROR_CODE.NOT_FOUND, 'Account not found.');
        if (requestedAccount.userId !== request.user.id)
          throw new ApiError(ERROR_CODE.FORBIDDEN, 'You are not allowed to retrieve this account data.');
        // Get all account transactions from the database, either the account is the sender or the receiver
        const transactions = await fastify.prisma.transaction.findMany({
          where: {
            OR: [{ accountId: accountId }, { toAddress: accountId }],
          },
          orderBy: { [sortBy]: order },
          skip,
          take: limit,
        });
        reply.send({ success: true, data: transactions });
      } catch (error) {
        handleApiError(reply, error);
      }
    },
  );
}

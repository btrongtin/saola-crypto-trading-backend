import axios from 'axios';
import firebase from '../firebase/index';
import {
  getAccountTransactions,
  getUserAccounts,
  loginUser,
  registerUser,
} from './schemas/accounts';
import validatePaginationAndSorting from './utils/validatePaginationAndSorting';
import { CACHE_TTL } from '../constant';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RouteShorthandOptions } from 'fastify/types/route';
import { ILoginRequestBody, IRegisterRequestBody } from './types/account.types';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
    cache: any;
  }
}

export default async function accountsService(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) {
  // Register a new user
  fastify.post<{ Body: IRegisterRequestBody }>(
    '/register',
    { schema: registerUser } as RouteShorthandOptions,
    async function (request, reply) {
      let user;
      try {
        // Destructure request body to extract user details
        const { email, password, accounts } = request.body as {
          email: string;
          password: string;
          accounts: { type: string; balance?: number }[];
        };

        // Prepare accounts list
        const accountsList = accounts
          ? accounts.map((account) => ({
              type: account.type,
              balance: account.balance ?? 0,
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

        reply
          .status(201)
          .send({ success: true, message: 'Register successfully.' });
      } catch (error) {
        if (user) {
          try {
            // Remove user from Firebase if any error occurs when creating user with Prisma
            await firebase.auth().deleteUser(user.uid);
          } catch (deleteError) {}
        }
        // Error code P2002 from Prisma: Duplicate account type
        if ((error as any).code === 'P2002') {
          return reply
            .status(400)
            .send({ success: false, message: 'Duplicate account type.' });
        }
        reply
          .status(400)
          .send({ success: false, message: (error as Error).message });
      }
    }
  );

  // User login
  fastify.post<{ Body: ILoginRequestBody }>(
    '/login',
    { schema: loginUser } as RouteShorthandOptions,
    async function (request, reply) {
      try {
        // Destructure request body to extract user details
        const { email, password } = request.body as {
          email: string;
          password: string;
        };

        // Authenticate user with Firebase
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
          {
            email,
            password,
            returnSecureToken: true,
          }
        );
        // Get access token and refresh token to send back to client
        const { idToken, refreshToken } = response.data;
        reply.send({ success: true, accessToken: idToken, refreshToken });
      } catch (error) {
        reply.status(400).send({
          success: false,
          message:
            (error as any).response?.data?.error?.message ||
            (error as Error).message,
        });
      }
    }
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
      const { limit, skip, sortBy, order } = validatePaginationAndSorting(
        request.query
      );
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
        }
        return reply.send({ success: false, message: 'User not found' });
      } catch (error) {
        reply
          .status(500)
          .send({ success: false, message: 'Internal server error' });
      }
    }
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
      // Validate and sanitize pagination and sorting parameters
      const { limit, skip, sortBy, order } = validatePaginationAndSorting(
        request.query
      );
      try {
        const { accountId } = request.params;
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
        reply
          .status(500)
          .send({ success: false, message: 'Internal server error' });
      }
    }
  );
}

import axios from 'axios';
import firebase from '../firebase/index.js';
import {
  getAccountTransactions,
  getUserAccounts,
  loginUser,
  registerUser,
} from '../schemas/accounts.js';
import validatePaginationAndSorting from './utils/validatePaginationAndSorting.js';
import { CACHE_TTL } from '../constant.js';
export default async function (fastify, opts) {
  fastify.post(
    '/register',
    { schema: registerUser },
    async function (request, reply) {
      let user;
      try {
        const { email, password, accounts } = request.body;
        const accountsList = accounts
          ? accounts.map((account) => ({
              type: account.type,
              balance: account.balance,
            }))
          : [];
        user = await firebase.auth().createUser({ email, password });
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
            await firebase.auth().deleteUser(user.uid);
          } catch (deleteError) {}
        }
        if (error.code === 'P2002') {
          return reply
            .status(400)
            .send({ success: false, message: 'Duplicate account type.' });
        }
        reply.status(400).send({ success: false, message: error.message });
      }
    }
  );

  fastify.post(
    '/login',
    { schema: loginUser },
    async function (request, reply) {
      try {
        const { email, password } = request.body;
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
          {
            email,
            password,
            returnSecureToken: true,
          }
        );
        const { idToken, refreshToken } = response.data;
        reply.send({ success: true, accessToken: idToken, refreshToken });
      } catch (error) {
        reply.status(400).send({
          success: false,
          message: error.response?.data?.error?.message || error.message,
        });
      }
    }
  );

  fastify.get(
    '/',
    { preValidation: [fastify.authenticate], schema: getUserAccounts },
    async (request, reply) => {
      const { limit, skip, sortBy, order } = validatePaginationAndSorting(
        request.query
      );
      const cacheKey = `user_accounts_${request.user.email}_${limit}_${skip}_${sortBy}_${order}`;
      const cachedData = fastify.cache.get(cacheKey);
      if (cachedData) {
        return reply.send({ success: true, data: cachedData });
      }
      try {
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
        // Set cache
        fastify.cache.set(cacheKey, user.accounts, CACHE_TTL);
        reply.send({ success: true, data: user.accounts });
      } catch (error) {
        reply
          .status(500)
          .send({ success: false, message: 'Internal server error' });
      }
    }
  );
  fastify.get(
    '/:accountId/transactions',
    { preValidation: [fastify.authenticate], schema: getAccountTransactions },
    async (request, reply) => {
      const { limit, skip, sortBy, order } = validatePaginationAndSorting(
        request.query
      );
      try {
        const { accountId } = request.params;
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

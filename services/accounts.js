import axios from 'axios';
import firebase from '../firebase/index.js';
import { isArray } from '../utils/utils.js';

export default async function (fastify, opts) {
  fastify.post('/register', async function (request, reply) {
    let user;
    try {
      const { email, password, accounts } = request.body;
      const accountsList = isArray(accounts)
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
      reply.send({ success: true, message: 'Register successfully.' });
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
  });

  fastify.post('/login', async function (request, reply) {
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
  });

  fastify.get(
    '/',
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });
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
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { accountId } = request.params;
        const transactions = await fastify.prisma.transaction.findMany({
          where: {
            AND: [
              {
                OR: [{ accountId: accountId }, { toAddress: accountId }],
              },
              { status: 'completed' },
            ],
          },
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

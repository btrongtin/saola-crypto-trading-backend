import processTransaction from '../coreApis/processTransaction.js';
import {
  sendTransaction,
  withdrawTransaction,
} from '../schemas/transactions.js';

export default async function (fastify, opts) {
  fastify.post(
    '/send',
    { preValidation: [fastify.authenticate], schema: sendTransaction },
    async (request, reply) => {
      let transaction;
      try {
        const { amount, toAddress, accountId, currency } = request.body;
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });
        const account = user.accounts.find(
          (account) => account.id === accountId
        );
        if (account) {
          if (account.balance < amount) {
            return reply
              .status(400)
              .send({ success: false, message: 'Insufficient balance.' });
          }

          transaction = await fastify.prisma.transaction.create({
            data: {
              amount,
              toAddress,
              currency,
              status: 'pending',
              type: 'send',
              accountId,
            },
          });

          await processTransaction(transaction);

          await fastify.prisma.$transaction([
            fastify.prisma.account.update({
              where: { id: accountId },
              data: {
                balance: {
                  decrement: amount,
                },
              },
            }),
            fastify.prisma.account.update({
              where: { id: toAddress },
              data: {
                balance: {
                  increment: amount,
                },
              },
            }),
            fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'completed' },
            }),
          ]);

          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          reply
            .status(401)
            .send({ success: false, message: 'Cannot perform this action.' });
        }
      } catch (error) {
        if (transaction) {
          try {
            await fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'cancelled' },
            });
          } catch (updateTransactionError) {}
        }
        reply
          .status(500)
          .send({ success: false, message: 'Internal server error' });
      }
    }
  );

  fastify.post(
    '/withdraw',
    { preValidation: [fastify.authenticate], schema: withdrawTransaction },
    async (request, reply) => {
      let transaction;
      try {
        const { amount, accountId, currency } = request.body;
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });
        const account = user.accounts.find(
          (account) => account.id === accountId
        );
        if (account) {
          if (account.balance < amount) {
            return reply
              .status(400)
              .send({ success: false, message: 'Insufficient balance.' });
          }

          transaction = await fastify.prisma.transaction.create({
            data: {
              amount,
              currency,
              status: 'pending',
              type: 'withdraw',
              accountId,
            },
          });

          await processTransaction(transaction);

          await fastify.prisma.$transaction([
            fastify.prisma.account.update({
              where: { id: accountId },
              data: {
                balance: {
                  decrement: amount,
                },
              },
            }),
            fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'completed' },
            }),
          ]);

          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          reply
            .status(401)
            .send({ success: false, message: 'Cannot perform this action.' });
        }
      } catch (error) {
        if (transaction) {
          try {
            await fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'cancelled' },
            });
          } catch (updateTransactionError) {}
        }
        reply
          .status(500)
          .send({ success: false, message: 'Internal server error' });
      }
    }
  );
}

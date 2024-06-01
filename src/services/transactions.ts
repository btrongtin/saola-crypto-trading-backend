import processTransaction from '../coreApis/processTransaction';
import { sendTransaction, withdrawTransaction } from './schemas/transactions';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RouteShorthandOptions } from 'fastify/types/route';
import { ISendTransactionRequestBody, IWithdrawTransactionRequestBody } from './types/transaction.types';
import { IAccount } from './types/account.types';

export default async function transactionsService(fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // Send transaction route
  fastify.post<{ Body: ISendTransactionRequestBody }>(
    '/send',
    {
      preValidation: [fastify.authenticate],
      schema: sendTransaction,
    } as RouteShorthandOptions,
    async (request, reply) => {
      let transaction;
      try {
        // Destructure request body to extract transaction details
        const { amount, toAddress, accountId, currency } = request.body as {
          amount: number;
          toAddress: string;
          accountId: string;
          currency: string;
        };

        // Retrieve the logged-in user from the database
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });

        // Check if the sender account is belonging to the logged-in user
        const account = user?.accounts.find((account: IAccount) => account.id === accountId);

        // If the account is found, check for sufficient balance
        if (account) {
          if (account.balance < amount) {
            return reply.status(400).send({ success: false, message: 'Insufficient balance.' });
          }

          // Create a new transaction with status 'pending'
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

          // Process the transaction
          await processTransaction(transaction);

          // Use Prisma transaction to update the account balances
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
            // Update the transaction status once the transaction is processed
            fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'completed' },
            }),
          ]);

          // Send a success response
          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          // If the account is not found or it does not belong to the logged-in user, send an error response
          reply.status(401).send({ success: false, message: 'Cannot perform this action.' });
        }
      } catch (error) {
        // Rollback the transaction if an error occurs
        if (transaction) {
          try {
            await fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'cancelled' },
            });
          } catch (updateTransactionError) {}
        }
        reply.status(500).send({ success: false, message: 'Internal server error' });
      }
    },
  );

  // Withdraw transaction route
  fastify.post<{ Body: IWithdrawTransactionRequestBody }>(
    '/withdraw',
    {
      preValidation: [fastify.authenticate],
      schema: withdrawTransaction,
    } as RouteShorthandOptions,
    async (request, reply) => {
      let transaction;
      try {
        const { amount, accountId, currency } = request.body as {
          amount: number;
          accountId: string;
          currency: string;
        };

        // Retrieve user and their accounts from the database
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });

        // Check if the requested account is belonging to the logged-in user
        const account = user?.accounts.find((account: IAccount) => account.id === accountId);

        // If the account is found, check for sufficient balance
        if (account) {
          // Check for sufficient balance
          if (account.balance < amount) {
            return reply.status(400).send({ success: false, message: 'Insufficient balance.' });
          }

          // Create a new transaction with status 'pending'
          transaction = await fastify.prisma.transaction.create({
            data: {
              amount,
              currency,
              status: 'pending',
              type: 'withdraw',
              accountId,
            },
          });

          // Process the transaction
          await processTransaction(transaction);

          // Use Prisma transaction to update the account balances
          await fastify.prisma.$transaction([
            fastify.prisma.account.update({
              where: { id: accountId },
              data: {
                balance: {
                  decrement: amount,
                },
              },
            }),
            // Update the transaction status once the transaction is processed
            fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'completed' },
            }),
          ]);

          // Send a success response
          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          // If the account is not found or it does not belong to the logged-in user, send an error response
          reply.status(401).send({ success: false, message: 'Cannot perform this action.' });
        }
      } catch (error) {
        // Rollback the transaction if an error occurs
        if (transaction) {
          try {
            await fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'cancelled' },
            });
          } catch (updateTransactionError) {}
        }
        reply.status(500).send({ success: false, message: 'Internal server error' });
      }
    },
  );
}

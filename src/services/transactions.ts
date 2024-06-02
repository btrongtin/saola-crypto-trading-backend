import processTransaction from '../coreApis/processTransaction';
import { sendTransaction, withdrawTransaction } from './schemas/transactions';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { RouteShorthandOptions } from 'fastify/types/route';
import { ISendTransactionRequestBody, IWithdrawTransactionRequestBody } from './types/transaction.types';
import { IAccount } from './types/account.types';
import ApiError, { handleApiError } from '../apiHandler/ApiError';
import { ERROR_CODE } from '../constant';
import rollbackTransaction from './utils/rollbackTransaction';
import { TransactionStatus } from '@prisma/client';
import exchangeMoney from './utils/exchangeMoney';
import isValidCurrency from './utils/isValidCurrency';

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
        const { amount, toAddress, accountId } = request.body;
        if (accountId === toAddress) throw new ApiError(ERROR_CODE.BAD_REQUEST, 'Cannot send to yourself.');

        const recipientAccount = await fastify.prisma.account.findUnique({
          where: { id: toAddress },
        });
        if (!recipientAccount) throw new ApiError(ERROR_CODE.NOT_FOUND, 'Recipient account not found.');

        // Retrieve the logged-in user from the database
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });
        // Check if the sender account is belonging to the logged-in user
        const senderAccount = user?.accounts.find((account: IAccount) => account.id === accountId);
        // Convert the amount to the recipient's currency
        const convertedAmount = exchangeMoney(senderAccount.currency, recipientAccount.currency, amount);
        // If the account is found, check for sufficient balance
        if (senderAccount) {
          if (senderAccount.balance < amount) {
            throw new ApiError(ERROR_CODE.BAD_REQUEST, 'Insufficient balance.');
          }
          // Create a new transaction with status 'pending'
          transaction = await fastify.prisma.transaction.create({
            data: {
              amount: convertedAmount,
              toAddress,
              currency: recipientAccount.currency,
              status: TransactionStatus.PENDING,
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
                  decrement: convertedAmount,
                },
              },
            }),
            fastify.prisma.account.update({
              where: { id: toAddress },
              data: {
                balance: {
                  increment: convertedAmount,
                },
              },
            }),
            // Update the transaction status once the transaction is processed
            fastify.prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: TransactionStatus.COMPLETED },
            }),
          ]);
          // Send a success response
          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          // If the account is not found or it does not belong to the logged-in user, send an error response
          throw new ApiError(ERROR_CODE.FORBIDDEN, 'Cannot perform this action.');
        }
      } catch (error) {
        // Rollback the transaction if an error occurs
        if (transaction) {
          await rollbackTransaction(fastify, transaction);
        }
        handleApiError(reply, error);
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
        const { amount, accountId } = request.body;
        // Retrieve user and their accounts from the database
        const user = await fastify.prisma.user.findUnique({
          where: { email: request.user.email },
          include: { accounts: true },
        });
        // Check if the requested account is belonging to the logged-in user
        const senderAccount = user?.accounts.find((account: IAccount) => account.id === accountId);
        // If the account is found, check for sufficient balance
        if (senderAccount) {
          // Check for sufficient balance
          if (senderAccount.balance < amount) {
            throw new ApiError(ERROR_CODE.BAD_REQUEST, 'Insufficient balance.');
          }
          // Create a new transaction with status 'PENDING'
          transaction = await fastify.prisma.transaction.create({
            data: {
              amount,
              currency: senderAccount.currency,
              status: TransactionStatus.PENDING,
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
              data: { status: TransactionStatus.COMPLETED },
            }),
          ]);
          // Send a success response
          reply.send({
            success: true,
            message: 'Transaction completed successfully.',
          });
        } else {
          // If the account is not found or it does not belong to the logged-in user, send an error response
          throw new ApiError(ERROR_CODE.FORBIDDEN, 'Cannot perform this action.');
        }
      } catch (error) {
        // Rollback the transaction if an error occurs
        if (transaction) {
          await rollbackTransaction(fastify, transaction);
        }
        handleApiError(reply, error);
      }
    },
  );
}

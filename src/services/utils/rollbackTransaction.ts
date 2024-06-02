import { FastifyInstance } from 'fastify';
import ApiError from '../../apiHandler/ApiError';
import { Transaction } from '@prisma/client';
import { ERROR_CODE } from '../../constant';
import { TransactionStatus } from '@prisma/client';

export default async function rollbackTransaction(fastify: FastifyInstance, transaction: Transaction) {
  try {
    await fastify.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: TransactionStatus.CANCELLED },
    });
  } catch (updateTransactionError) {
    throw new ApiError(ERROR_CODE.INTERNAL_SERVER_ERROR, 'Failed to rollback transaction.');
  }
}

import Fastify from 'fastify';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import accountsService from './services/accounts.js';
import transactionsService from './services/transactions.js';
import dotenv from 'dotenv';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true,
});
dotenv.config();
fastify.register(cors);

// Register plugins
fastify.register(authPlugin);
fastify.register(prismaPlugin);

// Register services
fastify.register(accountsService, { prefix: 'api/accounts' });
fastify.register(transactionsService, { prefix: 'api/transactions' });
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

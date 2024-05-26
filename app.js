import Fastify from 'fastify';
import dotenv from 'dotenv';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import accountsService from './services/accounts.js';
import transactionsService from './services/transactions.js';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

fastify.register(fastifySwagger, {
  mode: 'static',
  specification: {
    path: './swagger.yaml',
    baseDir: __dirname,
  },
  exposeRoute: true,
});

fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
  servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
});

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

import Fastify, { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import authPlugin from './plugins/auth';
import cachePlugin from './plugins/cache';
import prismaPlugin from './plugins/prisma';
import accountsService from './services/accounts';
import transactionsService from './services/transactions';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const fastify: FastifyInstance = Fastify({
  logger: true,
});

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

// Register swagger
fastify.register(fastifySwagger, {
  mode: 'static',
  specification: {
    path: path.join(__dirname, 'swagger.yaml'),
    baseDir: __dirname,
  },
});
fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, request, reply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

fastify.register(cors);

// Register plugins
fastify.register(authPlugin);
fastify.register(cachePlugin);
fastify.register(prismaPlugin);

// Register services
fastify.register(accountsService, { prefix: 'api/accounts' });
fastify.register(transactionsService, { prefix: 'api/transactions' });

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

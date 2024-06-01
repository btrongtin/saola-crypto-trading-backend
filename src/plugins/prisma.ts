import { FastifyPluginAsync, FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
// Define the Prisma plugin for Fastify
const prismaPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Initialize the Prisma client with logging options
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  // Connect to the Prisma client
  await prisma.$connect();

  // Decorate the Fastify instance with the Prisma client
  fastify.decorate('prisma', prisma).addHook('onClose', async (fastifyInstance) => {
    // Disconnect the Prisma client when Fastify shuts down
    await fastifyInstance.prisma.$disconnect();
  });
};

export default fastifyPlugin(prismaPlugin);

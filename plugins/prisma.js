import { fastifyPlugin } from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prismaPlugin = async (fastify, options) => {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  await prisma.$connect();

  fastify.decorate('prisma', prisma).addHook('onClose', async (fastify) => {
    await fastify.prisma.$disconnect();
  });
};

export default fastifyPlugin(prismaPlugin);

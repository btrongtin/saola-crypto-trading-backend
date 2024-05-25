import { fastifyPlugin } from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prismaPlugin = async (server, options) => {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  await prisma.$connect();

  server.decorate('prisma', prisma).addHook('onClose', async (server) => {
    await server.prisma.$disconnect();
  });
};

export default fastifyPlugin(prismaPlugin);

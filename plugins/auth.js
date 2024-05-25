import { fastifyPlugin } from 'fastify-plugin';
import firebase from '../firebase/index.js';

const authPlugin = async function (fastify, opts) {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const firebaseUser = await firebase
        .auth()
        .verifyIdToken(request.headers.authtoken);
      request.user = firebaseUser;
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  });
};

export default fastifyPlugin(authPlugin);

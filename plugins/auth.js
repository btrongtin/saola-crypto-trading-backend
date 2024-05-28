import { fastifyPlugin } from 'fastify-plugin';
import firebase from '../firebase/index.js';

const authPlugin = async function (fastify, opts) {
  fastify.decorate('authenticate', async function (request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply
        .status(401)
        .send({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const firebaseUser = await firebase.auth().verifyIdToken(token);
      request.user = firebaseUser;
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Invalid or expired token.',
      });
    }
  });
};

export default fastifyPlugin(authPlugin);

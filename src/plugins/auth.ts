import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import firebase from '../firebase/index';

// Define the shape of the request with user information
declare module 'fastify' {
  interface FastifyRequest {
    user?: firebase.auth.DecodedIdToken;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Decorate the Fastify instance with the `authenticate` method
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    // Check if the authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, message: 'No token provided.' });
    }

    // Extract the token from the authorization header
    const token = authHeader.split(' ')[1];

    try {
      // Verify the token using Firebase authentication
      const firebaseUser = await firebase.auth().verifyIdToken(token);
      // Attach the verified user information to the request object
      request.user = firebaseUser;
    } catch (err) {
      // Handle errors in token verification
      reply.status(401).send({ success: false, message: 'Invalid or expired token.' });
    }
  });
};

export default fastifyPlugin(authPlugin);

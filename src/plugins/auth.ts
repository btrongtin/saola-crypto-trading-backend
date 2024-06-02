import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import firebase from '../firebase/index';
import { ERROR_CODE } from '../constant';
import ApiError, { handleApiError } from '../apiHandler/ApiError';

// Define the shape of the request with user information
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      email: string;
      uid: string;
      id: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Decorate the Fastify instance with the `authenticate` method
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    try {
      // Check if the authorization header is present and starts with 'Bearer '
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(ERROR_CODE.UNAUTHORIZED, 'No token provided.');
      }
      // Extract the token from the authorization header
      const token = authHeader.split(' ')[1];
      try {
        // Verify the token using Firebase authentication
        const firebaseUser = await firebase.auth().verifyIdToken(token);
        const internalUser = await fastify.prisma.user.findUnique({
          where: {
            email: firebaseUser.email,
          },
        });
        // Attach the verified user information to the request object
        request.user = { email: firebaseUser.email, uid: firebaseUser.uid, id: internalUser.id };
      } catch (firebaseError) {
        // Handle Firebase errors
        if (firebaseError.codePrefix === 'auth') {
          throw new ApiError(ERROR_CODE.UNAUTHORIZED, 'Invalid or expired token.');
        }
      }
    } catch (err) {
      handleApiError(reply, err);
    }
  });
};

export default fastifyPlugin(authPlugin);

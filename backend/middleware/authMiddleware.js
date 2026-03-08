import { verifyToken } from '../utils/jwt.js';

export async function authMiddleware(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    request.user = decoded;
  } catch (err) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
}

export async function adminMiddleware(request, reply) {
  // First verify auth
  await authMiddleware(request, reply);

  if (!request.user) return; // authMiddleware already sent error

  // Check if user is admin
  if (request.user.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

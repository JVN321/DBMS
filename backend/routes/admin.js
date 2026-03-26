import { getSession } from '../neo4j/driver.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';
import { logEvent } from '../utils/logger.js';

export default async function adminRoutes(fastify) {
  fastify.delete('/clear-database', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      // Delete all relationships first, then all nodes
      await session.run('MATCH ()-[r]->() DELETE r');
      const nodeResult = await session.run('MATCH (n) DELETE n RETURN count(n) AS deleted');
      const deleted = nodeResult.records[0]?.get('deleted');
      const count = (deleted && typeof deleted.toNumber === 'function')
        ? deleted.toNumber()
        : Number(deleted) || 0;

      await logEvent(request.user.username, 'clear_database', `Cleared complete entire database (${count} nodes deleted)`, request.ip);

      return { success: true, nodesDeleted: count };
    } finally {
      await session.close();
    }
  });
}

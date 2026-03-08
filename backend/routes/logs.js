import { getSession } from '../neo4j/driver.js';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware.js';

export default async function logsRoutes(fastify) {
  // Log an activity (protected)
  fastify.post('/logs', { onRequest: [authMiddleware] }, async (request, reply) => {
    const { action, details } = request.body;

    if (!action) {
      return reply.code(400).send({ error: 'action is required' });
    }

    const session = getSession();
    try {
      const result = await session.run(
        `CREATE (l:Log {
          username: $username,
          action: $action,
          details: $details,
          timestamp: timestamp(),
          ip: $ip
        })
        RETURN l`,
        {
          username: request.user.username,
          action,
          details: details || '',
          ip: request.ip,
        }
      );

      if (!result.records[0]) {
        return reply.code(500).send({ error: 'Failed to create log' });
      }

      return reply.code(201).send({ message: 'Activity logged' });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to log activity' });
    } finally {
      await session.close();
    }
  });

  // Get activity logs (admin only)
  fastify.get('/logs', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const { skip = 0, limit = 100, username, action } = request.query;

    const session = getSession();
    try {
      let query = 'MATCH (l:Log)';
      const params = { skip: parseInt(skip), limit: parseInt(limit) };

      if (username) {
        query += ' WHERE l.username = $username';
        params.username = username;
      }

      if (action) {
        query += username ? ' AND l.action = $action' : ' WHERE l.action = $action';
        params.action = action;
      }

      const countQuery = query.replace('MATCH', 'MATCH').trim();
      const countResult = await session.run(`${countQuery} RETURN count(l) AS total`, params);
      const total = countResult.records[0]?.get('total')?.toNumber() || 0;

      const result = await session.run(
        `${query}
        RETURN l
        ORDER BY l.timestamp DESC
        SKIP $skip
        LIMIT $limit`,
        params
      );

      const logs = result.records.map((record) => {
        const l = record.get('l')?.properties;
        return {
          username: l.username,
          action: l.action,
          details: l.details,
          timestamp: l.timestamp,
          ip: l.ip,
        };
      });

      return reply.code(200).send({ logs, total });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch logs' });
    } finally {
      await session.close();
    }
  });

  // Get system stats (admin only)
  fastify.get(
    '/logs/stats/system',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const session = getSession();
      try {
        const userCount = await session.run('MATCH (u:User) RETURN count(u) AS total');
        const total_users = userCount.records[0]?.get('total')?.toNumber() || 0;

        const bannedCount = await session.run(
          'MATCH (u:User {is_banned: true}) RETURN count(u) AS total'
        );
        const banned_users = bannedCount.records[0]?.get('total')?.toNumber() || 0;

        const logsCount = await session.run('MATCH (l:Log) RETURN count(l) AS total');
        const total_activities = logsCount.records[0]?.get('total')?.toNumber() || 0;

        const walletCount = await session.run('MATCH (w:Wallet) RETURN count(w) AS total');
        const total_wallets = walletCount.records[0]?.get('total')?.toNumber() || 0;

        return reply.code(200).send({
          stats: {
            total_users,
            banned_users,
            active_users: total_users - banned_users,
            total_activities,
            total_wallets,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch system stats' });
      } finally {
        await session.close();
      }
    }
  );
}

import bcrypt from 'bcrypt';
import { getSession } from '../neo4j/driver.js';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware.js';
import { logEvent } from '../utils/logger.js';

export default async function userRoutes(fastify) {
  // Create user (admin only)
  fastify.post(
    '/users',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const { username, email, password, role } = request.body;

      if (!username || !email || !password) {
        return reply.code(400).send({ error: 'Missing required fields: username, email, password' });
      }

      if (password.length < 6) {
        return reply.code(400).send({ error: 'Password must be at least 6 characters' });
      }

      const userRole = role === 'admin' ? 'admin' : 'user';
      const session = getSession();

      try {
        const existingUser = await session.run(
          'MATCH (u:User) WHERE u.username = $username OR u.email = $email RETURN u',
          { username, email }
        );

        if (existingUser.records.length > 0) {
          return reply.code(409).send({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const createdAt = new Date().toISOString();

        const result = await session.run(
          `CREATE (u:User {
            username: $username,
            email: $email,
            password: $hashedPassword,
            role: $role,
            created_at: $createdAt,
            is_banned: false
          })
          RETURN u`,
          { username, email, hashedPassword, role: userRole, createdAt }
        );

        const u = result.records[0]?.get('u')?.properties;

        await logEvent(request.user.username, 'create_user', `Created user: ${username}`, request.ip);

        return reply.code(201).send({
          message: 'User created successfully',
          user: {
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            is_banned: u.is_banned,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to create user' });
      } finally {
        await session.close();
      }
    }
  );

  // Get all users (admin only)
  fastify.get(
    '/users',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const session = getSession();
      try {
        const { skip = 0, limit = 50 } = request.query;
        const result = await session.run(
          `MATCH (u:User)
          RETURN u
          ORDER BY u.created_at DESC
          SKIP toInteger($skip)
          LIMIT toInteger($limit)`,
          { skip: parseInt(skip), limit: parseInt(limit) }
        );

        const countResult = await session.run('MATCH (u:User) RETURN count(u) AS total');
        const total = countResult.records[0]?.get('total')?.toNumber() || 0;

        const users = result.records.map((record) => {
          const u = record.get('u')?.properties;
          return {
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            is_banned: u.is_banned,
          };
        });

        return reply.code(200).send({ users, total });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch users' });
      } finally {
        await session.close();
      }
    }
  );

  // Get user by username
  fastify.get(
    '/users/:username',
    { onRequest: [authMiddleware] },
    async (request, reply) => {
      const { username } = request.params;
      const session = getSession();
      try {
        const result = await session.run(
          'MATCH (u:User {username: $username}) RETURN u',
          { username }
        );

        if (result.records.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const u = result.records[0]?.get('u')?.properties;

        return reply.code(200).send({
          user: {
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            is_banned: u.is_banned,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch user' });
      } finally {
        await session.close();
      }
    }
  );

  // Update user (admin only)
  fastify.put(
    '/users/:username',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const { username } = request.params;
      const { role, email } = request.body;

      if (!role && !email) {
        return reply.code(400).send({ error: 'No fields to update' });
      }

      if (role && !['user', 'admin'].includes(role)) {
        return reply.code(400).send({ error: 'Invalid role' });
      }

      const session = getSession();
      try {
        const updates = [];
        const params = { username };

        if (role) {
          updates.push('u.role = $role');
          params.role = role;
        }

        if (email) {
          updates.push('u.email = $email');
          params.email = email;
        }

        const result = await session.run(
          `MATCH (u:User {username: $username})
          SET ${updates.join(', ')}
          RETURN u`,
          params
        );

        if (result.records.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const u = result.records[0]?.get('u')?.properties;

        await logEvent(request.user.username, 'update_user', `Updated user: ${username}`, request.ip);

        return reply.code(200).send({
          message: 'User updated',
          user: {
            username: u.username,
            email: u.email,
            role: u.role,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to update user' });
      } finally {
        await session.close();
      }
    }
  );

  // Ban/unban user (admin only)
  fastify.post(
    '/users/:username/ban',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const { username } = request.params;
      const { is_banned } = request.body;

      if (typeof is_banned !== 'boolean') {
        return reply.code(400).send({ error: 'is_banned must be true or false' });
      }

      const session = getSession();
      try {
        const result = await session.run(
          `MATCH (u:User {username: $username})
          SET u.is_banned = $is_banned
          RETURN u`,
          { username, is_banned }
        );

        if (result.records.length === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const u = result.records[0]?.get('u')?.properties;
        const action = is_banned ? 'banned' : 'unbanned';

        await logEvent(request.user.username, action, `${action} user: ${username}`, request.ip);

        return reply.code(200).send({
          message: `User ${action}`,
          user: {
            username: u.username,
            is_banned: u.is_banned,
          },
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to update user ban status' });
      } finally {
        await session.close();
      }
    }
  );

  // Delete user (admin only)
  fastify.delete(
    '/users/:username',
    { onRequest: [adminMiddleware] },
    async (request, reply) => {
      const { username } = request.params;

      if (username === 'admin') {
        return reply.code(403).send({ error: 'Cannot delete admin user' });
      }

      const session = getSession();
      try {
        const result = await session.run(
          'MATCH (u:User {username: $username}) DELETE u RETURN count(u) AS deleted',
          { username }
        );

        const deleted = result.records[0]?.get('deleted')?.toNumber() || 0;

        if (deleted === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        await logEvent(request.user.username, 'delete_user', `Deleted user: ${username}`, request.ip);

        return reply.code(200).send({ message: 'User deleted' });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to delete user' });
      } finally {
        await session.close();
      }
    }
  );

  // Get current user's preferences
  fastify.get(
    '/users/me/preferences',
    { onRequest: [authMiddleware] },
    async (request, reply) => {
      const { username } = request.user;
      const session = getSession();
      try {
        const result = await session.run(
          'MATCH (u:User {username: $username}) RETURN u.preferences AS prefs',
          { username }
        );
        const raw = result.records[0]?.get('prefs');
        const prefs = raw ? JSON.parse(raw) : {};
        return reply.code(200).send({ preferences: prefs });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch preferences' });
      } finally {
        await session.close();
      }
    }
  );

  // Save current user's preferences
  fastify.put(
    '/users/me/preferences',
    { onRequest: [authMiddleware] },
    async (request, reply) => {
      const { username } = request.user;
      const preferences = request.body;
      if (!preferences || typeof preferences !== 'object') {
        return reply.code(400).send({ error: 'Preferences must be a JSON object' });
      }
      const session = getSession();
      try {
        await session.run(
          'MATCH (u:User {username: $username}) SET u.preferences = $prefs',
          { username, prefs: JSON.stringify(preferences) }
        );        
        await logEvent(username, 'update_preferences', 'Updated user preferences', request.ip);
        return reply.code(200).send({ ok: true });
      } catch (err) {
        fastify.log.error(err);
        return reply.code(500).send({ error: 'Failed to save preferences' });
      } finally {
        await session.close();
      }
    }
  );
}

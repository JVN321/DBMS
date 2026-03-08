import bcrypt from 'bcrypt';
import { getSession } from '../neo4j/driver.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export default async function authRoutes(fastify) {
  // Register new user
  fastify.post('/auth/register', async (request, reply) => {
    const { username, email, password } = request.body;

    if (!username || !email || !password) {
      return reply.code(400).send({ error: 'Missing required fields: username, email, password' });
    }

    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }

    const session = getSession();
    try {
      // Check if user already exists
      const existingUser = await session.run(
        'MATCH (u:User) WHERE u.username = $username OR u.email = $email RETURN u',
        { username, email }
      );

      if (existingUser.records.length > 0) {
        return reply.code(409).send({ error: 'Username or email already exists' });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await session.run(
        `CREATE (u:User {
          username: $username,
          email: $email,
          password_hash: $password,
          role: 'user',
          created_at: timestamp(),
          is_banned: false
        })
        RETURN u`,
        { username, email, password: hashedPassword }
      );

      const user = result.records[0]?.get('u')?.properties;

      if (!user) {
        console.error('Failed - no user data:', result.records[0]);
        return reply.code(500).send({ error: 'Failed to create user' });
      }

      const token = generateToken(user);

      return reply.code(201).send({
        message: 'User registered successfully',
        token,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      fastify.log.error('Registration error:', err);
      console.error('Full error:', err.message, err.stack);
      return reply.code(500).send({ error: `Registration failed: ${err.message}` });
    } finally {
      await session.close();
    }
  });

  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: 'Missing username or password' });
    }

    const session = getSession();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username }
      );

      if (result.records.length === 0) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const user = result.records[0]?.get('u')?.properties;

      if (user.is_banned) {
        return reply.code(403).send({ error: 'This account has been banned' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = generateToken(user);

      return reply.code(200).send({
        message: 'Login successful',
        token,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Login failed' });
    } finally {
      await session.close();
    }
  });

  // Get current user info (protected)
  fastify.get('/auth/me', { onRequest: [authMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username: request.user.username }
      );

      const user = result.records[0]?.get('u')?.properties;

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.code(200).send({
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch user' });
    } finally {
      await session.close();
    }
  });

  // Refresh token (protected)
  fastify.post('/auth/refresh', { onRequest: [authMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      const result = await session.run(
        'MATCH (u:User {username: $username}) RETURN u',
        { username: request.user.username }
      );

      const user = result.records[0]?.get('u')?.properties;

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const newToken = generateToken(user);

      return reply.code(200).send({
        token: newToken,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Token refresh failed' });
    } finally {
      await session.close();
    }
  });

  // Logout (just tells frontend to clear token)
  fastify.post('/auth/logout', { onRequest: [authMiddleware] }, async (request, reply) => {
    return reply.code(200).send({ message: 'Logged out successfully' });
  });
}

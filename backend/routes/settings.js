import { getSession } from '../neo4j/driver.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';
import { logEvent } from '../utils/logger.js';

// Default settings
const DEFAULT_SETTINGS = {
  max_upload_size_mb: 50,
  max_users: 100,
  maintenance_mode: false,
  api_rate_limit: 1000,
  api_rate_window_minutes: 60,
};

export default async function settingsRoutes(fastify) {
  // Initialize settings on first run
  async function initializeSettings() {
    const session = getSession();
    try {
      const existing = await session.run('MATCH (s:Settings) RETURN s LIMIT 1');
      if (existing.records.length === 0) {
        await session.run(
          `CREATE (s:Settings {
            max_upload_size_mb: $max_upload_size_mb,
            max_users: $max_users,
            maintenance_mode: $maintenance_mode,
            api_rate_limit: $api_rate_limit,
            api_rate_window_minutes: $api_rate_window_minutes,
            created_at: timestamp(),
            updated_at: timestamp()
          })`,
          DEFAULT_SETTINGS
        );
      }
    } finally {
      await session.close();
    }
  }

  // Initialize settings on startup (don't block if it fails)
  try {
    await initializeSettings();
  } catch (err) {
    fastify.log.warn('Failed to initialize settings during startup:', err.message);
  }

  // Get settings (admin only)
  fastify.get('/settings', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const session = getSession();
    try {
      const result = await session.run('MATCH (s:Settings) RETURN s LIMIT 1');

      if (result.records.length === 0) {
        return reply.code(200).send({ settings: DEFAULT_SETTINGS });
      }

      const settings = result.records[0]?.get('s')?.properties;

      return reply.code(200).send({
        settings: {
          max_upload_size_mb: settings.max_upload_size_mb,
          max_users: settings.max_users,
          maintenance_mode: settings.maintenance_mode,
          api_rate_limit: settings.api_rate_limit,
          api_rate_window_minutes: settings.api_rate_window_minutes,
          updated_at: settings.updated_at,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to fetch settings' });
    } finally {
      await session.close();
    }
  });

  // Update settings (admin only)
  fastify.put('/settings', { onRequest: [adminMiddleware] }, async (request, reply) => {
    const {
      max_upload_size_mb,
      max_users,
      maintenance_mode,
      api_rate_limit,
      api_rate_window_minutes,
    } = request.body;

    const session = getSession();
    try {
      const updates = [];
      const params = {};

      if (max_upload_size_mb !== undefined) {
        updates.push('s.max_upload_size_mb = $max_upload_size_mb');
        params.max_upload_size_mb = max_upload_size_mb;
      }

      if (max_users !== undefined) {
        updates.push('s.max_users = $max_users');
        params.max_users = max_users;
      }

      if (maintenance_mode !== undefined) {
        updates.push('s.maintenance_mode = $maintenance_mode');
        params.maintenance_mode = maintenance_mode;
      }

      if (api_rate_limit !== undefined) {
        updates.push('s.api_rate_limit = $api_rate_limit');
        params.api_rate_limit = api_rate_limit;
      }

      if (api_rate_window_minutes !== undefined) {
        updates.push('s.api_rate_window_minutes = $api_rate_window_minutes');
        params.api_rate_window_minutes = api_rate_window_minutes;
      }

      if (updates.length === 0) {
        return reply.code(400).send({ error: 'No fields to update' });
      }

      updates.push('s.updated_at = timestamp()');

      const result = await session.run(
        `MATCH (s:Settings)
        SET ${updates.join(', ')}
        RETURN s`,
        params
      );

      const settings = result.records[0]?.get('s')?.properties;

      await logEvent(request.user.username, 'update_settings', 'Updated system settings', request.ip);

      return reply.code(200).send({
        message: 'Settings updated',
        settings: {
          max_upload_size_mb: settings.max_upload_size_mb,
          max_users: settings.max_users,
          maintenance_mode: settings.maintenance_mode,
          api_rate_limit: settings.api_rate_limit,
          api_rate_window_minutes: settings.api_rate_window_minutes,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update settings' });
    } finally {
      await session.close();
    }
  });
}

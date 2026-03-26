import { getSession } from '../neo4j/driver.js';

export async function logEvent(username, action, details = '', ip = 'system') {
  const session = getSession();
  try {
    await session.run(`
      CREATE (l:Log {
        username: $username,
        action: $action,
        details: $details,
        timestamp: timestamp(),
        ip: $ip
      })
    `, { username, action, details, ip });
  } catch (err) {
    console.error('Failed to log event:', err);
  } finally {
    await session.close();
  }
}

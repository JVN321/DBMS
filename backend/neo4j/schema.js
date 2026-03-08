import { getSession } from './driver.js';

export async function ensureSchema() {
  const session = getSession();
  try {
    // Wallet & Coin constraints
    await session.run(
      'CREATE CONSTRAINT wallet_address IF NOT EXISTS FOR (w:Wallet) REQUIRE w.address IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT coin_name IF NOT EXISTS FOR (c:Coin) REQUIRE c.name IS UNIQUE'
    );

    // User constraints (username and email must be unique)
    await session.run(
      'CREATE CONSTRAINT user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE'
    );

    // Indexes for performance
    await session.run(
      'CREATE INDEX transfer_timestamp IF NOT EXISTS FOR ()-[t:TRANSFER]-() ON (t.timestamp)'
    );
    await session.run(
      'CREATE INDEX transfer_txid IF NOT EXISTS FOR ()-[t:TRANSFER]-() ON (t.txid)'
    );
    await session.run(
      'CREATE INDEX user_created_at IF NOT EXISTS FOR (u:User) ON (u.created_at)'
    );
  } finally {
    await session.close();
  }
}

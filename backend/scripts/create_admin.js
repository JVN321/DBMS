import bcrypt from 'bcrypt';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'neo4j';
const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

async function createAdmin() {
  console.log(`Connecting to Neo4j at ${URI}...`);
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session({ database: DATABASE });

  const adminUsername = process.argv[2] || 'admin';
  const adminPassword = process.argv[3] || 'admin123';
  const adminEmail = process.argv[4] || 'admin@example.com';

  try {
    // Check if user already exists
    const existing = await session.run(
      'MATCH (u:User {username: $username}) RETURN u',
      { username: adminUsername }
    );

    if (existing.records.length > 0) {
      console.log(`User '${adminUsername}' already exists. Updating role to admin...`);
      await session.run(
        'MATCH (u:User {username: $username}) SET u.role = "admin" RETURN u',
        { username: adminUsername }
      );
      console.log('Role updated successfully.');
      
      // If password was provided as an argument, update it too
      if (process.argv[3]) {
        console.log('Updating password as well...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await session.run(
          'MATCH (u:User {username: $username}) SET u.password_hash = $password RETURN u',
          { username: adminUsername, password: hashedPassword }
        );
        console.log('Password updated.');
      }
    } else {
      console.log(`Creating new admin user '${adminUsername}'...`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await session.run(
        `CREATE (u:User {
          username: $username,
          email: $email,
          password_hash: $password,
          role: 'admin',
          created_at: timestamp(),
          is_banned: false
        })
        RETURN u`,
        { 
          username: adminUsername, 
          email: adminEmail, 
          password: hashedPassword 
        }
      );
      console.log(`Admin user created successfully!`);
      console.log(`Username: ${adminUsername}`);
      console.log(`Password: ${adminPassword}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await session.close();
    await driver.close();
    console.log('Disconnected from database.');
    process.exit(0);
  }
}

createAdmin();

import { db } from './db';

async function testConnection() {
  try {
    // Try to query the database
    const result = await db.query.users.findFirst();
    console.log('Database connection successful!');
    console.log('First user:', result);
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection(); 
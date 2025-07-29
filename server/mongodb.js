import { MongoClient } from 'mongodb';

let client;
let db;

const MONGO_URI = process.env.MONGO_URI

export async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      db = client.db('Rank');
      console.log('✅ Connected to MongoDB');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongoDB first.');
  }
  return db;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('📤 MongoDB connection closed');
  }
}
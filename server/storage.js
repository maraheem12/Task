import { getDB } from './mongodb.js';
import { ObjectId } from 'mongodb';

class MongoStorage {
  constructor() {
    this.usersCollection = 'users';
    this.historyCollection = 'pointsHistory';
  }

  getDB() {
    return getDB();
  }

  async getAllUsers() {
    const db = this.getDB();
    const users = await db.collection(this.usersCollection)
      .find({})
      .sort({ totalPoints: -1, name: 1 })
      .toArray();

    // Calculate ranks
    return users.map((user, index) => ({
      id: user._id.toString(),
      name: user.name,
      totalPoints: user.totalPoints || 0,
      rank: index + 1,
      lastClaimAt: user.lastClaimAt
    }));
  }

  async getUserById(id) {
    const db = this.getDB();
    const user = await db.collection(this.usersCollection)
      .findOne({ _id: new ObjectId(id) });
    
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      name: user.name,
      totalPoints: user.totalPoints || 0,
      lastClaimAt: user.lastClaimAt
    };
  }

  async addUser(userData) {
    const db = this.getDB();
    
    // Check if user already exists
    const existingUser = await db.collection(this.usersCollection)
      .findOne({ name: userData.name });
    
    if (existingUser) {
      throw new Error('User with this name already exists');
    }

    const newUser = {
      name: userData.name,
      totalPoints: 0,
      lastClaimAt: null,
      createdAt: new Date()
    };

    const result = await db.collection(this.usersCollection)
      .insertOne(newUser);

    return {
      id: result.insertedId.toString(),
      name: newUser.name,
      totalPoints: newUser.totalPoints,
      lastClaimAt: newUser.lastClaimAt
    };
  }

  async updateUserPoints(userId, pointsToAdd) {
    const db = this.getDB();
    const now = new Date();

    const result = await db.collection(this.usersCollection)
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { 
          $inc: { totalPoints: pointsToAdd },
          $set: { lastClaimAt: now }
        },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      throw new Error('User not found');
    }

    return {
      id: result.value._id.toString(),
      name: result.value.name,
      totalPoints: result.value.totalPoints,
      lastClaimAt: result.value.lastClaimAt
    };
  }

  async addPointsHistory(userId, pointsAwarded, userName) {
    const db = this.getDB();
    
    const historyEntry = {
      userId: new ObjectId(userId),
      userName: userName,
      pointsAwarded: pointsAwarded,
      claimedAt: new Date()
    };

    const result = await db.collection(this.historyCollection)
      .insertOne(historyEntry);

    return {
      id: result.insertedId.toString(),
      userId: userId,
      userName: userName,
      pointsAwarded: pointsAwarded,
      claimedAt: historyEntry.claimedAt
    };
  }

  async getPointsHistory(limit = 50) {
    const db = this.getDB();
    const history = await db.collection(this.historyCollection)
      .find({})
      .sort({ claimedAt: -1 })
      .limit(limit)
      .toArray();

    return history.map(entry => ({
      id: entry._id.toString(),
      userId: entry.userId.toString(),
      userName: entry.userName,
      pointsAwarded: entry.pointsAwarded,
      claimedAt: entry.claimedAt
    }));
  }

  async getStats() {
    const db = this.getDB();
    
    const [userCount, claimCount] = await Promise.all([
      db.collection(this.usersCollection).countDocuments(),
      db.collection(this.historyCollection).countDocuments()
    ]);

    // Get total points across all users
    const totalPointsResult = await db.collection(this.usersCollection)
      .aggregate([
        { $group: { _id: null, total: { $sum: '$totalPoints' } } }
      ]).toArray();

    const totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;

    return {
      totalUsers: userCount,
      totalClaims: claimCount,
      totalPoints: totalPoints
    };
  }
}

// In-memory storage for fallback (kept for compatibility)
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.pointsHistory = [];
    this.nextUserId = 1;
    this.nextHistoryId = 1;
  }

  async getAllUsers() {
    const users = Array.from(this.users.values())
      .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name))
      .map((user, index) => ({ ...user, rank: index + 1 }));
    return users;
  }

  async getUserById(id) {
    return this.users.get(id) || null;
  }

  async addUser(userData) {
    const existingUser = Array.from(this.users.values())
      .find(user => user.name === userData.name);
    
    if (existingUser) {
      throw new Error('User with this name already exists');
    }

    const id = this.nextUserId.toString();
    this.nextUserId++;

    const user = {
      id,
      name: userData.name,
      totalPoints: 0,
      lastClaimAt: null,
    };

    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(userId, pointsToAdd) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.totalPoints += pointsToAdd;
    user.lastClaimAt = new Date().toISOString();
    return user;
  }

  async addPointsHistory(userId, pointsAwarded, userName) {
    const id = this.nextHistoryId.toString();
    this.nextHistoryId++;

    const historyEntry = {
      id,
      userId,
      userName,
      pointsAwarded,
      claimedAt: new Date().toISOString(),
    };

    this.pointsHistory.unshift(historyEntry);
    return historyEntry;
  }

  async getPointsHistory(limit = 50) {
    return this.pointsHistory.slice(0, limit);
  }

  async getStats() {
    const totalUsers = this.users.size;
    const totalClaims = this.pointsHistory.length;
    const totalPoints = Array.from(this.users.values())
      .reduce((sum, user) => sum + user.totalPoints, 0);

    return {
      totalUsers,
      totalClaims,
      totalPoints,
    };
  }
}

// Export the storage instance
let storage;

function initializeStorage(useMongoDB = true) {
  if (useMongoDB) {
    storage = new MongoStorage();
    console.log('🗄️ Using MongoDB storage');
  } else {
    storage = new MemoryStorage();
    console.log('🧠 Using in-memory storage');
  }
  return storage;
}

function getStorage() {
  if (!storage) {
    throw new Error('Storage not initialized. Call initializeStorage first.');
  }
  return storage;
}

export {
  MongoStorage,
  MemoryStorage,
  initializeStorage,
  getStorage
};
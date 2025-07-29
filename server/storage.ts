import { randomUUID } from "crypto";
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = 'mongodb+srv://maraheem812:zG4tqJlp8dNbhxUo@cluster0.5nfthfm.mongodb.net/Rank?retryWrites=true&w=majority&appName=Cluster0';

export class MemStorage {
  private client: MongoClient | null = null;
  private db: any = null;
  private useMongoDB = true;
  constructor() {
    this.users = new Map();
    this.pointsHistory = new Map();
    this.initializeMongoDB();
  }

  async initializeMongoDB() {
    try {
      this.client = new MongoClient(MONGO_URI);
      await this.client.connect();
      this.db = this.client.db('Rank');
      console.log('✅ Connected to MongoDB');
      await this.initializeDefaultUsers();
    } catch (error) {
      console.error('❌ MongoDB connection failed, using in-memory storage:', error);
      this.useMongoDB = false;
      await this.initializeDefaultUsers();
    }
  }

  async initializeDefaultUsers() {
    if (this.useMongoDB && this.db) {
      // Check if users already exist in MongoDB
      const existingUsers = await this.db.collection('users').countDocuments();
      if (existingUsers > 0) {
        console.log('📋 Using existing MongoDB users');
        return;
      }
    }

    const defaultUsers = [
      { name: "Rahul" },
      { name: "Kamal" },
      { name: "Sanak" },
      { name: "Priya" },
      { name: "Amit" },
      { name: "Neha" },
      { name: "Rohan" },
      { name: "Sneha" },
      { name: "Vikram" },
      { name: "Anita" }
    ];

    for (const userData of defaultUsers) {
      await this.createUser(userData);
    }
  }

  async getUser(id) {
    if (this.useMongoDB && this.db) {
      try {
        const user = await this.db.collection('users').findOne({ _id: new ObjectId(id) });
        if (user) {
          return {
            id: user._id.toString(),
            name: user.name,
            totalPoints: user.totalPoints || 0,
            rank: user.rank || 0,
            lastClaimAt: user.lastClaimAt
          };
        }
        return null;
      } catch (error) {
        console.error('MongoDB getUser error:', error);
        return this.users.get(id);
      }
    }
    return this.users.get(id);
  }

  async getUserByName(name) {
    if (this.useMongoDB && this.db) {
      try {
        const user = await this.db.collection('users').findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        if (user) {
          return {
            id: user._id.toString(),
            name: user.name,
            totalPoints: user.totalPoints || 0,
            rank: user.rank || 0,
            lastClaimAt: user.lastClaimAt
          };
        }
        return null;
      } catch (error) {
        console.error('MongoDB getUserByName error:', error);
      }
    }
    
    return Array.from(this.users.values()).find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createUser(insertUser) {
    if (this.useMongoDB && this.db) {
      try {
        const newUser = {
          name: insertUser.name,
          totalPoints: 0,
          rank: 0,
          lastClaimAt: null,
          createdAt: new Date()
        };
        
        const result = await this.db.collection('users').insertOne(newUser);
        const user = {
          id: result.insertedId.toString(),
          name: newUser.name,
          totalPoints: newUser.totalPoints,
          rank: newUser.rank,
          lastClaimAt: newUser.lastClaimAt
        };
        await this.updateRankings();
        return user;
      } catch (error) {
        console.error('MongoDB createUser error:', error);
        // Fallback to in-memory
      }
    }
    
    const id = randomUUID();
    const user = { 
      ...insertUser, 
      id, 
      totalPoints: 0, 
      rank: 0,
      lastClaimAt: null
    };
    this.users.set(id, user);
    await this.updateRankings();
    return user;
  }

  async getAllUsers() {
    if (this.useMongoDB && this.db) {
      try {
        const users = await this.db.collection('users')
          .find({})
          .sort({ totalPoints: -1, name: 1 })
          .toArray();
        
        return users.map((user, index) => ({
          id: user._id.toString(),
          name: user.name,
          totalPoints: user.totalPoints || 0,
          rank: index + 1,
          lastClaimAt: user.lastClaimAt
        }));
      } catch (error) {
        console.error('MongoDB getAllUsers error:', error);
      }
    }
    
    return Array.from(this.users.values()).sort((a, b) => a.rank - b.rank);
  }

  async updateUser(id, updates) {
    if (this.useMongoDB && this.db) {
      try {
        const result = await this.db.collection('users').findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: 'after' }
        );
        
        if (result.value) {
          return {
            id: result.value._id.toString(),
            name: result.value.name,
            totalPoints: result.value.totalPoints || 0,
            rank: result.value.rank || 0,
            lastClaimAt: result.value.lastClaimAt
          };
        }
        return null;
      } catch (error) {
        console.error('MongoDB updateUser error:', error);
      }
    }
    
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createPointsHistory(insertHistory) {
    if (this.useMongoDB && this.db) {
      try {
        const historyEntry = {
          ...insertHistory,
          claimedAt: new Date(),
        };
        
        const result = await this.db.collection('pointsHistory').insertOne(historyEntry);
        return {
          id: result.insertedId.toString(),
          ...historyEntry
        };
      } catch (error) {
        console.error('MongoDB createPointsHistory error:', error);
      }
    }
    
    const id = randomUUID();
    const history = {
      ...insertHistory,
      id,
      claimedAt: new Date(),
    };
    this.pointsHistory.set(id, history);
    return history;
  }

  async getPointsHistory(limit = 50) {
    if (this.useMongoDB && this.db) {
      try {
        const history = await this.db.collection('pointsHistory')
          .find({})
          .sort({ claimedAt: -1 })
          .limit(limit)
          .toArray();
        
        return history.map(entry => ({
          id: entry._id.toString(),
          userId: entry.userId,
          userName: entry.userName,
          pointsAwarded: entry.pointsAwarded,
          claimedAt: entry.claimedAt
        }));
      } catch (error) {
        console.error('MongoDB getPointsHistory error:', error);
      }
    }
    
    return Array.from(this.pointsHistory.values())
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())
      .slice(0, limit);
  }

  async getUserPointsHistory(userId) {
    if (this.useMongoDB && this.db) {
      try {
        const history = await this.db.collection('pointsHistory')
          .find({ userId: userId })
          .sort({ claimedAt: -1 })
          .toArray();
        
        return history.map(entry => ({
          id: entry._id.toString(),
          userId: entry.userId,
          userName: entry.userName,
          pointsAwarded: entry.pointsAwarded,
          claimedAt: entry.claimedAt
        }));
      } catch (error) {
        console.error('MongoDB getUserPointsHistory error:', error);
      }
    }
    
    return Array.from(this.pointsHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
  }

  async getStats() {
    if (this.useMongoDB && this.db) {
      try {
        const [userCount, claimCount] = await Promise.all([
          this.db.collection('users').countDocuments(),
          this.db.collection('pointsHistory').countDocuments()
        ]);

        const totalPointsResult = await this.db.collection('users')
          .aggregate([
            { $group: { _id: null, total: { $sum: '$totalPoints' } } }
          ]).toArray();

        const totalPoints = totalPointsResult.length > 0 ? totalPointsResult[0].total : 0;

        return {
          totalUsers: userCount,
          totalClaims: claimCount,
          totalPoints: totalPoints
        };
      } catch (error) {
        console.error('MongoDB getStats error:', error);
      }
    }
    
    // Fallback to in-memory calculation
    const totalUsers = this.users.size;
    const totalClaims = this.pointsHistory.size;
    const totalPoints = Array.from(this.users.values())
      .reduce((sum, user) => sum + user.totalPoints, 0);

    return {
      totalUsers,
      totalClaims,
      totalPoints,
    };
  }

  async updateRankings() {
    if (this.useMongoDB && this.db) {
      try {
        const users = await this.db.collection('users')
          .find({})
          .sort({ totalPoints: -1, name: 1 })
          .toArray();
        
        for (let i = 0; i < users.length; i++) {
          await this.db.collection('users').updateOne(
            { _id: users[i]._id },
            { $set: { rank: i + 1 } }
          );
        }
        return;
      } catch (error) {
        console.error('MongoDB updateRankings error:', error);
      }
    }
    
    const users = Array.from(this.users.values());
    const sortedUsers = users.sort((a, b) => b.totalPoints - a.totalPoints);
    
    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];
      user.rank = i + 1;
      this.users.set(user.id, user);
    }
  }
}

export const storage = new MemStorage();

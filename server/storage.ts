import { randomUUID } from "crypto";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.pointsHistory = new Map();
    this.initializeDefaultUsers();
  }

  async initializeDefaultUsers() {
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
    return this.users.get(id);
  }

  async getUserByName(name) {
    return Array.from(this.users.values()).find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createUser(insertUser) {
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
    return Array.from(this.users.values()).sort((a, b) => a.rank - b.rank);
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createPointsHistory(insertHistory) {
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
    return Array.from(this.pointsHistory.values())
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())
      .slice(0, limit);
  }

  async getUserPointsHistory(userId) {
    return Array.from(this.pointsHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
  }

  async updateRankings() {
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

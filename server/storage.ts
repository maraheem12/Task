import { type User, type InsertUser, type PointsHistory, type InsertPointsHistory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Points history operations
  createPointsHistory(history: InsertPointsHistory): Promise<PointsHistory>;
  getPointsHistory(limit?: number): Promise<PointsHistory[]>;
  getUserPointsHistory(userId: string): Promise<PointsHistory[]>;
  
  // Leaderboard operations
  updateRankings(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pointsHistory: Map<string, PointsHistory>;

  constructor() {
    this.users = new Map();
    this.pointsHistory = new Map();
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
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

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => a.rank - b.rank);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createPointsHistory(insertHistory: InsertPointsHistory): Promise<PointsHistory> {
    const id = randomUUID();
    const history: PointsHistory = {
      ...insertHistory,
      id,
      claimedAt: new Date(),
    };
    this.pointsHistory.set(id, history);
    return history;
  }

  async getPointsHistory(limit: number = 50): Promise<PointsHistory[]> {
    return Array.from(this.pointsHistory.values())
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime())
      .slice(0, limit);
  }

  async getUserPointsHistory(userId: string): Promise<PointsHistory[]> {
    return Array.from(this.pointsHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
  }

  async updateRankings(): Promise<void> {
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

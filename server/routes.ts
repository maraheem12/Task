import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPointsHistorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app) {
  
  // Get all users with rankings
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Add new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByName(userData.name);
      if (existingUser) {
        return res.status(400).json({ message: "User with this name already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Claim points for a user
  app.post("/api/users/:userId/claim", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate random points between 1-10
      const pointsAwarded = Math.floor(Math.random() * 10) + 1;
      
      // Update user's total points and last claim time
      const updatedUser = await storage.updateUser(userId, {
        totalPoints: user.totalPoints + pointsAwarded,
        lastClaimAt: new Date(),
      });

      // Create points history entry
      await storage.createPointsHistory({
        userId,
        pointsAwarded,
      });

      // Update rankings
      await storage.updateRankings();

      res.json({
        user: updatedUser,
        pointsAwarded,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim points" });
    }
  });

  // Get points history
  app.get("/api/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getPointsHistory(limit);
      
      // Enrich with user names
      const enrichedHistory = await Promise.all(
        history.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            userName: user?.name || "Unknown User"
          };
        })
      );

      res.json(enrichedHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Get user statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const history = await storage.getPointsHistory();
      
      res.json({
        totalUsers: users.length,
        totalClaims: history.length,
        totalPoints: users.reduce((sum, user) => sum + user.totalPoints, 0),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

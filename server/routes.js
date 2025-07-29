import { getStorage } from './storage.js';

export function setupRoutes(app) {
  // Get all users with rankings
  app.get('/api/users', async (req, res) => {
    try {
      const storage = getStorage();
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Add a new user
  app.post('/api/users', async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const storage = getStorage();
      const user = await storage.addUser({ name: name.trim() });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add user' });
      }
    }
  });

  // Claim points for a user
  app.post('/api/users/:userId/claim', async (req, res) => {
    try {
      const { userId } = req.params;
      const storage = getStorage();
      
      // Get user first to validate existence
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate random points (1-10)
      const pointsAwarded = Math.floor(Math.random() * 10) + 1;
      
      // Update user points
      const updatedUser = await storage.updateUserPoints(userId, pointsAwarded);
      
      // Add to history
      await storage.addPointsHistory(userId, pointsAwarded, user.name);
      
      res.json({
        user: updatedUser,
        pointsAwarded
      });
    } catch (error) {
      console.error('Error claiming points:', error);
      res.status(500).json({ error: 'Failed to claim points' });
    }
  });

  // Get points history
  app.get('/api/history', async (req, res) => {
    try {
      const storage = getStorage();
      const history = await storage.getPointsHistory();
      res.json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Get system statistics
  app.get('/api/stats', async (req, res) => {
    try {
      const storage = getStorage();
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      storage: getStorage().constructor.name
    });
  });
}


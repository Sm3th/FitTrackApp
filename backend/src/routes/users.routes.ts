import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { db } from '../services/prisma.service';

const router = Router();
router.use(authenticateToken);

// GET /api/users/me — current user + profile
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/me — update name / username
router.patch('/me', async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, username } = req.body;
    const updated = await db.updateUser(req.user!.id, {
      ...(fullName  !== undefined && { fullName }),
      ...(username  !== undefined && { username }),
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// GET /api/users/me/profile — fitness profile
router.get('/me/profile', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await db.getProfile(req.user!.id);
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/me/profile — upsert fitness profile
router.put('/me/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { age, gender, height, currentWeight, targetWeight, activityLevel, fitnessGoal, experienceLevel } = req.body;
    const profile = await db.createOrUpdateProfile(req.user!.id, {
      ...(age             != null && { age:             Number(age) }),
      ...(gender                  && { gender }),
      ...(height          != null && { height:          Number(height) }),
      ...(currentWeight   != null && { currentWeight:   Number(currentWeight) }),
      ...(targetWeight    != null && { targetWeight:    Number(targetWeight) }),
      ...(activityLevel           && { activityLevel }),
      ...(fitnessGoal             && { fitnessGoal }),
      ...(experienceLevel         && { experienceLevel }),
    });
    return res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// GET /api/users/leaderboard — top users by workout count (last 30 days)
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const leaderboard = await db.getLeaderboard(30);
    return res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

export default router;

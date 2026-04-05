import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { db } from '../services/prisma.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Start workout session
router.post('/sessions/start', async (req: AuthRequest, res: Response) => {
  try {
    const { name, notes } = req.body;
    const userId = req.user!.id;

    const session = await db.startWorkoutSession(userId, { name, notes });

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Workout session started',
    });
  } catch (error: any) {
    console.error('Start workout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start workout session',
    });
  }
});

// Get user's workout sessions
router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const sessions = await db.getUserWorkoutSessions(userId, limit);

    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error('Get workout sessions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workout sessions',
    });
  }
});

// Get specific workout session
router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await db.getWorkoutSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Workout session not found',
      });
    }

    // Check if session belongs to user
    if (session.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    return res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Get workout session error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workout session',
    });
  }
});

// End workout session
router.patch('/sessions/:id/end', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await db.getWorkoutSession(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Workout session not found',
      });
    }

    // Check if session belongs to user
    if (session.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const updatedSession = await db.endWorkoutSession(id);

    return res.json({
      success: true,
      data: updatedSession,
      message: 'Workout session ended',
    });
  } catch (error: any) {
    console.error('End workout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end workout session',
    });
  }
});

// Add exercise set
router.post('/sets', async (req: AuthRequest, res: Response) => {
  try {
    const { workoutSessionId, exerciseId, setNumber, reps, weight, duration, distance, notes } = req.body;
    
    const set = await db.addExerciseSet({
      workoutSessionId,
      exerciseId,
      setNumber,
      reps,
      weight,
      duration,
      distance,
      notes,
    });

    return res.status(201).json({
      success: true,
      data: set,
      message: 'Exercise set added',
    });
  } catch (error: any) {
    console.error('Add set error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add exercise set',
    });
  }
});

export default router;
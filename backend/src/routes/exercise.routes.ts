import { Router, Request, Response } from 'express';
import { db } from '../services/prisma.service';

const router = Router();

// Get all exercises
router.get('/', async (req: Request, res: Response) => {
  try {
    const exercises = await db.getAllExercises();
    return res.json({
      success: true,
      data: exercises,
    });
  } catch (error: any) {
    console.error('Get exercises error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch exercises',
    });
  }
});

// Get exercise by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exercise = await db.getExerciseById(id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found',
      });
    }

    return res.json({
      success: true,
      data: exercise,
    });
  } catch (error: any) {
    console.error('Get exercise error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch exercise',
    });
  }
});

// Get exercises by muscle group
router.get('/muscle/:muscleGroup', async (req: Request, res: Response) => {
  try {
    const { muscleGroup } = req.params;
    const exercises = await db.getExercisesByMuscleGroup(muscleGroup);

    return res.json({
      success: true,
      data: exercises,
    });
  } catch (error: any) {
    console.error('Get exercises by muscle group error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch exercises',
    });
  }
});

export default router;

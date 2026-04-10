import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { addNutritionSchema } from '../schemas';
import { db } from '../services/prisma.service';

const router = Router();
router.use(authenticateToken);

// GET /api/nutrition?date=YYYY-MM-DD
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const dateStr = req.query.date as string;
    const date = dateStr ? new Date(dateStr) : new Date();
    const logs = await db.getNutritionLogsByDate(userId, date);
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Get nutrition error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch nutrition logs' });
  }
});

// POST /api/nutrition
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // Accept both old (name/meal/fat) and new (foodName/mealType/fats) field names
    const { name, foodName, calories, protein, carbs, fat, fats, meal, mealType, date } = req.body;
    const resolvedName = foodName || name;
    if (!resolvedName || calories == null) {
      return res.status(400).json({ success: false, error: 'foodName and calories are required' });
    }
    const log = await db.addNutritionLog(userId, {
      foodName: resolvedName,
      mealType: mealType || meal || 'snack',
      calories: Number(calories),
      protein: protein != null ? Number(protein) : null,
      carbs: carbs != null ? Number(carbs) : null,
      fats: fats != null ? Number(fats) : fat != null ? Number(fat) : null,
      date: date ? new Date(date) : new Date(),
    });
    return res.status(201).json({ success: true, data: log });
  } catch (err) {
    console.error('Add nutrition error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add nutrition log' });
  }
});

// DELETE /api/nutrition/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteNutritionLog(req.params.id);
    return res.json({ success: true, message: 'Nutrition log deleted' });
  } catch (err) {
    console.error('Delete nutrition error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete nutrition log' });
  }
});

export default router;

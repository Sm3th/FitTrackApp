import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { db } from '../services/prisma.service';

const router = Router();
router.use(authenticateToken);

// Serialize frontend goal data into the `target` JSON field
const toDbGoal = (body: any) => {
  const { title, description, unit, startDate, targetDate, status, emoji, type, targetValue, currentValue } = body;
  const meta = JSON.stringify({ title, description, unit, startDate, status, emoji });
  return {
    type: type || 'custom',
    target: meta,
    targetValue: targetValue != null ? Number(targetValue) : null,
    currentValue: currentValue != null ? Number(currentValue) : 0,
    deadline: targetDate ? new Date(targetDate) : null,
  };
};

// Parse a DB goal record back to the frontend shape
const fromDbGoal = (r: any) => {
  let meta: any = {};
  try { meta = JSON.parse(r.target || '{}'); } catch {}
  return {
    id: r.id,
    type: r.type,
    title: meta.title || r.target,
    description: meta.description || '',
    targetValue: r.targetValue,
    currentValue: r.currentValue ?? 0,
    unit: meta.unit || '',
    startDate: meta.startDate || r.createdAt?.toISOString?.()?.slice(0, 10) || '',
    targetDate: r.deadline ? new Date(r.deadline).toISOString().slice(0, 10) : '',
    status: r.achieved ? 'completed' : (meta.status || 'active'),
    emoji: meta.emoji || '🎯',
  };
};

// GET /api/goals
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const goals = await db.getGoals(req.user!.id);
    return res.json({ success: true, data: goals.map(fromDbGoal) });
  } catch (err) {
    console.error('Get goals error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch goals' });
  }
});

// POST /api/goals
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.title || req.body.targetValue == null) {
      return res.status(400).json({ success: false, error: 'title and targetValue are required' });
    }
    const goal = await db.createGoal(req.user!.id, toDbGoal(req.body));
    return res.status(201).json({ success: true, data: fromDbGoal(goal) });
  } catch (err) {
    console.error('Create goal error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create goal' });
  }
});

// PATCH /api/goals/:id
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { currentValue, status } = req.body;
    const data: any = {};
    if (currentValue != null) data.currentValue = Number(currentValue);
    if (status === 'completed') { data.achieved = true; data.achievedAt = new Date(); }
    const goal = await db.updateGoal(req.params.id, data);
    return res.json({ success: true, data: fromDbGoal(goal) });
  } catch (err) {
    console.error('Update goal error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update goal' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteGoal(req.params.id);
    return res.json({ success: true, message: 'Goal deleted' });
  } catch (err) {
    console.error('Delete goal error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete goal' });
  }
});

export default router;

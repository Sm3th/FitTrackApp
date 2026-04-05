import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { addMetricSchema } from '../schemas';
import { db } from '../services/prisma.service';

const router = Router();
router.use(authenticateToken);

// GET /api/metrics?limit=30
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const metrics = await db.getBodyMetrics(userId, limit);
    return res.json({ success: true, data: metrics });
  } catch (err) {
    console.error('Get metrics error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch body metrics' });
  }
});

// GET /api/metrics/latest
router.get('/latest', async (req: AuthRequest, res: Response) => {
  try {
    const metric = await db.getLatestBodyMetric(req.user!.id);
    return res.json({ success: true, data: metric });
  } catch (err) {
    console.error('Get latest metric error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch latest metric' });
  }
});

// POST /api/metrics
router.post('/', validate(addMetricSchema), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { weight, bodyFat, chest, waist, hips, arms, legs, date, notes } = req.body;
    const metric = await db.addBodyMetric(userId, {
      weight:  weight  ? Number(weight)  : null,
      bodyFat: bodyFat ? Number(bodyFat) : null,
      chest:   chest   ? Number(chest)   : null,
      waist:   waist   ? Number(waist)   : null,
      hips:    hips    ? Number(hips)    : null,
      arms:    arms    ? Number(arms)    : null,
      legs:    legs    ? Number(legs)    : null,
      notes:   notes   || null,
      date:    date    ? new Date(date)  : new Date(),
    });
    return res.status(201).json({ success: true, data: metric });
  } catch (err) {
    console.error('Add metric error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add body metric' });
  }
});

// DELETE /api/metrics/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await db.deleteBodyMetric(req.params.id);
    return res.json({ success: true, message: 'Body metric deleted' });
  } catch (err) {
    console.error('Delete metric error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete body metric' });
  }
});

export default router;

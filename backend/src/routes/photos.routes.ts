import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/photos — list user's progress photos (without image data for speed)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const photos = await prisma.progressPhoto.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
      select: { id: true, date: true, weight: true, notes: true, createdAt: true },
    });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch photos' });
  }
});

// GET /api/photos/:id — fetch single photo including image data
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const photo = await prisma.progressPhoto.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!photo) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: photo });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch photo' });
  }
});

// POST /api/photos — upload a progress photo
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { imageData, weight, notes, date } = req.body;
    if (!imageData) return res.status(400).json({ success: false, error: 'imageData is required' });

    const photo = await prisma.progressPhoto.create({
      data: {
        userId: req.user.userId,
        imageData,
        weight: weight != null ? Number(weight) : null,
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
      },
      select: { id: true, date: true, weight: true, notes: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save photo' });
  }
});

// DELETE /api/photos/:id
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const existing = await prisma.progressPhoto.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
    });
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    await prisma.progressPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete photo' });
  }
});

export default router;

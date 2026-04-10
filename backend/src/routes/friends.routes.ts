import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
router.use(authenticateToken);

// Use a direct PrismaClient to avoid type issues from stale generated client
const prisma = new PrismaClient();

// ── GET /api/friends/discover ─────────────────────────────
// Returns all users (except self) with follow status + workout count
router.get('/discover', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;
    const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : '';
    const like = `%${q}%`;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        u.id          AS userId,
        u.username,
        u.fullName,
        COUNT(DISTINCT ws.id)                  AS workouts,
        COALESCE(SUM(es.weight * es.reps), 0)  AS totalVolume,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS isFollowing
      FROM "User" u
      LEFT JOIN "WorkoutSession" ws ON ws."userId" = u.id AND ws."endTime" IS NOT NULL
      LEFT JOIN "ExerciseSet"    es ON es."workoutSessionId" = ws.id
      LEFT JOIN "Follow"         f  ON f."followerId" = ${me} AND f."followingId" = u.id
      WHERE u.id != ${me}
        AND (${q} = '' OR LOWER(u.username) LIKE ${like} OR LOWER(COALESCE(u.fullName,'')) LIKE ${like})
      GROUP BY u.id, u.username, u.fullName, f.id
      ORDER BY workouts DESC
      LIMIT 50
    `;

    const data = rows.map(r => ({
      userId: r.userId,
      username: r.username,
      fullName: r.fullName,
      workouts: Number(r.workouts),
      totalVolume: Number(r.totalVolume),
      isFollowing: r.isFollowing === 1 || r.isFollowing === true,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Discover error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// ── POST /api/friends/follow/:userId ─────────────────────
router.post('/follow/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;
    const { userId } = req.params;

    if (userId === me) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }

    // Check target exists
    const target = await prisma.$queryRaw<any[]>`SELECT id FROM "User" WHERE id = ${userId} LIMIT 1`;
    if (!target.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Upsert (ignore if already following)
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO "Follow" (id, "followerId", "followingId", "createdAt")
      VALUES (lower(hex(randomblob(16))), ${me}, ${userId}, datetime('now'))
    `;

    return res.json({ success: true, message: 'Followed' });
  } catch (err) {
    console.error('Follow error:', err);
    return res.status(500).json({ success: false, error: 'Failed to follow user' });
  }
});

// ── DELETE /api/friends/unfollow/:userId ──────────────────
router.delete('/unfollow/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;
    const { userId } = req.params;

    await prisma.$executeRaw`
      DELETE FROM "Follow" WHERE "followerId" = ${me} AND "followingId" = ${userId}
    `;

    return res.json({ success: true, message: 'Unfollowed' });
  } catch (err) {
    console.error('Unfollow error:', err);
    return res.status(500).json({ success: false, error: 'Failed to unfollow user' });
  }
});

// ── GET /api/friends/following ────────────────────────────
// Returns users I follow, with their stats
router.get('/following', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        u.id          AS userId,
        u.username,
        u.fullName,
        COUNT(DISTINCT ws.id)                  AS workouts,
        COALESCE(SUM(es.weight * es.reps), 0)  AS totalVolume,
        1                                       AS isFollowing
      FROM "Follow" f
      JOIN "User"           u  ON u.id = f."followingId"
      LEFT JOIN "WorkoutSession" ws ON ws."userId" = u.id AND ws."endTime" IS NOT NULL
      LEFT JOIN "ExerciseSet"    es ON es."workoutSessionId" = ws.id
      WHERE f."followerId" = ${me}
      GROUP BY u.id, u.username, u.fullName
      ORDER BY workouts DESC
    `;

    const data = rows.map(r => ({
      userId: r.userId,
      username: r.username,
      fullName: r.fullName,
      workouts: Number(r.workouts),
      totalVolume: Number(r.totalVolume),
      isFollowing: true,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Following error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch following' });
  }
});

// ── GET /api/friends/stats ────────────────────────────────
// Returns follower/following counts for the current user
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;

    const [followingRow, followersRow] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT COUNT(*) AS cnt FROM "Follow" WHERE "followerId"  = ${me}`,
      prisma.$queryRaw<any[]>`SELECT COUNT(*) AS cnt FROM "Follow" WHERE "followingId" = ${me}`,
    ]);

    return res.json({
      success: true,
      data: {
        following: Number(followingRow[0]?.cnt ?? 0),
        followers: Number(followersRow[0]?.cnt ?? 0),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// ── GET /api/friends/prs/:userId ─────────────────────────
// Returns top weight PR per exercise for a given user
router.get('/prs/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;
    const targetId = req.params.userId === 'me' ? me : req.params.userId;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        e.name                   AS exerciseName,
        MAX(es.weight)           AS maxWeight,
        es.reps                  AS reps
      FROM "ExerciseSet" es
      JOIN "Exercise" e           ON e.id = es."exerciseId"
      JOIN "WorkoutSession" ws    ON ws.id = es."workoutSessionId"
      WHERE ws."userId" = ${targetId}
        AND ws."endTime" IS NOT NULL
        AND es.weight IS NOT NULL
        AND es.weight > 0
      GROUP BY e.name
      ORDER BY maxWeight DESC
      LIMIT 20
    `;

    const data = rows.map(r => ({
      exerciseName: r.exerciseName,
      maxWeight: Number(r.maxWeight),
      reps: Number(r.reps),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('PRs error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch PRs' });
  }
});

// ── GET /api/friends/feed ─────────────────────────────────
// Recent workouts of people I follow (last 30 days)
router.get('/feed', async (req: AuthRequest, res: Response) => {
  try {
    const me = req.user!.id;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        ws.id                AS sessionId,
        ws.name              AS workoutName,
        ws."startTime",
        ws."endTime",
        ws.duration,
        u.id                 AS userId,
        u.username,
        u.fullName,
        COUNT(es.id)         AS setCount,
        COALESCE(SUM(es.weight * es.reps), 0) AS volume
      FROM "Follow" f
      JOIN "User"           u  ON u.id = f."followingId"
      JOIN "WorkoutSession" ws ON ws."userId" = u.id AND ws."endTime" IS NOT NULL
      LEFT JOIN "ExerciseSet" es ON es."workoutSessionId" = ws.id
      WHERE f."followerId" = ${me}
        AND ws."startTime" >= datetime('now', '-30 days')
      GROUP BY ws.id, ws.name, ws."startTime", ws."endTime", ws.duration, u.id, u.username, u.fullName
      ORDER BY ws."startTime" DESC
      LIMIT 50
    `;

    const data = rows.map(r => ({
      id: r.sessionId,
      userId: r.userId,
      username: r.username,
      fullName: r.fullName,
      type: 'workout' as const,
      title: r.workoutName || 'Workout Session',
      detail: `${Number(r.setCount)} sets · ${(Number(r.volume) / 1000).toFixed(1)}t lifted`,
      timestamp: r.startTime,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Feed error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

export default router;

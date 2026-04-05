import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * Database Service using Prisma ORM
 * Replaces the mock database with real PostgreSQL
 */
export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  async createUser(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    return await this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async findUserByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    });
  }

  async findUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  async updateUser(id: string, data: any) {
    return await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  // ============================================
  // USER PROFILE OPERATIONS
  // ============================================

  async createOrUpdateProfile(userId: string, data: any) {
    return await this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async getProfile(userId: string) {
    return await this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  // ============================================
  // EXERCISE OPERATIONS
  // ============================================

  async getAllExercises() {
    return await this.prisma.exercise.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getExerciseById(id: string) {
    return await this.prisma.exercise.findUnique({
      where: { id },
    });
  }

  async getExercisesByMuscleGroup(muscleGroup: string) {
    return await this.prisma.exercise.findMany({
      where: {
        muscleGroup: {
          equals: muscleGroup,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createExercise(data: any) {
    return await this.prisma.exercise.create({
      data,
    });
  }

  async updateExercise(id: string, data: any) {
    return await this.prisma.exercise.update({
      where: { id },
      data,
    });
  }

  async deleteExercise(id: string) {
    return await this.prisma.exercise.delete({
      where: { id },
    });
  }

  // ============================================
  // WORKOUT SESSION OPERATIONS
  // ============================================

  async startWorkoutSession(userId: string, data: { name?: string; notes?: string }) {
    return await this.prisma.workoutSession.create({
      data: {
        userId,
        name: data.name,
        notes: data.notes,
        startTime: new Date(),
      },
    });
  }

  async endWorkoutSession(id: string) {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new Error('Workout session not found');
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - session.startTime.getTime()) / 1000 / 60
    ); // in minutes

    return await this.prisma.workoutSession.update({
      where: { id },
      data: {
        endTime,
        duration,
      },
      include: {
        exerciseSets: {
          include: {
            exercise: true,
          },
        },
      },
    });
  }

  async getWorkoutSession(id: string) {
    return await this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        exerciseSets: {
          include: {
            exercise: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async getUserWorkoutSessions(userId: string, limit = 20) {
    return await this.prisma.workoutSession.findMany({
      where: { userId },
      include: {
        exerciseSets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
    });
  }

  async updateWorkoutSession(id: string, data: any) {
    return await this.prisma.workoutSession.update({
      where: { id },
      data,
    });
  }

  async deleteWorkoutSession(id: string) {
    return await this.prisma.workoutSession.delete({
      where: { id },
    });
  }

  // ============================================
  // EXERCISE SET OPERATIONS
  // ============================================

  async addExerciseSet(data: {
    workoutSessionId: string;
    exerciseId: string;
    setNumber: number;
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
    notes?: string;
  }) {
    return await this.prisma.exerciseSet.create({
      data,
      include: {
        exercise: true,
      },
    });
  }

  async updateExerciseSet(id: string, data: any) {
    return await this.prisma.exerciseSet.update({
      where: { id },
      data,
    });
  }

  async deleteExerciseSet(id: string) {
    return await this.prisma.exerciseSet.delete({
      where: { id },
    });
  }

  async getExerciseSetsForWorkout(workoutSessionId: string) {
    return await this.prisma.exerciseSet.findMany({
      where: { workoutSessionId },
      include: {
        exercise: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ============================================
  // NUTRITION OPERATIONS
  // ============================================

  async addNutritionLog(userId: string, data: any) {
    return await this.prisma.nutritionLog.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async getNutritionLogs(userId: string, startDate: Date, endDate: Date) {
    return await this.prisma.nutritionLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async getNutritionLogsByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.prisma.nutritionLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async updateNutritionLog(id: string, data: any) {
    return await this.prisma.nutritionLog.update({
      where: { id },
      data,
    });
  }

  async deleteNutritionLog(id: string) {
    return await this.prisma.nutritionLog.delete({
      where: { id },
    });
  }

  // ============================================
  // BODY METRICS OPERATIONS
  // ============================================

  async addBodyMetric(userId: string, data: any) {
    return await this.prisma.bodyMetric.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async getBodyMetrics(userId: string, limit = 30) {
    return await this.prisma.bodyMetric.findMany({
      where: { userId },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });
  }

  async getLatestBodyMetric(userId: string) {
    return await this.prisma.bodyMetric.findFirst({
      where: { userId },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async updateBodyMetric(id: string, data: any) {
    return await this.prisma.bodyMetric.update({
      where: { id },
      data,
    });
  }

  async deleteBodyMetric(id: string) {
    return await this.prisma.bodyMetric.delete({
      where: { id },
    });
  }

  // ============================================
  // GOALS OPERATIONS
  // ============================================

  async createGoal(userId: string, data: any) {
    return await this.prisma.goal.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async getGoals(userId: string) {
    return await this.prisma.goal.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateGoal(id: string, data: any) {
    return await this.prisma.goal.update({
      where: { id },
      data,
    });
  }

  async markGoalAchieved(id: string) {
    return await this.prisma.goal.update({
      where: { id },
      data: {
        achieved: true,
        achievedAt: new Date(),
      },
    });
  }

  async deleteGoal(id: string) {
    return await this.prisma.goal.delete({
      where: { id },
    });
  }

  // ============================================
  // LEADERBOARD
  // ============================================

  async getLeaderboard(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all workout sessions in the period, group by user
    const sessions = await this.prisma.workoutSession.findMany({
      where: { startTime: { gte: since } },
      select: {
        userId: true,
        duration: true,
        exerciseSets: { select: { reps: true, weight: true } },
        user: { select: { id: true, username: true, fullName: true } },
      },
    });

    const map: Record<string, {
      userId: string; username: string; fullName: string | null;
      workouts: number; totalVolume: number; totalDuration: number;
    }> = {};

    sessions.forEach(s => {
      const uid = s.userId;
      if (!map[uid]) {
        map[uid] = {
          userId: uid,
          username: s.user.username,
          fullName: s.user.fullName,
          workouts: 0,
          totalVolume: 0,
          totalDuration: 0,
        };
      }
      map[uid].workouts++;
      map[uid].totalDuration += s.duration || 0;
      map[uid].totalVolume += s.exerciseSets.reduce(
        (sum, set) => sum + (set.reps || 0) * (set.weight || 0), 0
      );
    });

    return Object.values(map)
      .sort((a, b) => b.workouts - a.workouts || b.totalVolume - a.totalVolume)
      .slice(0, 20)
      .map((entry, i) => ({ rank: i + 1, ...entry }));
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export a singleton instance
export const db = new DatabaseService();

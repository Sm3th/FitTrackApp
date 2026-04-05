import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class Database {
  prisma = prisma;

  // User operations
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        fullName: data.fullName,
      },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getUserById(id: string) {  // number → string
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  // Exercise operations
  async getAllExercises() {
    return this.prisma.exercise.findMany();
  }

  async getExerciseById(id: string) {
    return this.prisma.exercise.findUnique({
      where: { id },
    });
  }

  // Workout Session operations
  async startWorkoutSession(userId: string, name?: string, notes?: string) {  // number → string
    return this.prisma.workoutSession.create({
      data: {
        userId,
        name: name || 'Workout Session',
        notes,
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
    );

    return this.prisma.workoutSession.update({
      where: { id },
      data: {
        endTime,
        duration,
      },
    });
  }

  async getWorkoutSessionsByUserId(userId: string) {  // number → string
    return this.prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      include: {
        exerciseSets: {
          include: {
            exercise: true,
          },
        },
      },
    });
  }

  // Exercise Set operations
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
    return this.prisma.exerciseSet.create({
      data,
    });
  }

  async getExerciseSetsBySessionId(workoutSessionId: string) {
    return this.prisma.exerciseSet.findMany({
      where: { workoutSessionId },
      include: {
        exercise: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const db = new Database();
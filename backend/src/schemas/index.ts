import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email:    z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Workouts ──────────────────────────────────────────────────────────────────
export const startSessionSchema = z.object({
  name:  z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const logSetSchema = z.object({
  workoutSessionId: z.string().min(1),
  exerciseId:       z.string().min(1),
  setNumber:        z.number().int().positive(),
  reps:             z.number().int().positive().optional(),
  weight:           z.number().min(0).optional(),
  duration:         z.number().int().positive().optional(),
  notes:            z.string().max(300).optional(),
});

// ── Nutrition ─────────────────────────────────────────────────────────────────
export const addNutritionSchema = z.object({
  name:     z.string().min(1, 'Food name is required').max(100),
  calories: z.number().min(0, 'Calories must be non-negative'),
  protein:  z.number().min(0).optional(),
  carbs:    z.number().min(0).optional(),
  fat:      z.number().min(0).optional(),
  meal:     z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  date:     z.string().optional(),
});

// ── Metrics ───────────────────────────────────────────────────────────────────
export const addMetricSchema = z.object({
  weight:  z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  chest:   z.number().positive().optional(),
  waist:   z.number().positive().optional(),
  hips:    z.number().positive().optional(),
  arms:    z.number().positive().optional(),
  legs:    z.number().positive().optional(),
  notes:   z.string().max(500).optional(),
  date:    z.string().optional(),
}).refine(
  data => Object.values(data).some(v => v !== undefined && v !== null && typeof v !== 'string'),
  { message: 'At least one measurement value is required' }
);

// ── User profile ──────────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  fullName:       z.string().max(100).optional(),
  age:            z.number().int().positive().max(120).optional(),
  gender:         z.enum(['male', 'female', 'other']).optional(),
  height:         z.number().positive().max(300).optional(),
  currentWeight:  z.number().positive().max(500).optional(),
  targetWeight:   z.number().positive().max(500).optional(),
  activityLevel:  z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  fitnessGoal:    z.enum(['lose_weight', 'build_muscle', 'stay_fit', 'endurance', 'flexibility', 'sport']).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production!)
  console.log('🗑️  Cleaning existing data...');
  await prisma.exerciseSet.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.nutritionLog.deleteMany();
  await prisma.bodyMetric.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create sample exercises
  console.log('💪 Creating exercises...');
  
  const exercises = await Promise.all([
    prisma.exercise.create({
      data: {
        name: 'Barbell Bench Press',
        description: 'A compound chest exercise performed on a flat bench with a barbell',
        muscleGroup: 'chest',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Lie on bench\n2. Grip barbell slightly wider than shoulders\n3. Lower to chest\n4. Press up explosively\n5. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Squat',
        description: 'A fundamental lower body exercise targeting quads, glutes, and hamstrings',
        muscleGroup: 'legs',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Bar on upper back\n2. Feet shoulder-width apart\n3. Lower until thighs parallel\n4. Drive through heels\n5. Return to standing',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Deadlift',
        description: 'A compound exercise that works the entire posterior chain',
        muscleGroup: 'back',
        equipment: 'barbell',
        difficulty: 'advanced',
        instructions: '1. Feet hip-width, bar over midfoot\n2. Grip bar outside legs\n3. Back straight, chest up\n4. Drive through floor\n5. Stand tall, squeeze glutes',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Pull-ups',
        description: 'A bodyweight exercise for back and biceps',
        muscleGroup: 'back',
        equipment: 'bodyweight',
        difficulty: 'intermediate',
        instructions: '1. Hang from bar, hands wider than shoulders\n2. Pull chest to bar\n3. Lower with control\n4. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Dumbbell Shoulder Press',
        description: 'An overhead press targeting the shoulders',
        muscleGroup: 'shoulders',
        equipment: 'dumbbell',
        difficulty: 'beginner',
        instructions: '1. Dumbbells at shoulder height\n2. Press overhead\n3. Lower with control\n4. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Push-ups',
        description: 'A classic bodyweight exercise for chest, shoulders, and triceps',
        muscleGroup: 'chest',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        instructions: '1. Hands shoulder-width apart\n2. Body straight from head to heels\n3. Lower chest to ground\n4. Push back up\n5. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Barbell Rows',
        description: 'A compound exercise for back thickness',
        muscleGroup: 'back',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Bend at hips, back flat\n2. Pull bar to lower chest\n3. Squeeze shoulder blades\n4. Lower with control\n5. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Lunges',
        description: 'A unilateral leg exercise for quads and glutes',
        muscleGroup: 'legs',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        instructions: '1. Step forward into lunge\n2. Lower back knee toward ground\n3. Push back to starting position\n4. Alternate legs\n5. Repeat',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Plank',
        description: 'An isometric core strengthening exercise',
        muscleGroup: 'core',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        instructions: '1. Forearms on ground, elbows under shoulders\n2. Body straight from head to heels\n3. Hold position\n4. Breathe steadily',
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Running',
        description: 'Cardiovascular exercise for endurance',
        muscleGroup: 'cardio',
        equipment: 'bodyweight',
        difficulty: 'beginner',
        instructions: '1. Start at comfortable pace\n2. Maintain steady rhythm\n3. Breathe naturally\n4. Track distance and time',
      },
    }),
  ]);

  console.log(`✅ Created ${exercises.length} exercises`);

  // Create a demo user
  console.log('👤 Creating demo user...');
  
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@fittrack.com',
      username: 'demouser',
      password: hashedPassword,
      fullName: 'Demo User',
      profile: {
        create: {
          age: 28,
          gender: 'male',
          height: 178,
          currentWeight: 80,
          targetWeight: 75,
          activityLevel: 'moderate',
          fitnessGoal: 'lose_weight',
          experienceLevel: 'intermediate',
        },
      },
    },
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Create sample workout session
  console.log('🏋️ Creating sample workout...');
  
  const workoutSession = await prisma.workoutSession.create({
    data: {
      userId: demoUser.id,
      name: 'Upper Body Strength',
      notes: 'Feeling strong today!',
      startTime: new Date('2026-02-11T10:00:00Z'),
      endTime: new Date('2026-02-11T11:30:00Z'),
      duration: 90,
      exerciseSets: {
        create: [
          {
            exerciseId: exercises[0].id, // Bench Press
            setNumber: 1,
            reps: 10,
            weight: 60,
          },
          {
            exerciseId: exercises[0].id,
            setNumber: 2,
            reps: 8,
            weight: 65,
          },
          {
            exerciseId: exercises[3].id, // Pull-ups
            setNumber: 1,
            reps: 8,
            weight: 0,
          },
          {
            exerciseId: exercises[4].id, // Shoulder Press
            setNumber: 1,
            reps: 12,
            weight: 15,
          },
        ],
      },
    },
  });

  console.log(`✅ Created sample workout session`);

  // Create sample nutrition log
  console.log('🍎 Creating nutrition logs...');
  
  await prisma.nutritionLog.createMany({
    data: [
      {
        userId: demoUser.id,
        date: new Date('2026-02-11T08:00:00Z'),
        mealType: 'breakfast',
        foodName: 'Oatmeal with Banana',
        calories: 350,
        protein: 12,
        carbs: 65,
        fats: 8,
        servingSize: '1 bowl',
      },
      {
        userId: demoUser.id,
        date: new Date('2026-02-11T13:00:00Z'),
        mealType: 'lunch',
        foodName: 'Chicken Breast with Rice and Vegetables',
        calories: 550,
        protein: 45,
        carbs: 60,
        fats: 12,
        servingSize: '1 plate',
      },
      {
        userId: demoUser.id,
        date: new Date('2026-02-11T18:00:00Z'),
        mealType: 'dinner',
        foodName: 'Salmon with Sweet Potato',
        calories: 480,
        protein: 40,
        carbs: 45,
        fats: 18,
        servingSize: '1 plate',
      },
    ],
  });

  console.log(`✅ Created nutrition logs`);

  // Create body metrics
  console.log('📊 Creating body metrics...');
  
  await prisma.bodyMetric.create({
    data: {
      userId: demoUser.id,
      date: new Date('2026-02-11'),
      weight: 80,
      bodyFat: 18,
      muscle: 42,
      waist: 85,
      chest: 100,
      arms: 35,
      legs: 60,
      notes: 'Weekly check-in',
    },
  });

  console.log(`✅ Created body metrics`);

  // Create goals
  console.log('🎯 Creating goals...');
  
  await prisma.goal.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'weight',
        target: 'Reach 75kg',
        targetValue: 75,
        currentValue: 80,
        deadline: new Date('2026-05-11'),
        achieved: false,
      },
      {
        userId: demoUser.id,
        type: 'strength',
        target: 'Bench Press 100kg',
        targetValue: 100,
        currentValue: 65,
        deadline: new Date('2026-06-11'),
        achieved: false,
      },
    ],
  });

  console.log(`✅ Created goals`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${exercises.length} exercises`);
  console.log(`   - 1 demo user (email: demo@fittrack.com, password: demo123456)`);
  console.log(`   - 1 workout session with 4 exercise sets`);
  console.log(`   - 3 nutrition logs`);
  console.log(`   - 1 body metric entry`);
  console.log(`   - 2 goals`);
  console.log('\n🚀 You can now start the server and test the API!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

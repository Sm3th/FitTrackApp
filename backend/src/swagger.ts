import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FitTrack Pro API',
      version: '2.0.0',
      description: `
## FitTrack Pro REST API

Full-stack fitness tracking application backend.
Built with **Node.js**, **Express**, **TypeScript**, **Prisma** and **SQLite**.

### Authentication
Most endpoints require a **Bearer JWT token** in the Authorization header.
Obtain a token via \`POST /api/auth/login\` or \`POST /api/auth/register\`.

### Response Format
All responses follow this structure:
\`\`\`json
{
  "success": true | false,
  "data": { ... },
  "message": "Optional message"
}
\`\`\`
      `,
      contact: {
        name: 'İsmet Organ',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            username: { type: 'string', example: 'fituser' },
            fullName: { type: 'string', example: 'John Doe', nullable: true },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Bench Press' },
            description: { type: 'string', nullable: true },
            muscleGroup: { type: 'string', example: 'Chest' },
            equipment: { type: 'string', nullable: true, example: 'Barbell' },
            difficulty: { type: 'string', nullable: true, example: 'intermediate' },
            instructions: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        WorkoutSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time', nullable: true },
            duration: { type: 'integer', nullable: true, description: 'Duration in seconds' },
          },
        },
        ExerciseSet: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            workoutSessionId: { type: 'string' },
            exerciseId: { type: 'string' },
            setNumber: { type: 'integer', example: 1 },
            reps: { type: 'integer', nullable: true, example: 10 },
            weight: { type: 'number', nullable: true, example: 80.0 },
            duration: { type: 'integer', nullable: true, example: 30 },
            distance: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth', description: 'Registration and login' },
      { name: 'Exercises', description: 'Exercise library' },
      { name: 'Workouts', description: 'Workout session management (requires auth)' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server health check',
          description: 'Returns server status and timestamp',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      database: { type: 'string', example: 'connected' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'username', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    username: { type: 'string', example: 'fituser', minLength: 3 },
                    password: { type: 'string', example: 'password123', minLength: 6 },
                    fullName: { type: 'string', example: 'John Doe' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/AuthResponse' },
                      message: { type: 'string', example: 'User registered successfully' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Validation error or user already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/AuthResponse' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/exercises': {
        get: {
          tags: ['Exercises'],
          summary: 'Get all exercises',
          description: 'Returns the complete exercise library',
          responses: {
            '200': {
              description: 'List of exercises',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/exercises/{id}': {
        get: {
          tags: ['Exercises'],
          summary: 'Get exercise by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Exercise details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Exercise' } } } } } },
            '404': { description: 'Exercise not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/exercises/muscle/{muscleGroup}': {
        get: {
          tags: ['Exercises'],
          summary: 'Get exercises by muscle group',
          parameters: [{
            name: 'muscleGroup', in: 'path', required: true,
            schema: { type: 'string', enum: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio'] },
          }],
          responses: {
            '200': { description: 'Exercises for the muscle group', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } } } } } } },
          },
        },
      },
      '/api/workouts/sessions/start': {
        post: {
          tags: ['Workouts'],
          summary: 'Start a new workout session',
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Monday Push Day' },
                    notes: { type: 'string', example: 'Feeling strong today' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Workout session started', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkoutSession' } } } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/workouts/sessions': {
        get: {
          tags: ['Workouts'],
          summary: 'Get all workout sessions for the authenticated user',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Max number of sessions to return' }],
          responses: {
            '200': { description: 'List of workout sessions', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/WorkoutSession' } } } } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/workouts/sessions/{id}': {
        get: {
          tags: ['Workouts'],
          summary: 'Get a specific workout session',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Workout session details', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkoutSession' } } } } } },
            '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/workouts/sessions/{id}/end': {
        patch: {
          tags: ['Workouts'],
          summary: 'End a workout session',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Session ended, duration calculated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/WorkoutSession' }, message: { type: 'string' } } } } } },
            '403': { description: 'Access denied', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            '404': { description: 'Session not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/workouts/sets': {
        post: {
          tags: ['Workouts'],
          summary: 'Add an exercise set to a workout session',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workoutSessionId', 'exerciseId', 'setNumber'],
                  properties: {
                    workoutSessionId: { type: 'string' },
                    exerciseId: { type: 'string' },
                    setNumber: { type: 'integer', example: 1 },
                    reps: { type: 'integer', example: 10 },
                    weight: { type: 'number', example: 80.0, description: 'Weight in kg' },
                    duration: { type: 'integer', example: 30, description: 'Duration in seconds' },
                    distance: { type: 'number', description: 'Distance in km' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Exercise set added', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/ExerciseSet' } } } } } },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);

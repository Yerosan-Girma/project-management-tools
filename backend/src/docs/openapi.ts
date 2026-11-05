export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TeamFlow API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API for TeamFlow - Project Management and Team Collaboration Platform. Provides multi-tenant workspace isolation, project tracking, Kanban boards, real-time collaboration, and automated metrics.',
    contact: {
      name: 'TeamFlow Engineering Team',
      email: 'support@teamflow.local'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Root'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token (Bearer <token>)'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message description' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              details: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Alice Johnson' },
          email: { type: 'string', format: 'email', example: 'alice@teamflow.local' },
          avatarUrl: { type: 'string', nullable: true },
          platformRole: { type: 'string', enum: ['PLATFORM_ADMIN', 'USER'] },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Acme Corp' },
          slug: { type: 'string', example: 'acme-corp-123' },
          description: { type: 'string', nullable: true },
          ownerId: { type: 'string', format: 'uuid' },
          isArchived: { type: 'boolean', example: false }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          workspaceId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'TeamFlow Core' },
          key: { type: 'string', example: 'TF' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          startDate: { type: 'string', format: 'date-time', nullable: true },
          targetDate: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          boardColumnId: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Implement auth rotation' },
          description: { type: 'string', nullable: true },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          position: { type: 'number', example: 1000 },
          dueDate: { type: 'string', format: 'date-time', nullable: true },
          completedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Alice Johnson' },
                  email: { type: 'string', format: 'email', example: 'alice@teamflow.local' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in to account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'alice@teamflow.local' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User profile' },
          401: { description: 'Unauthenticated' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access and refresh tokens with rotation',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Tokens rotated successfully' },
          401: { description: 'Invalid or expired token' }
        }
      }
    },
    '/workspaces': {
      get: {
        tags: ['Workspaces'],
        summary: 'List user workspaces',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of workspaces' } }
      },
      post: {
        tags: ['Workspaces'],
        summary: 'Create new workspace',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Acme Product Team' },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Workspace created' } }
      }
    },
    '/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create new project in workspace with default board and columns',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workspaceId', 'name', 'key'],
                properties: {
                  workspaceId: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Core API' },
                  key: { type: 'string', example: 'API' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Project created' } }
      }
    },
    '/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task in project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'boardColumnId', 'title'],
                properties: {
                  projectId: { type: 'string', format: 'uuid' },
                  boardColumnId: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Task created' } }
      }
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get user dashboard metrics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Metrics summary' } }
      }
    }
  }
};

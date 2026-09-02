import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dagsap Document Tracking API',
      version: '1.0.0',
      description: 'API documentation for Dagsap Document Tracking System',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        DocumentInput: {
          type: 'object',
          required: ['documentTypeId', 'originLocationId', 'destinationLocationId'],
          properties: {
            documentTypeId: { type: 'string', example: 'type-id-123' },
            originLocationId: { type: 'string', example: 'loc-id-1' },
            destinationLocationId: { type: 'string', example: 'loc-id-2' },
            description: { type: 'string', example: 'Invoice for March' },
            priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], example: 'HIGH' }
          }
        },
        DocumentResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'doc-id-123' },
            documentNumber: { type: 'string', example: 'DAG-2026-000001' },
            status: { type: 'string', example: 'DRAFT' },
            priority: { type: 'string', example: 'HIGH' },
            description: { type: 'string', example: 'Invoice for March' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        LocationResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'loc-id-1' },
            code: { type: 'string', example: 'HO' },
            name: { type: 'string', example: 'Head Office' },
            type: { type: 'string', example: 'BRANCH' }
          }
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'usr-id-1' },
            nik: { type: 'string', example: '12345678' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@dagsap.com' },
            role: { type: 'string', example: 'ADMIN' },
            active: { type: 'boolean', example: true }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/UserResponse' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/server/routes/*.ts'], // Path to the API routes files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};

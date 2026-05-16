const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes App API',
      version: '1.0.0',
      description:
        'A multi-user notes service REST API. Supports user registration, authentication, CRUD on notes, sharing notes, pinning notes, and full-text search.',
      contact: {
        name: 'Sarvesh Kumar',
        email: 'sarveshbkt04@gmail.com',
      },
    },
    // servers are injected dynamically per request — see setupSwagger below
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Note: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            isPinned: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

// Generate the base spec once at startup
const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Serve Swagger UI — inject the correct server URL dynamically from the request
  app.use('/docs', swaggerUi.serve, (req, res, next) => {
    // Detect the actual host (works on localhost, Render, any domain)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const serverUrl = `${protocol}://${host}`;

    // Clone spec and inject the correct server URL for this request
    const dynamicSpec = {
      ...swaggerSpec,
      servers: [{ url: serverUrl, description: 'API Server' }],
    };

    swaggerUi.setup(dynamicSpec)(req, res, next);
  });

  // Serve raw OpenAPI JSON — also dynamic
  app.get('/openapi.json', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const serverUrl = `${protocol}://${host}`;

    const dynamicSpec = {
      ...swaggerSpec,
      servers: [{ url: serverUrl, description: 'API Server' }],
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(dynamicSpec);
  });
}

module.exports = { setupSwagger, swaggerSpec };

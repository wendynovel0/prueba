const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Productos y Autenticación',
      version: '1.0.0',
      description: 'Documentación completa para la API con JWT y CRUD de productos'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            product_id: { 
              type: 'integer',
              example: 1
            },
            code: { 
              type: 'string',
              example: 'PROD-001'
            },
            name: { 
              type: 'string',
              example: 'Laptop Gamer'
            },
            description: { 
              type: 'string',
              example: 'Laptop de alto rendimiento'
            },
            price: { 
              type: 'number', 
              format: 'double',
              example: 1299.99
            },
            brand_id: { 
              type: 'integer',
              example: 1
            },
            is_active: { 
              type: 'boolean',
              example: true
            },
            created_at: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-05-01T12:00:00Z'
            },
            updated_at: { 
              type: 'string', 
              format: 'date-time',
              example: '2023-05-01T12:00:00Z'
            },
            brand: {
              $ref: '#/components/schemas/Brand'
            }
          }
        },
        Brand: {
          type: 'object',
          properties: {
            brand_id: {
              type: 'integer',
              example: 1
            },
            name: { 
              type: 'string',
              example: 'Marca Ejemplo'
            },
            description: {
              type: 'string',
              example: 'Descripción de la marca'
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            user_id: {
              type: 'integer',
              example: 1
            },
            username: {
              type: 'string',
              example: 'usuario_ejemplo'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@ejemplo.com'
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            }
          }
        },
        ActionLog: {
          type: 'object',
          properties: {
            log_id: {
              type: 'integer',
              example: 1,
              description: 'ID único del registro de log'
            },
            user_id: {
              type: 'integer',
              example: 1,
              description: 'ID del usuario que realizó la acción'
            },
            action_type: {
              type: 'string',
              enum: ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE', 'LOGIN', 'LOGOUT'],
              example: 'UPDATE',
              description: 'Tipo de acción realizada'
            },
            table_affected: {
              type: 'string',
              example: 'products',
              description: 'Tabla afectada por la acción'
            },
            record_id: {
              type: 'integer',
              example: 5,
              description: 'ID del registro afectado'
            },
            old_values: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Valores anteriores (para actualizaciones)',
              example: {
                name: "Producto Antiguo",
                price: 100.00
              }
            },
            new_values: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Nuevos valores (para creaciones/actualizaciones)',
              example: {
                name: "Producto Nuevo",
                price: 120.00
              }
            },
            action_timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-15T10:30:00Z',
              description: 'Fecha y hora de la acción'
            },
            ip_address: {
              type: 'string',
              format: 'ipv4',
              example: '192.168.1.100',
              description: 'Dirección IP desde donde se realizó la acción'
            },
            user: {
              $ref: '#/components/schemas/User',
              description: 'Información del usuario asociado'
            }
          },
          required: [
            'log_id',
            'user_id',
            'action_type',
            'table_affected',
            'record_id',
            'action_timestamp'
          ]
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use('/api-docs', 
    swaggerUi.serve, 
    swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true
      },
      customSiteTitle: "Documentación API Tienda",
      customCss: '.swagger-ui .topbar { display: none }',
      customfavIcon: '/favicon.ico'
    })
  );
};
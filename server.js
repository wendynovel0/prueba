require('dotenv').config();
const express = require('express');
const { sequelize, User, Brand, Product, ActionLog } = require('./models');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const setupSwagger = require('./swagger/swagger.config');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

setupSwagger(app);


const actionLogger = async (req, actionType, tableAffected, recordId, oldValues, newValues) => {
  try {
    if (!req.user) {
      console.log('No hay usuario en la request, no se registrará la acción');
      return;
    }

    const log = await ActionLog.create({
      user_id: req.user.user_id,
      action_type: actionType,
      table_affected: tableAffected,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    console.log('✅ Acción registrada en BD:', {
      id: log.log_id,
      action: `${actionType} on ${tableAffected}`,
      user: req.user.user_id,
      timestamp: log.action_timestamp
    });

  } catch (error) {
    console.error('❌ Error al registrar acción:', error.message);
  }
};

User.prototype.validPassword = async function(password) {
  if (this.password_hash.startsWith('$2b$')) {
    return await bcrypt.compare(password, this.password_hash);
  }
  return password === this.password_hash;
};

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido en formato Bearer' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({
      where: {
        user_id: decoded.user_id, // Asegúrate que coincida con lo que guardas en el token
        is_active: true
      },
      attributes: ['user_id', 'username', 'email']
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    res.status(401).json({ error: 'Token inválido' });
  }
};

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API con PostgreSQL',
      version: '1.0.0',
      description: 'Documentación para tu estructura exacta de BD'
    },
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
              example: 'IP13-128',
              maxLength: 50
            },
            name: {
              type: 'string',
              example: 'iPhone 13 128GB',
              maxLength: 100
            },
            description: {
              type: 'string',
              example: 'Smartphone con chip A15 Bionic',
              nullable: true
            },
            price: {
              type: 'number',
              format: 'float',
              example: 17999.00
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
              example: '2023-01-01T00:00:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T00:00:00Z'
            },
            brand: {
              $ref: '#/components/schemas/Brand'
            }
          },
          required: [
            'product_id',
            'code',
            'name',
            'price',
            'brand_id',
            'is_active'
          ]
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
              example: 'Apple',
              maxLength: 100
            },
            description: {
              type: 'string',
              example: 'Empresa líder en tecnología',
              nullable: true
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
          },
          required: [
            'brand_id',
            'name',
            'is_active'
          ]
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
              enum: [
                'CREATE',
                'UPDATE',
                'DELETE',
                'ACTIVATE',
                'DEACTIVATE',
                'LOGIN',
                'LOGOUT',
                'DOWNLOAD',
                'UPLOAD'
              ],
              example: 'UPDATE',
              description: 'Tipo de acción realizada'
            },
            table_affected: {
              type: 'string',
              example: 'products',
              description: 'Tabla de la base de datos afectada',
              enum: [
                'products',
                'brands',
                'users',
                'categories'
              ]
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
              description: 'Valores antes de la modificación',
              example: {
                name: "Producto Antiguo",
                price: 100.00
              }
            },
            new_values: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Valores después de la modificación',
              example: {
                name: "Producto Nuevo",
                price: 120.00
              }
            },
            action_timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-05-15T14:30:00Z',
              description: 'Fecha y hora exacta de la acción'
            },
            ip_address: {
              type: 'string',
              format: 'ipv4',
              example: '192.168.1.150',
              description: 'Dirección IP del origen'
            },
            user_agent: {
              type: 'string',
              example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              description: 'Agente de usuario',
              nullable: true
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
        },
        ActionLogPagedResponse: {
          type: 'object',
          properties: {
            totalItems: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 10
            },
            currentPage: {
              type: 'integer',
              example: 1
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ActionLog'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerOptions)));

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "NuevoUsuario"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nuevo@ejemplo.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "PasswordSeguro123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Error en la validación
 *       409:
 *         description: El email ya está registrado
 *       500:
 *         description: Error interno del servidor
 */
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Validación básica
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const newUser = await User.create({
      username,
      email,
      password_hash: password, 
      is_active: true
    });

    const userResponse = {
      user_id: newUser.user_id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Autenticación de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: string@ejemplo.com
 *               password:
 *                 type: string
 *                 example: string
 *     responses:
 *       200:
 *         description: Retorna token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body; 

  try {
    const user = await User.findOne({ 
      where: { email },
      attributes: ['user_id', 'username', 'email', 'password_hash', 'is_active']
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Cuenta desactivada' });
    }

    const isValidPassword = await user.validPassword(password); 
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Obtener todas las marcas activas
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir marcas inactivas
 *     responses:
 *       200:
 *         description: Lista de marcas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Brand'
 */
app.get('/brands', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = {};
    
    if (!includeInactive || includeInactive === 'false') {
      where.is_active = true;
    }

    const brands = await Brand.findAll({ 
      where,
      order: [['name', 'ASC']] 
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Obtener una marca por ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marca encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Marca no encontrada
 */
app.get('/brands/:id', async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Crear nueva marca
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nueva Marca"
 *               description:
 *                 type: string
 *                 example: "Descripción de la marca"
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *       400:
 *         description: Validación fallida
 *       401:
 *         description: No autorizado
 */
app.post('/brands', authenticateJWT, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const newBrand = await Brand.create({
      name,
      description,
      is_active: true
    });

    await actionLogger(req, 'CREATE', 'brands', newBrand.brand_id, null, newBrand.toJSON());

    res.status(201).json(newBrand);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El nombre de la marca ya existe' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     summary: Actualizar marca
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Marca Actualizada"
 *               description:
 *                 type: string
 *                 example: "Nueva descripción"
 *     responses:
 *       200:
 *         description: Marca actualizada
 *       400:
 *         description: Error en la validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Marca no encontrada
 */
app.put('/brands/:id', authenticateJWT, async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    const oldValues = brand.toJSON();
    await brand.update(req.body);
    const newValues = brand.toJSON();

    // Registrar acción
    await actionLogger(req, 'UPDATE', 'brands', brand.brand_id, oldValues, newValues);

    await brand.update(req.body);
    res.json(brand);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El nombre de la marca ya existe' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Desactivar marca (eliminación lógica)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marca desactivada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Marca no encontrada
 */
app.delete('/brands/:id', authenticateJWT, async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    const oldValues = brand.toJSON();
    await brand.update({ is_active: false });

    await actionLogger(req, 'DEACTIVATE', 'brands', brand.brand_id, oldValues, null);

    await brand.update({ is_active: false });
    res.json({ message: 'Marca desactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /brands/{id}/activate:
 *   patch:
 *     summary: Reactivar marca
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marca reactivada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Marca no encontrada
 */
app.patch('/brands/:id/activate', authenticateJWT, async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    const oldValues = brand.toJSON();
    await brand.update({ is_active: true });

    // Registrar acción
    await actionLogger(req, 'ACTIVATE', 'brands', brand.brand_id, oldValues, brand.toJSON());

    await brand.update({ is_active: true });
    res.json({ message: 'Marca reactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - price
 *               - brand_id
 *             properties:
 *               code:
 *                 type: string
 *                 example: "PROD-001"
 *               name:
 *                 type: string
 *                 example: "Producto Ejemplo"
 *               description:
 *                 type: string
 *                 example: "Descripción del producto"
 *               price:
 *                 type: number
 *                 format: double
 *                 example: 99.99
 *               brand_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Validación fallida
 *       401:
 *         description: No autorizado
 */
app.post('/products', authenticateJWT, async (req, res) => {
  try {
    const { code, name, description, price, brand_id } = req.body;
    
    const newProduct = await Product.create({
      code,
      name,
      description,
      price,
      brand_id,
      is_active: true
    });

    await actionLogger(req, 'CREATE', 'products', newProduct.product_id, null, newProduct.toJSON());

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos (con filtros)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por código, nombre o marca
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de creación mínima (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de creación máxima (YYYY-MM-DD)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/products', async (req, res) => {
  try {
    const { search, startDate, endDate, is_active } = req.query;
    const where = {};
    const include = [{
      model: Brand,
      as: 'brand',
      attributes: ['name']
    }];

    // Filtro de búsqueda
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` }},
        { name: { [Op.iLike]: `%${search}%` }},
        { '$brand.name$': { [Op.iLike]: `%${search}%` }}
      ];
    }

    // Filtro por fechas
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate + ' 23:59:59');
    }

    // Filtro por estado
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const products = await Product.findAll({
      where,
      include,
      order: [['created_at', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Brand,
        as: 'brand'
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       400:
 *         description: Error en la validación
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
app.put('/products/:id', authenticateJWT, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const oldValues = product.toJSON();
    await product.update(req.body);
    const newValues = product.toJSON();

    await actionLogger(req, 'UPDATE', 'products', product.product_id, oldValues, newValues);

    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar producto (lógico)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto desactivado
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
app.delete('/products/:id', authenticateJWT, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const oldValues = product.toJSON();
    await product.update({ is_active: false });

    // Registrar acción
    await actionLogger(req, 'DEACTIVATE', 'products', product.product_id, oldValues, null);

    await product.update({ is_active: false });
    res.json({ message: 'Producto desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Ruta de verificación de conexión
app.get('/db-status', async (req, res) => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query(`
      SELECT 
        current_database(),
        current_user,
        version() as pg_version,
        (SELECT count(*) FROM users) as user_count
    `);
    
    res.json({
      status: 'OK',
      database: results[0].current_database,
      user: results[0].current_user,
      version: results[0].pg_version,
      user_count: results[0].user_count
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message,
      config: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME
      }
    });
  }
});

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Obtener registro de acciones
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de acción (CREATE, UPDATE, etc.)
 *       - in: query
 *         name: tableAffected
 *         schema:
 *           type: string
 *         description: Filtrar por tabla afectada (products, brands)
 *     responses:
 *       200:
 *         description: Lista de logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ActionLog'
 */
app.get('/logs', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType, tableAffected } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (actionType) where.action_type = actionType;
    if (tableAffected) where.table_affected = tableAffected;

    const logs = await ActionLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'username', 'email']
      }],
      order: [['action_timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa!');
    
    await sequelize.sync({ alter: {
      drop:false
    } });
    console.log('🔄 Modelos sincronizados');

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor listo en http://localhost:${PORT}`);
      console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🛠️  Verificar conexión BD: http://localhost:${PORT}/db-status\n`);
    });
  } catch (error) {
    console.error('Error de inicio:');
    console.error('- Código:', error.original?.code || 'N/A');
    console.error('- Mensaje:', error.original?.message || error.message);
    console.error('\n Soluciones rápidas:');
    console.error('1. Verifica que PostgreSQL esté corriendo');
    console.error(`2. Ejecuta: psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME}`);
    console.error('3. Revisa el archivo pg_hba.conf si hay errores de autenticación');
    process.exit(1);
  }
}

startServer();
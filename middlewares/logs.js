const { ActionLog } = require('../models');

/**
 * Middleware para registrar acciones en el sistema
 * @param {string} actionType - Tipo de acción (CREATE, UPDATE, DELETE, etc.)
 * @param {string} tableAffected - Tabla afectada (products, brands, users)
 * @param {object} req - Objeto de petición Express
 * @param {object} oldValues - Valores anteriores (para actualizaciones)
 * @param {object} newValues - Valores nuevos (para creaciones/actualizaciones)
 */
const logAction = async (actionType, tableAffected, req, oldValues = null, newValues = null) => {
  if (!req.user) return; // No registrar si no hay usuario autenticado
  
  try {
    await ActionLog.create({
      user_id: req.user.user_id,
      action_type: actionType,
      table_affected: tableAffected,
      record_id: newValues?.id || oldValues?.id || null,
      old_values: oldValues,
      new_values: newValues,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'] || null
    });
  } catch (error) {
    console.error('Error registrando acción:', error);
  }
};

/**
 * Middleware para registrar acciones de productos
 */
const productLogger = async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode < 400) { // Solo registrar si la respuesta fue exitosa
      const actionType = getActionType(req.method, req.originalUrl);
      if (actionType) {
        await logAction(
          actionType,
          'products',
          req,
          req.originalMethod === 'PUT' || req.originalMethod === 'DELETE' ? req.oldProductValues : null,
          req.body
        );
      }
    }
  });
  
  // Guardar valores antiguos para PUT/DELETE
  if (req.method === 'PUT' || req.method === 'DELETE') {
    try {
      const product = await Product.findByPk(req.params.id);
      if (product) {
        req.oldProductValues = product.toJSON();
      }
    } catch (error) {
      console.error('Error obteniendo valores antiguos:', error);
    }
  }
  
  req.originalMethod = req.method; // Guardar método original
  next();
};

// Helper para determinar el tipo de acción
function getActionType(method, url) {
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') {
    return url.includes('/activate') ? 'ACTIVATE' : 'DEACTIVATE';
  }
  return null;
}

module.exports = {
  logAction,
  productLogger
};
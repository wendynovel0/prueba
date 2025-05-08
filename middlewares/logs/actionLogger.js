// middlewares/logs/actionLogger.js
const { ActionLog } = require('../../models');

module.exports = async function actionLogger(req, actionType, tableAffected, recordId, oldValues = null, newValues = null) {
  if (!req.user) {
    console.warn('Intento de registro de acción sin usuario autenticado');
    return;
  }

  try {
    await ActionLog.create({
      user_id: req.user.user_id,
      action_type: actionType,
      table_affected: tableAffected,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'] || null,
      action_timestamp: new Date()
    });
    
    console.log(`✅ Acción registrada: ${actionType} en ${tableAffected}`);
  } catch (error) {
    console.error('❌ Error registrando acción:', error);
  }
};
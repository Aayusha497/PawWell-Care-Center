const { validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    
    // Format errors to match Django DRF style
    const formattedErrors = {};
    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = [];
      }
      formattedErrors[error.path].push(error.msg);
    });

    console.log('📤 Sending validation errors:', formattedErrors);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

module.exports = { handleValidationErrors };

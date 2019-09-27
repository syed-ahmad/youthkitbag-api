const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();

    if (errors.length) {
      const fieldErrors = {};

      errors.forEach(e => {
        fieldErrors[e.param] = e.msg;
      });

      return res.status(422).json({
        message:
          'Errors have been identified. Please correct them before continuing',
        errors: fieldErrors
      });
    }
  }

  next();
};

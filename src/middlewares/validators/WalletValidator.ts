import { functions } from 'lodash';
import { isAddress } from 'caver-js/packages/caver-utils/';
const { body, param, check, validationResult, custom } = require('express-validator');

exports.walletValidationRules = () => {
  return [
    body('address')
      .isLength({ min: 5, max: 100 })
      .withMessage('address length is invalid')
      .custom((value) => {
        if (!isAddress(value)) throw Error('address is invalid');
      }),
  ];
};

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};

import { humanReadableStringToHexAddress, isAddress } from 'caver-js/packages/caver-utils/';
const { body, param, check, query, validationResult, custom, optional } = require('express-validator');

exports.commonValidationRules = () => {
  return [
    query('page')
      .isNumeric()
      .withMessage('parameter is invalid(CODE:011)')
      .isLength({ max: 10000 })
      .withMessage('parameter is invalid(CODE:012)')
      .optional(),
    query('limit')
      .isNumeric()
      .withMessage('parameter is invalid(CODE:021)')
      .isLength({ max: 100 })
      .withMessage('parameter is invalid(CODE:022)')
      .optional(),
    query('status').isLength({ max: 100 }).withMessage('parameter is invalid(CODE:032)').optional(),
  ];
};

exports.nameValidationRules = () => {
  return [
    param('name')
      .isLength({ max: 100 })
      .withMessage('parameter is invalid(CODE:042)')
      .not()
      .withMessage('parameter is invalid(CODE:043)'),
  ];
};

exports.emailValidationRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('parameter is invalid(CODE:052)')
      .not()
      .withMessage('parameter is invalid(CODE:053)'),
  ];
};

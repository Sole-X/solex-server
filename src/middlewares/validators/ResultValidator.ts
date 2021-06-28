import { humanReadableStringToHexAddress, isAddress } from 'caver-js/packages/caver-utils/';
const { validationResult } = require('express-validator');

exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({ msg: errors.errors[0].msg });
};

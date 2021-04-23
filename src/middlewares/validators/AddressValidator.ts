import { humanReadableStringToHexAddress, isAddress } from 'caver-js/packages/caver-utils/';
const { body,param,check,query, validationResult,custom,optional } = require('express-validator');

exports.accountRules = () => {
  return param('accountAddr')
    .notEmpty().withMessage("parameter is invalid(CODE:101)")
    .isLength({ max: 100 }).withMessage("parameter is invalid(CODE:111)")
    .custom(value=>{
      if(!isAddress(value)) throw new Error('parameter is invalid(CODE:112)')
      return true;
    });
}

exports.connectRules = () => {
  return param('connectAddr')
    .optional()
    .isLength({ max: 100 }).withMessage("parameter is invalid(CODE:111)")
    .custom(value=>{
      if(!isAddress(value)) throw new Error('parameter is invalid(CODE:112)')
      return true;
    });
}

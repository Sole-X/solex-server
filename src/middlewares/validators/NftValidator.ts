import { humanReadableStringToHexAddress, isAddress } from 'caver-js/packages/caver-utils/';
const { body,param,check, validationResult,custom } = require('express-validator')

exports.nftValidationRules = () => {
  return [
    check('nftId').isNumeric()
    .optional()
    .withMessage("parameter is invalid")
  ]
}


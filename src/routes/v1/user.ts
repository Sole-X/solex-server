import { Router } from 'express';

import { Container, Service } from 'typedi';
const userCtrl = require('../../controllers/UserController');

const route = Router();
const { nftValidationRules } = require('../../middlewares/validators/NftValidator');
const { commonValidationRules } = require('../../middlewares/validators/CommonValidator');

const { validate } = require('../../middlewares/validators/ResultValidator');

export default (app: Router) => {
  app.use('/v1/users', route);

  //로그인
  route.post('/login', userCtrl.login);
};

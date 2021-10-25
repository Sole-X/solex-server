import { Router, Request, Response, NextFunction } from 'express';

const signCtrl = require('../../controllers/SignController');
const route = Router();

export default (app: Router) => {
  app.use('/v1/sign', route);

  route.post('/send', signCtrl.sign);

  route.post('/message', signCtrl.getSignMessage);
};

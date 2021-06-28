import { Router, Request, Response, NextFunction } from 'express';

const buyCtrl = require('../../controllers/BuyController');

const route = Router();

export default (app: Router) => {
  app.use('/v1/buys', route);

  route.get('', buyCtrl.search);

  route.get('/:buyId', buyCtrl.getBuy);
};

import { Router, Request, Response, NextFunction } from 'express';

const sellCtrl = require('../../controllers/SellController');

const route = Router();

export default (app: Router) => {
  app.use('/v1/sells', route);

  route.get('/:sellId', sellCtrl.getSell);

  route.get('/:sellId/negos', sellCtrl.getNegos);

  route.post('/:sellId/declineNego/:negoId', sellCtrl.declineNego);
};

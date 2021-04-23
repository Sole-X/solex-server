import { Router, Request, Response, NextFunction } from 'express';

const saleCtrl = require("../../controllers/SaleController");

const route = Router();

export default (app: Router) => {

  app.use('/v1/sale', route);

  route.get('/:tradeId', saleCtrl.getSale);

};

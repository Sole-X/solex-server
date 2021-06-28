import { Router, Request, Response, NextFunction } from "express";

const explorerCtrl = require("../../controllers/ExplorerController");
const route = Router();

export default (app: Router) => {
  app.use("/v1/explorer", route);

  //활동
  route.get("/activity", explorerCtrl.getActivity);

  //순위
  route.get("/rank", explorerCtrl.getRanking);
};

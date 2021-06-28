import { Router, Request, Response, NextFunction } from "express";

const commonCtrl = require("../../controllers/CommonController");
const route = Router();
const {
  nameValidationRules,
  emailValidationRules,
} = require("../../middlewares/validators/CommonValidator");

const { validate } = require("../../middlewares/validators/ResultValidator");

export default (app: Router) => {
  app.use("/v1/common", route);

  route.get("/token/whitelist", commonCtrl.getWhitelist);

  route.get("/sideInfo", commonCtrl.getSideInfo);

  route.get("/staking", commonCtrl.getStakingInfo);

  route.post("/report", commonCtrl.sendMail);

  //이름 사용 가능 여부
  route.get(
    "/nameCheck/:username",
    [nameValidationRules()],
    validate,
    commonCtrl.nameCheck
  );

  route.post(
    "/newsletter",
    [emailValidationRules()],
    validate,
    commonCtrl.registNewsletter
  );
};

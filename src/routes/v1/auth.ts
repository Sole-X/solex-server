import { Router, Request, Response, NextFunction } from "express";
const userCtrl = require("../../controllers/UserController");
import middlewares from "../../middlewares/auth";

const route = Router();

export default (app: Router) => {
  app.use("/v1/auth", route);

  route.post(
    "/verify",
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    userCtrl.verify
  );

  route.post("/login", userCtrl.login);
};

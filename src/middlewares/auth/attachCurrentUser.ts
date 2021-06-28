import { Container } from "typedi";

import { Logger } from "winston";
import { Account } from "../../entities/Account";

/**
 * Attach user to req.currentUser
 * @param {*} req Express req Object
 * @param {*} res  Express res Object
 * @param {*} next  Express next Function
 */
const attachCurrentUser = async (req, res, next) => {
  const Logger: Logger = Container.get("logger");
  try {
    const userRecord = await Account.findOne({
      accountAddress: req.token._addr,
    });
    if (!userRecord) {
      //return res.sendStatus(401);
    }

    Reflect.deleteProperty(userRecord, "password");
    Reflect.deleteProperty(userRecord, "salt");
    req.currentUser = userRecord;
    return next();
  } catch (e) {
    Logger.error("🔥 Error attaching user to req: %o", e);
    return next(e);
  }
};

export default attachCurrentUser;

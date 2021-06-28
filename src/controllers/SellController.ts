import { In } from "typeorm";
import { Sale } from "../entities/Sale";
import { SellNego } from "../entities/SellNego";
import { Container } from "typedi";
import { CommonService } from "../services/CommonService";

exports.getSell = async function (req, res, next) {
  const commonService: CommonService = Container.get("CommonService");

  const sellId = req.params.sellId;
  var where = { id: sellId };
  var order = { createdAt: "DESC" };
  var relation = ["negos"];

  var status: any = req.query.status;
  if (status) where["status"] = In(status.split(","));

  try {
    const result: any = await Sale.pagination(
      req.params.page,
      req.params.limit,
      where,
      order,
      relation
    );

    if (result) {
      result.items = await commonService.convertStatusStr(result.items, "SELL");

      for (let i = 0; i < result.items.length; i++) {
        if (result.items[i].negos)
          result.items[i].negos = await commonService.convertStatusStr(
            result.items[i].negos,
            "NEGO"
          );
      }
    }

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

exports.getNegos = async function (req, res, next) {
  const sellId = req.params.sellId;
  const where = { sellId: sellId };
  const order = { createdAt: "DESC" };

  try {
    const result = await SellNego.pagination(
      req.params.page,
      req.params.limit,
      where,
      order
    );
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

exports.declineNego = async function (req, res, next) {
  const nodeService: any = Container.get("NodeService");

  const sellId = req.params.sellId;
  const negoId = req.params.negoId;

  const declineType = req.body.declineType || 1;
  const declineReason = req.body.declineReason || "";
  const connectAddr = req.body.connectAddr || "";
  const hashType = req.body.hashType || "";
  const msg = req.body.msg || "";
  const signHash = req.body.signHash || "";

  try {
    const [result, signAddress, v, r, s] = await nodeService.checkSignAddress(
      connectAddr,
      hashType,
      msg,
      signHash
    );

    const sell = await Sale.findOne(sellId);

    if (!result) throw Error("INVALID OWNER");
    if (!sell) throw Error("NO SELL");
    if (sell.ownerAddress.toLowerCase() != connectAddr.toLowerCase())
      throw Error("INVALID OWNER");

    var sellNego = await SellNego.findOne(negoId);
    //if(sellNego.status != 5) throw Error("INVALID STATUS");

    sellNego.declineType = declineType;
    sellNego.declineReason = declineReason;
    sellNego.save();

    return res.status(200).json({ msg: "OK" });
  } catch (e) {
    return next(e);
  }
};

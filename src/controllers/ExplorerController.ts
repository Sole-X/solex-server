import { Container } from "typedi";
import { Request, Response, NextFunction } from "express";

import { Activity } from "../entities/Activity";
import { NftRank } from "../entities/NftRank";
import { Not, In } from "typeorm";

//아이템 검색
exports.getActivity = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const commonService: any = Container.get("CommonService");
  const nftService: any = Container.get("NftService");
  const constant: any = Container.get("constant");

  try {
    var eventType: any = req.query.status;
    var category: any = req.query.category;
    var collection: any = req.query.collection;
    var accountAddr: any = req.query.accountAddr;
    var order: any = req.query.order || "DATE";
    const platform: any = req.query.platform;

    order = await commonService.makeOrderFromReq(order);

    var where = await commonService.makeWhereFromReq({
      eventType: eventType,
      category: category,
      collection: collection,
      platformByInfo: platform,
    });

    if (!("eventType" in where) || !where["eventType"]) {
      where["eventType"] = Not(
        In([constant.TYPE.EVENT.TOKEN, constant.TYPE.EVENT.NFT])
      );
    }

    var data = await Activity.pagination(req.query.page, 20, where, order, [
      "nftDesc",
    ]);
    data.items = await commonService.convertStatusStr(
      data.items,
      "EVENT",
      "TYPE",
      "eventType"
    );

    data.items = data.items.reduce((result, item: any) => {
      var eventType;
      if (item.eventType == 1) {
        eventType = "AUCTION";
      } else if (item.eventType == 2) {
        eventType = "SELL";
      } else if (item.eventType == 3) {
        eventType = "BUY";
      } else if (item.eventType == 4) {
        eventType = "BID";
      } else if (item.eventType == 5) {
        eventType = "NEGO";
      } else if (item.eventType == 6) {
        eventType = "NFT";
      } else if (item.eventType == 7) {
        eventType = "TOKEN";
      }

      const key = Object.keys(constant.STATUS[eventType]).find(
        (key) => constant.STATUS[eventType][key] === item.status
      );
      item["statusStr"] = key;
      result.push(item);
      return result;
    }, []);
    data.items = await commonService.convertStatusStr(
      data.items,
      "EVENT",
      "TYPE",
      "eventType"
    );
    data.items = await commonService.bindAccountDesc(
      data.items,
      "EVENT",
      "TYPE",
      "eventType"
    );
    return res.status(200).json(data);
  } catch (e) {
    return next(e);
  }
};

//select tokenAddress,count(*) from nft_item
//group by tokenAddress
exports.getRanking = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const commonService: any = Container.get("CommonService");

  var target: any = req.query.target || "total";
  var orderBy: any = req.query.order || "DESC";
  var page: any = req.query.page || 1;
  var limit: any = req.query.limit || 20;
  var category: any = req.query.category;
  var collection: any = req.query.collection;

  var order = {};
  order[target] = orderBy;

  var where = await commonService.makeWhereFromReq({
    category: category,
    collection: collection,
  });

  try {
    var ranks = await NftRank.pagination(page, limit, where, order);

    return res.status(200).json(ranks);
  } catch (e) {
    return next(e);
  }
};

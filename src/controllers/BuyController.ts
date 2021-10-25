import { In } from 'typeorm';
import { Buy } from '../entities/Buy';
import { Container } from 'typedi';

exports.search = async function (req, res, next) {
  const nftService: any = Container.get('NftService');
  const constant: any = Container.get('constant');
  const commonService: any = Container.get('CommonService');

  const buyerAddr = req.query.buyerAddr;
  var order: any = req.query.order || 'DATE';
  var collection = req.query.collection;
  var category = req.query.category;
  var currency = req.query.currency;
  var price = req.query.price;
  var search = req.query.search;
  var publisher = req.query.publisher;
  const lifeStatus = req.query.lifeStatus || '';

  const platform: any = req.query.platform;

  try {
    var where = await commonService.makeWhereFromReq({
      category: category,
      collection: collection,
      currency: currency,
      price: price,
      priceName: 'basePrice',
      search: search,
      platformByInfo: platform,
      publisher: publisher,
    });

    if (lifeStatus == 'START') {
      where['status'] = constant.STATUS.BUY.START;
    } else if (lifeStatus == 'DONE') {
      where['status'] = constant.STATUS.BUY.DONE;
    } else {
      where['status'] = In([constant.STATUS.BUY.START, constant.STATUS.BUY.DONE]);
    }

    if (buyerAddr) where['buyerAddress'] = buyerAddr;

    order = await commonService.makeOrderFromReq(order);

    var result: any = await Buy.pagination(req.query.page, req.query.limit, where, order);

    result.items = await nftService.bindNft(result.items, true);
    result.items = await nftService.bindInfo(result.items, ['like', 'buyInfo'], { connectAddr: req.query.connectAddr });

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

exports.getBuy = async function (req, res, next) {
  const nftService: any = Container.get('NftService');

  const buyId = req.params.buyId;

  try {
    var result = await Buy.findOne(buyId);
    result = (await nftService.bindNft([result], true))[0];
    result = (
      await nftService.bindInfo([result], ['trade', 'like', 'buyInfo', 'usdPrice'], {
        connectAddr: req.query.connectAddr,
      })
    )[0];

    return res.status(200).json({ buy: result });
  } catch (e) {
    return next(e);
  }
};

import { Sale } from '../entities/Sale';
import { In } from 'typeorm';
import { CommonService } from '../services/CommonService';
import { Container } from 'typedi';

exports.search = async function (req, res, next) {
  const commonService = Container.get(CommonService);
  const constant: any = Container.get('constant');
  const order = { updatedAt: 'DESC' };
  const page = req.params.page;
  const limit = req.params.limit;

  try {
    var where = await commonService.makeWhereFromReq({
      status: req.query.status,
    });
    where['type'] = In([constant.TYPE.SALE.NORMAL_AUCTION, constant.TYPE.SALE.INSTANT_AUCTION]);
    const result = await Sale.pagination(page, limit, where, order);

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

exports.getSale = async function (req, res, next) {
  const nftService: any = Container.get('NftService');
  const constant: any = Container.get('constant');
  const tradeId = req.params.tradeId;

  try {
    var result = await Sale.findOne({
      where: { id: tradeId },
      relations: ['bids', 'negos'],
    });
    if (!result) throw Error('NO SALE');

    //?connectAddr=0x2bfe852660947d88d5156e5ae3e387e351ea2cb9
    result = (
      await nftService.bindInfo([result], ['like'], {
        connectAddr: req.query.connectAddr,
      })
    )[0];

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

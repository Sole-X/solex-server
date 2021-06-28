import { Container } from 'typedi';
import { In, Like, Not, MoreThan, MoreThanOrEqual, getRepository } from 'typeorm';

import { Account } from '../entities/Account';
import { TokenBalance } from '../entities/TokenBalance';
import { NftItem } from '../entities/NftItem';
import { NftInfo } from '../entities/NftInfo';
import { Activity } from '../entities/Activity';
import { Stake } from '../entities/Stake';
import { StakeActivity } from '../entities/StakeActivity';
import { StakeReward } from '../entities/StakeReward';
import { Agreement } from '../entities/Agreement';
import { TokenInfo } from '../entities/TokenInfo';

const fs = require('fs');
const mime = require('mime');

//api-docs 에서 확인할때
exports.getInfo = async function (req, res, next) {
  var accountAddr = req.params.accountAddr;
  try {
    var account = await Account.findOne({ accountAddress: accountAddr });
    if (!account) throw Error('NO ACCOUNT');

    const agree = await Agreement.findOne(accountAddr);

    account['agree'] = agree ? agree.status : false;

    return res.status(200).json(account);
  } catch (e) {
    return next(e);
  }
};

exports.getTotalBalance = async function (req, res, next) {
  const constant: any = Container.get('constant');
  const nftService: any = Container.get('NftService');
  const accountAddr = req.params.accountAddr;
  const tokenInfo = await TokenInfo.find({ select: ['tokenAddress'] });
  const tokenArr = tokenInfo.map((item) => item.tokenAddress);

  const balances = await TokenBalance.find({
    where: { accountAddress: accountAddr, tokenAddress: In(tokenArr) },
  });
  const count = await NftItem.count({
    ownerAddress: accountAddr,
    status: Not(constant.STATUS.TOKEN.WITHDRAW),
  });
  const sellCount = await NftItem.count({
    ownerAddress: accountAddr,
    status: constant.STATUS.TOKEN.SELL,
  });
  const auctionCount = await NftItem.count({
    ownerAddress: accountAddr,
    status: constant.STATUS.TOKEN.AUCTION,
  });
  const nftActivityCount = await Activity.count({
    accountAddress: accountAddr,
    eventType: Not(constant.TYPE.EVENT.TOKEN),
  });
  const tokenActivityCount = await Activity.count({
    accountAddress: accountAddr,
    eventType: constant.TYPE.EVENT.TOKEN,
  });
  var lockTokenArr = await Activity.find({
    select: ['eventType', 'tradeId', 'tokenAddress', 'tokenId', 'amount', 'currency'],
    where: {
      accountAddress: accountAddr,
      eventType: In([constant.TYPE.EVENT.BUY, constant.TYPE.EVENT.BID, constant.TYPE.EVENT.NEGO]),
      status: constant.STATUS.BUY.START,
    },
  });

  lockTokenArr = await nftService.bindNft(lockTokenArr, true);

  var lockToken = lockTokenArr.reduce((result, item) => {
    const key = Object.keys(constant.TYPE.EVENT).find((key) => constant.TYPE.EVENT[key] === item.eventType);

    delete item.status;

    if (key in result) {
      result[key].push(item);
    } else {
      result[key] = [item];
    }
    return result;
  }, {});

  try {
    return res.status(200).json({
      tokens: balances,
      nftCnt: count,
      nftSellCnt: sellCount,
      nftAuctionCnt: auctionCount,
      activityNftCnt: nftActivityCount,
      activityTokenCnt: tokenActivityCount,
      lockToken: lockToken,
    });
  } catch (e) {
    return next(e);
  }
};

exports.getNfts = async function (req, res, next) {
  const commonService: any = Container.get('CommonService');
  const nftService: any = Container.get('NftService');
  const constant: any = Container.get('constant');

  const accountAddr = req.params.accountAddr;
  const page = req.query.page;
  const limit = req.query.limit;
  const status = req.query.status;
  const order = { updatedAt: 'DESC' };

  try {
    var where = await commonService.makeWhereFromReq({
      ownerAddress: accountAddr,
    });

    if (status == 'SALE') {
      where['status'] = In([constant.STATUS.NFT.SELL, constant.STATUS.NFT.AUCTION]);
    }
    var nfts = await NftItem.pagination(page, limit, where, order, ['desc']);

    if (nfts.items.length > 0)
      nfts.items = await nftService.bindInfo(nfts.items, ['trade', 'like', 'buyInfo'], {
        connectAddr: req.query.connectAddr,
      });

    return res.status(200).json(nfts);
  } catch (e) {
    return next(e);
  }
};

exports.getActivites = async function (req, res, next) {
  const commonService: any = Container.get('CommonService');
  const nftService: any = Container.get('NftService');
  const constant: any = Container.get('constant');

  const accountAddr = req.params.accountAddr;
  const status = req.query.status;
  const categories = req.query.category;
  const platform = req.query.platform;
  const event = req.query.event;
  const txHash = req.query.txHash;
  const currency = req.query.currency;
  const tokenName = req.query.tokenName;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  var collections = req.query.collections;
  var order = { updatedAt: 'DESC' };

  try {
    const nftInfos = await NftInfo.find({
      select: ['tokenAddress'],
      where: [{ name: Like('%' + tokenName + '%') }, { symbol: Like('%' + tokenName + '%') }],
    });
    nftInfos.forEach((nftInfo) => {
      collections += ',' + nftInfo.tokenAddress;
    });

    var where = await commonService.makeWhereFromReq({
      accountAddress: accountAddr,
      eventType: event,
      category: categories,
      collection: collections,
      platform: platform,
      currency: currency,
    });

    if (status == 'ING') {
      where['status'] = Not(constant.STATUS.SALE.DONE);
    } else if (status == 'DONE') {
      where['status'] = constant.STATUS.SALE.DONE;
    }
    if (txHash) where['txHash'] = txHash;

    var activites = await Activity.pagination(page, limit, where, order);
    activites.items = await commonService.convertStatusStr(activites.items, 'EVENT', 'TYPE', 'eventType');

    activites.items = activites.items.reduce((result, item: any) => {
      var eventType;
      if (item.eventType == 1) {
        eventType = 'AUCTION';
      } else if (item.eventType == 2) {
        eventType = 'SELL';
      } else if (item.eventType == 3) {
        eventType = 'BUY';
      } else if (item.eventType == 4) {
        eventType = 'BID';
      } else if (item.eventType == 5) {
        eventType = 'NEGO';
      } else if (item.eventType == 6) {
        eventType = 'NFT';
      } else if (item.eventType == 7) {
        eventType = 'TOKEN';
      }

      const key = Object.keys(constant.STATUS[eventType]).find(
        (key) => constant.STATUS[eventType][key] === item.status,
      );
      item['statusStr'] = key;
      result.push(item);
      return result;
    }, []);

    activites.items = await nftService.bindNft(activites.items, true);
    activites.items = await nftService.bindNegos(activites.items);

    return res.status(200).json(activites);
  } catch (e) {
    return next(e);
  }
};

exports.getStaking = async function (req, res, next) {
  const commonService: any = Container.get('CommonService');
  const nodeService: any = Container.get('NodeService');
  const currency: any = Container.get('currency');
  const constant: any = Container.get('constant');

  const accountAddr = req.params.accountAddr;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  const where = await commonService.makeWhereFromReq({
    accountAddress: accountAddr,
  });

  var activites = await StakeActivity.pagination(page, limit, where, {
    updatedAt: 'DESC',
  });
  activites.items = commonService.constantToStr(activites.items, 'STAKE');

  const stake = await Stake.findOne(accountAddr);
  const rewardInfo = await nodeService.getRewardInfo(accountAddr);

  var nowDate = new Date();
  var pastDate = nowDate.getDate() - 7;
  nowDate.setDate(pastDate);

  const weekRewardRst: any = await getRepository(StakeActivity)
    .createQueryBuilder()
    .select(['currency', 'SUM(amount) as weekAmount'])
    .where({
      updatedAt: MoreThanOrEqual(nowDate),
      amount: MoreThan(0),
      accountAddress: accountAddr,
      type: constant.TYPE.STAKE.REWARD,
    })
    .groupBy('currency')
    .getRawMany();
  var weekReward = {};
  for (var raw of weekRewardRst) {
    weekReward[raw.currency.toLowerCase()] = raw.weekAmount;
  }
  var rewards = [];
  for (let tokenAddr in currency) {
    if (currency[tokenAddr].reward == 1) {
      const yetAmount = rewardInfo[tokenAddr] > 0 ? rewardInfo[tokenAddr] : 0;

      const stakeReward = await StakeReward.findOne({
        where: { accountAddress: accountAddr, currency: tokenAddr },
      });

      if (stakeReward) {
        stakeReward.amount = yetAmount;

        if (tokenAddr in weekReward) stakeReward['weekAmount'] = weekReward[tokenAddr];
        rewards.push(stakeReward);
      } else {
        rewards.push({
          currency: tokenAddr,
          amount: yetAmount,
          totalReward: 0,
        });
      }
    }
  }
  try {
    return res.status(200).json({ info: stake, rewards: rewards, activity: activites });
  } catch (e) {
    return next(e);
  }
};

exports.editProfile = async function (req, res, next) {
  const commonService: any = Container.get('CommonService');
  const nodeService: any = Container.get('NodeService');

  const accountAddr = req.params.accountAddr;
  const username = req.body.username || '';
  const profile = req.file && req.file.path ? req.file.path : '';
  const hashType = req.body.hashType || '';
  const msg = req.body.msg || '';
  const signHash = req.body.signHash || '';
  const display = req.body.display || '';

  try {
    var account = await Account.findOne({ accountAddress: accountAddr });
    if (!account) {
      account = await new Account();
      account.username = 'user_' + accountAddr.replace('0x', '').slice(0, 6);
      account.accountAddress = accountAddr;
    }

    //console.log('file ',req.body)

    if (req.body.file && req.body.file.toString().indexOf('base64') > -1) {
      var matches = req.body.file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

      const imageBuffer = Buffer.from(matches[2], 'base64');
      if (imageBuffer.length / 1e6 > 10) throw Error('INVALID FILE SIZE');

      const extension = mime.getExtension(matches[1]);
      const fileName = accountAddr + '.' + extension;

      if (matches.length !== 3) return new Error('INVALID FILE');

      await fs.writeFileSync('uploads/images/' + fileName, imageBuffer, 'utf8');
      account.profile = fileName;
    }

    const [result, signAddress, v, r, s] = await nodeService.checkSignAddress(accountAddr, hashType, msg, signHash);

    if (!result) throw Error('INVALID SIGN');
    if (signAddress != accountAddr) throw Error('INVALID SIGN');
    if (username != '') account.username = username;
    if (display != '') account.display = display;

    account.save();

    return res.status(200).json(account);
  } catch (e) {
    console.log('e', e);
    return next(e);
  }
};

exports.setAgreement = async function (req, res, next) {
  const accountAddr = req.params.accountAddr;
  const cate = req.body.cate | 1;
  const statusStr = req.body.status;

  try {
    const status = statusStr == 'TRUE' ? 1 : 0;
    const result = await Agreement.findOne(accountAddr);
    if (!result) {
      await Agreement.insert({
        accountAddress: accountAddr,
        agreementCate: cate,
        status: status,
      });
    } else {
      result.status = status;
      result.save();
    }

    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
};

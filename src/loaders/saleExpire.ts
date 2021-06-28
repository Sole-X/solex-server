import { Container } from 'typedi';

import { Sale } from '../entities/Sale';
import { SaleExpire } from '../entities/SaleExpire';

import { getRepository, In, LessThan, Between } from 'typeorm';

const ethUtil = require('web3-utils');
const abiCoder = require('web3-eth-abi');
const moment = require('moment');

export default async () => {
  const logger: any = Container.get('logger');
  const constant: any = Container.get('constant');
  const caver: any = Container.get('kasCaver');
  const contractAddress: any = Container.get('contractAddress');
  const abiService: any = Container.get('AbiService');

  try {
    while (true) {
      var dataArr = await Sale.find({
        select: ['id'],
        where: {
          type: In([constant.TYPE.SALE.NORMAL_AUCTION, constant.TYPE.SALE.INSTANT_AUCTION]),
          status: constant.STATUS.SALE.START,
          endTime: Between(moment().subtract(5, 'minutes').format(), moment().format()),
        },
      });

      const saleIds = dataArr.map((result) => result.id);
      const saleExpireArr = await SaleExpire.find({
        where: { id: In(saleIds) },
      });
      const saleExpireIds = saleExpireArr.map((result) => result.id);

      for (let i = 0; i < dataArr.length; i++) {
        const hash = ethUtil.randomHex(28) + ethUtil.toHex(Math.floor(Date.now() / 1000)).slice(2);
        const executeAbi = abiService.getFunctionAbi('auction-abi', 'closeAuction');
        const encoded = abiCoder.encodeFunctionCall(executeAbi, [hash, dataArr[i].id]);
        var status = constant.STATUS.SALE_QUEUE.PENDING;

        const tx = {
          from: contractAddress['KasAccount'],
          to: contractAddress['AuctionContract'],
          value: 0,
          input: encoded,
          gas: 500000,
          submit: true,
        };

        try {
          const result = await caver.kas.wallet.requestSmartContractExecution(tx);
          await SaleExpire.createQueryBuilder()
            .insert()
            .values({
              id: dataArr[i].id,
              txHash: result.transactionHash,
              status: status,
            })
            .orUpdate({ conflict_target: ['id'], overwrite: ['status'] })
            .updateEntity(false)
            .execute();
        } catch (e) {
          logger.error('sale queue pending error' + e.message);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      await new Promise((r) => setTimeout(r, 1000 * 60));
    }
  } catch (e) {
    status = constant.STATUS.SALE_QUEUE.FAIL;

    logger.error('sale queue error' + e.message);
    await new Promise((r) => setTimeout(r, 1000 * 60));
  }
};

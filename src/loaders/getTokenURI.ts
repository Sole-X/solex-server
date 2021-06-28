import { Container } from 'typedi';
import { NodeService } from '../services/NodeService';

import { NftQueue } from '../entities/NftQueue';
import { NftItem } from '../entities/NftItem';
import { NftItemDesc } from '../entities/NftItemDesc';
import { Buy } from '../entities/Buy';

import { getRepository } from 'typeorm';

const rp = require('request-promise');

export default async () => {
  const nftService: any = Container.get('NftService');
  const logger: any = Container.get('logger');
  while (true) {
    try {
      var dataArr = await NftQueue.find({
        select: ['id', 'tokenAddress', 'tokenId'],
        order: { id: 'ASC' },
      });
      for (let i = 0; i < dataArr.length; i++) {
        const nftItemDesc = await NftItemDesc.findOne({
          select: ['tokenAddress'],
          where: {
            tokenAddress: dataArr[i].tokenAddress,
            tokenId: dataArr[i].tokenId,
          },
        });

        if (!nftItemDesc) {
          await nftService.getMetadata(dataArr[i].tokenAddress, dataArr[i].tokenId);
        }
        await getRepository(NftQueue).delete(dataArr[i].id);
      }

      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      logger.error('tokenURI error' + e.message);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
};

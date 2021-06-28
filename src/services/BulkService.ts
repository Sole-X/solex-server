import { Service, Inject } from 'typedi';
import { NftRank } from '../entities/NftRank';
import { getRepository, In, Not, getConnection } from 'typeorm';
import { NftItem } from '../entities/NftItem';

export interface BulkData {
  tableName: string;
  data: object;
  queryType: string;
  where?: object;
  conflict_target?: string[];
  overwrite?: string[];
}

@Service('BulkService')
export class BulkService {
  insertQueue: Map<string, Map<string, Array<BulkData>>> = new Map();
  updateQueue: Map<string, Array<BulkData>> = new Map();
  upsertQueue: Map<string, Map<string, Array<BulkData>>> = new Map();

  expireQueue: Map<string, number> = new Map();

  constructor(
    @Inject('logger') private logger,
    @Inject('constant') private constant,
    @Inject('CommonService') private commonService,
  ) {}

  public addData(id, data: BulkData) {
    var strKey = String(id); //키 타입 string으로 고정

    if (data.queryType == 'insert') {
      if (!this.insertQueue.has(strKey)) {
        var typeMap = new Map([[data.tableName, [data]]]);
        this.insertQueue.set(strKey, typeMap);
        this.expireQueue.set(strKey + 'insert', new Date().getTime());
      } else {
        let idArr = this.insertQueue.get(strKey);
        if (!idArr.has(data.tableName)) {
          idArr.set(data.tableName, [data]);
        } else {
          let bulkArr = idArr.get(data.tableName);
          bulkArr.push(data);
          idArr.set(data.tableName, bulkArr);
        }

        this.insertQueue.set(strKey, idArr);
      }
    } else if (data.queryType == 'update') {
      if (!this.updateQueue.has(strKey)) {
        this.updateQueue.set(strKey, [data]);
        this.expireQueue.set(strKey + 'update', new Date().getTime());
      } else {
        let bulkArr = this.updateQueue.get(strKey);
        bulkArr.push(data);
        this.updateQueue.set(strKey, bulkArr);
      }
    } else if (data.queryType == 'upsert') {
      if (!this.upsertQueue.has(strKey)) {
        var typeMap = new Map([[data.tableName, [data]]]);
        this.upsertQueue.set(strKey, typeMap);
        this.expireQueue.set(strKey + 'upsert', new Date().getTime());
      } else {
        let idArr = this.upsertQueue.get(strKey);
        if (!idArr.has(data.tableName)) {
          idArr.set(data.tableName, [data]);
        } else {
          let bulkArr = idArr.get(data.tableName);
          bulkArr.push(data);
          idArr.set(data.tableName, bulkArr);
        }

        this.upsertQueue.set(strKey, idArr);
      }
    }
  }

  public expireCheck() {
    var now = new Date().getTime();
    this.expireQueue.forEach((value, key) => {
      //5분 넘었으면 삭제
      if (now - value > 1000 * 60 * 5) this.expireQueue.delete(key);
    });
  }

  public async executeBulk(id, type = null) {
    var idKey = String(id);

    const queryRunner = await getConnection().createQueryRunner();
    await queryRunner.startTransaction();

    try {
      if (this.insertQueue.size > 0 && this.insertQueue.has(idKey)) {
        var insertBulkData = this.insertQueue.get(idKey);
        this.insertQueue.delete(idKey);

        for (var entry of insertBulkData.entries()) {
          var values = [];
          var tableName = entry[0],
            value = entry[1];

          value.forEach((bulkData) => {
            values.push(bulkData.data);
          });

          await queryRunner.manager
            .createQueryBuilder()
            .insert()
            .into(tableName)
            .values(values)
            .updateEntity(false)
            .execute();
        }
      }

      if (this.upsertQueue.size > 0 && this.upsertQueue.has(idKey)) {
        var upsertBulk = this.upsertQueue.get(idKey);
        this.upsertQueue.delete(idKey);
        for (var entry of upsertBulk.entries()) {
          var values = [];
          var tableName = entry[0],
            value = entry[1];

          for (let i = 0; i < value.length; i++) {
            await queryRunner.manager
              .createQueryBuilder()
              .insert()
              .into(tableName)
              .values(value[i].data)
              .orUpdate({
                conflict_target: value[i].conflict_target,
                overwrite: value[i].overwrite,
              })
              .updateEntity(false)
              .execute();
          }
        }
      }

      if (this.updateQueue.size > 0 && this.updateQueue.has(idKey)) {
        var updateBulk = this.updateQueue.get(idKey);
        this.updateQueue.delete(idKey);

        for (let i = 0; i < updateBulk.length; i++) {
          await queryRunner.manager
            .createQueryBuilder()
            .update(updateBulk[i].tableName)
            .set(updateBulk[i].data)
            .where(updateBulk[i].where)
            .updateEntity(false)
            .execute();
        }
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Transaction Err' + e.message);
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async rankSyncInBulk(bulkService, blockNo) {
    const ownerCntresult = await getRepository(NftItem).query(
      'SELECT tokenAddress,count(tokenAddress) as ownerCnt from ' +
        " (select tokenAddress,ownerAddress FROM nft_item WHERE status != '" +
        this.constant.STATUS.NFT.WITHDRAW +
        "' group by tokenAddress, ownerAddress ) " +
        ' AS T2 group by tokenAddress',
    );
    const nftCntResult = await getRepository(NftItem).query(
      'SELECT tokenAddress,count(*) AS cnt ' + 'FROM nft_item WHERE nft_item.status != 7 GROUP BY tokenAddress',
    );

    for (let i = 0; i < ownerCntresult.length; i++) {
      const nftCnt = nftCntResult[i].cnt ? nftCntResult[i].cnt : 0;
      await bulkService.addData(blockNo, {
        tableName: 'nft_rank',
        data: { ownerCnt: ownerCntresult[i].ownerCnt, nftCnt: nftCnt },
        where: { tokenAddress: ownerCntresult[i].tokenAddress },
        queryType: 'update',
      });
    }

    await bulkService.addData(blockNo, {
      tableName: 'nft_rank',
      data: {
        change: () => 'IF(beforeWeek>0,(((week - beforeWeek) / beforeWeek)*100),100) ',
        avgPrice: () => 'IF(tradeCnt>0,total / tradeCnt,0)',
      },
      where: {},
      queryType: 'update',
    });
  }

  async rankInBulk(bulkService, blockNo, tokenAddress, usdPrice, option = []) {
    var data = { tokenAddress: tokenAddress };

    if (option.includes('total') && usdPrice > 0) {
      data['total'] = () => 'total+' + usdPrice;
    }

    if (option.includes('tradeCnt')) {
      data['tradeCnt'] = () => 'tradeCnt+1';
    }

    if (option.includes('nftCntPlus') || option.includes('nftCntMinus')) {
      data['nftCnt'] = () => (option.includes('nftCntPlus') ? 'nftCnt+1' : 'nftCnt-1');
    }

    if (option.includes('week') && usdPrice > 0) {
      const nftRank = await NftRank.findOne(tokenAddress);

      const year = new Date().getFullYear();
      const weekNum = await this.commonService.getWeekNum();
      const dateKey = year.toString() + weekNum.toString();

      if (!nftRank || nftRank.dateKey != dateKey) {
        var week = 0;
        if (nftRank) week = Number(nftRank.week);

        await bulkService.addData(blockNo, {
          tableName: 'nft_rank',
          data: {
            tokenAddress: tokenAddress,
            dateKey: dateKey,
            week: 0,
            beforeWeek: week,
          },
          queryType: 'upsert',
          conflict_target: ['tokenAddress'],
          overwrite: ['dateKey', 'week', 'beforeWeek'],
        });
      }
      data['week'] = () => 'week+' + usdPrice;
    }

    if (Object.keys(data).length > 1) {
      await bulkService.addData(blockNo, {
        tableName: 'nft_rank',
        data: data,
        where: { tokenAddress: tokenAddress },
        queryType: 'update',
      });
    }
  }
}

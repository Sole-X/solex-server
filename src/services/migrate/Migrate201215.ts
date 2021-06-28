import { Container, Service, Inject } from "typedi";
import { BulkData, BulkService } from "../BulkService";
import { EventService } from "../sync/EventService";
import { RedisService } from "../RedisService";
import { NodeService } from "../NodeService";

@Service("Sync201215")
export class Sync201215 {
  private currentBlockNo = 0;

  constructor(
    @Inject("RedisService") private redisService: RedisService,
    @Inject("NodeService") private nodeService: NodeService,
    @Inject("BulkService") private bulkService: BulkService,
    @Inject("EventService") private eventService: EventService,
    @Inject("logger") private logger
  ) {}

  public async setRedisCurBlockNo() {
    var errFlag = false;

    this.nodeService
      .getBlockNumber()
      .then((blockNo) => {
        if (blockNo > 0) {
          if (this.currentBlockNo != blockNo) this.blockSync(blockNo);
          this.currentBlockNo = blockNo;
          this.redisService.set("currentBlockNo", blockNo);
        } else {
          errFlag = true;
          if (!errFlag)
            //에러메시지
            return;
        }
      })
      .catch((e) => {
        this.logger.error(e.message);
      });

    /*
      var blocks = await Block.find({
        where:{
          blockNumber: Between(startRange,endRange),
          version:LessThan(Container.get("migrationVersion").toString())
        }
      });
      */
  }

  public async blockSync(blockNo) {
    return this.nodeService
      .getBlockWithConsensusInfo(blockNo)
      .then(async (currBlock) => {
        const blockDate = new Date(
          this.nodeService.getHexToNumberString(currBlock.timestamp) * 1000
        );

        await this.bulkService.addData(blockNo, {
          tableName: "block",
          data: {
            blockNumber: blockNo,
            version: Container.get("migrationVersion"),
            createdAt: blockDate,
          },
          queryType: "upsert",
          conflict_target: ["blockNumber"],
          overwrite: ["version"],
        });

        await this.txDataSync(blockNo, currBlock.transactions, blockDate);

        //생성된 insert update 처리
        await this.bulkService.executeBulk(blockNo);
        return true;
      })
      .catch((e) => {
        if (e.errno === 1213) {
          this.logger.error(e.message);
        } else {
          this.logger.error(e);
        }
        return false;
      });
  }

  public async txDataSync(blockNo, transactions, blockDate) {
    var queryArrTx: any[] = [];
    for (const transaction of transactions) {
      await this.eventDataSync(
        blockNo,
        this.nodeService.getHexToNumberString(transaction.transactionIndex),
        transaction.logs,
        blockDate
      );

      // Transaction.create({
      //   platformId:0,
      //   tokenId:0,
      //   blockNumber: blockNumber,
      //   txHash: transaction.transactionHash,
      //   txType: transaction.type || '',
      //   gasUsed: transaction.gasUsed || '',
      //   gasPrice: transaction.gasPrice || '',
      //   fromAddress: transaction.from || '',
      //   toAddress: transaction.to || '',
      //   contractAddress: transaction.contractAddress || '',
      //   amount: transaction.value || '',
      //   tokenAddress: transaction.contractAddress || '',
      //   txStatus: this.caverClient.utils.hexToNumber(transaction.status) ? 1 : this.caverClient.utils.hexToNumber(transaction.txError || '0x0'),
      //   nftId:1,   //TODO 수정해야댐
      //   createdAt: blockDate,
      // })
    } // END PROCESSING BLOCK TRANSACTIONS

    return queryArrTx;
  }

  public async eventDataSync(blockNumber, txIndex, events, blockDate) {
    var queryArrEvt: any[] = [];
    /*
    for (const log of events) {
      await this.eventService.handler(blockNumber,
        txIndex,
        this.nodeService.getHexToNumberString(log.logIndex),
        log,
        blockDate)
    }
*/
    return queryArrEvt;
  }
}

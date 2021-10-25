import { Container, Service, Inject } from 'typedi';
import { BulkService } from '../BulkService';
import { EventService } from './EventService';
import { NodeService } from '../NodeService';
import { AbiService } from '../AbiService';

import { Variable } from '../../entities/Variable';

@Service('Sync')
export class Sync {
  blockNoVariable: Variable;
  functionQueue: Map<string, Array<any>> = new Map();

  constructor(
    @Inject('NodeService') private nodeService: NodeService,
    @Inject('BulkService') private bulkService: BulkService,
    @Inject('EventService') private eventService: EventService,
    @Inject('AbiService') private abiService: AbiService,
    @Inject('contractAddress') private contractAddress,
    @Inject('constant') private constant,
    @Inject('SocketService') private socketService,
    @Inject('logger') private logger,
    @Inject('CommonService') private commonService,
  ) {
    this.startSync();
  }

  public async startSync() {
    //this.blockSync(52677592);
    var data = await Variable.findOne({ key: 'currentBlockNo' });
    var dbBlockNo = Number(data.value) + 1;

    var caveBlockNo = await this.nodeService.getBlockNumber();
    if (process.env.LATEST_SYNC) dbBlockNo = caveBlockNo;

    for (let currBlockNo = dbBlockNo; currBlockNo <= caveBlockNo; currBlockNo++) {
      if (caveBlockNo <= currBlockNo) {
        currBlockNo -= 1;
        await new Promise((r) => setTimeout(r, 1000));
        caveBlockNo = await this.nodeService.getBlockNumber();
        continue;
      }

      if (!(await this.blockSync(currBlockNo))) {
        await new Promise((r) => setTimeout(r, 3000));
        currBlockNo--;
      }
    }
  }

  public async blockSync(blockNo) {
    return this.nodeService
      .getBlockWithConsensusInfo(blockNo)
      .then(async (currBlock) => {
        await this.nodeService.setFeeInfo(blockNo);

        const blockDate = new Date(this.nodeService.getHexToNumberString(currBlock.timestamp) * 1000);
        this.functionQueue.set(String(blockNo), []);

        //300 블록 마다 ownerCnt 동기화 && Kas계정 남은 KLAY 확인
        if (blockNo % 300 == 0) {
          await this.bulkService.rankSyncInBulk(this.bulkService, blockNo);
          const klay = await this.nodeService.getKlayBalance(this.contractAddress['KasAccount']);
          const leftKlay = this.commonService.toMaxUnit(klay, 18);

          if (leftKlay < 5) this.logger.error('kas account klay not enough | left klay = ' + leftKlay);
        }

        await this.bulkService.addData(blockNo, {
          tableName: 'block',
          data: {
            blockNumber: blockNo,
            version: Container.get('migrationVersion'),
          },
          queryType: 'upsert',
          conflict_target: ['blockNumber'],
          overwrite: ['version'],
        });
        await this.txDataSync(blockNo, currBlock.transactions, blockDate);

        await this.bulkService.addData(blockNo, {
          tableName: 'variable',
          data: {
            value: blockNo,
          },
          where: {
            key: 'currentBlockNo',
          },
          queryType: 'update',
        });

        //생성된 insert update 처리
        await this.bulkService.executeBulk(blockNo);

        await this.blockEndCallback(blockNo);

        return true;
      })
      .catch(async (e) => {
        if (e.errno === 1213) {
          this.logger.error('sync ' + blockNo + 'block error' + e);
        } else {
          this.logger.error('sync ' + blockNo + 'block error' + e);
        }

        return false;
      });
  }

  public async txDataSync(blockNo, transactions, blockDate) {
    for (const transaction of transactions) {
      if (this.abiService.checkTradeContract(transaction.to)) {
        await this.bulkService.addData(blockNo, {
          tableName: 'solex_tx',
          data: {
            status: transaction.status == '0x1' ? true : false,
          },
          where: {
            txHash: transaction.transactionHash,
          },
          queryType: 'update',
        });

        this.addCallback(blockNo, () => {
          this.socketService.resultTx(transaction.transactionHash, transaction.status == '0x1' ? true : false);
        });
      }

      await this.eventDataSync(
        blockNo,
        this.nodeService.getHexToNumberString(transaction.transactionIndex),
        transaction.logs,
        blockDate,
      );
    } // END PROCESSING BLOCK TRANSACTIONS

    return;
  }

  public async eventDataSync(blockNumber, txIndex, events, blockDate) {
    for (const log of events) {
      await this.eventService.handler(
        blockNumber,
        txIndex,
        this.nodeService.getHexToNumberString(log.logIndex),
        log,
        blockDate,
        this.functionQueue,
      );
    }

    return;
  }

  public async blockEndCallback(blockNo) {
    var key = String(blockNo);

    if (this.functionQueue.size > 0 && this.functionQueue.has(key)) {
      var functionArr = this.functionQueue.get(key);
      this.functionQueue.delete(key);
      for (let i = 0; i < functionArr.length; i++) {
        await functionArr[i]();
      }
    }

    this.functionQueue.delete(key);
  }

  public addCallback(id, func) {
    var strKey = String(id); //키 타입 string으로 고정
    let bulkArr = this.functionQueue.get(strKey);
    bulkArr.push(func);
    if (bulkArr.length > 0) this.functionQueue.set(strKey, bulkArr);
  }
}

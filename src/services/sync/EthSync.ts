import { Container, Service, Inject } from 'typedi';
import { BulkService } from '../BulkService';
import { EthVaultService } from './event/EthVaultService';
import { NodeService } from '../NodeService';
import { AbiService } from '../AbiService';

import { Variable } from '../../entities/Variable'

@Service('EthSync')
export class EthSync{

  blockNoVariable:Variable;
  functionQueue: Map<string,Array<any>> = new Map();
  
  constructor(
    @Inject('NodeService') private nodeService:NodeService,
    @Inject('BulkService') private bulkService:BulkService,
    @Inject('constant') private constant,
    @Inject('EthVaultService') private vaultService:EthVaultService,
    @Inject('logger') private logger,
    @Inject('contractAddress') private contractAddress
  ) {
    this.startSync();
  }

  public async startSync(){
    var data = await Variable.findOne({key:"currentEthBlockNo"});
    var dbBlockNo = Number(data.value)+1;
    
    var nodeBlockNo = await this.nodeService.getBlockNumber('eth');
    
    if(process.env.LATEST_SYNC) dbBlockNo = nodeBlockNo;

    for(let currBlockNo=dbBlockNo;currBlockNo<=nodeBlockNo;currBlockNo++){
      if (nodeBlockNo <= currBlockNo) {
        currBlockNo -= 1
        await new Promise((r) => setTimeout(r, 1000))
        nodeBlockNo = await this.nodeService.getBlockNumber('eth')
        continue;
      }
     
      if(!await this.blockSync(currBlockNo)){
        await new Promise((r) => setTimeout(r, 3000))
        currBlockNo--;
      } 
      
    }
  }

  public async blockSync(blockNo){

    return this.nodeService.getBlockWithConsensusInfo(blockNo,'eth').then(async (currBlock)=>{

      const blockDate = new Date(this.nodeService.getHexToNumberString(currBlock.timestamp) * 1000)

      this.functionQueue.set(String(blockNo),[])

      await this.txDataSync(blockNo,currBlock.transactions,blockDate);

      await this.bulkService.addData(blockNo,{
        tableName:"variable",
        data:{
          value:blockNo
        },
        where:{
          key:"currentEthBlockNo"
        },
        queryType:"update"
      });

      await this.bulkService.executeBulk(blockNo);

      await this.blockEndCallback(blockNo);

      return true;
    }).catch(async (e)=>{
 
      this.logger.error('eth sync '+blockNo+'block error'+e)

      return false;
    });
  }

  public async txDataSync(blockNo,transactions,blockDate){
    for (const transaction of transactions) {
      //eth vault
      if(transaction.to && transaction.to.toLowerCase()==this.contractAddress['EthVaultContract']){
        await this.eventDataSync(
          blockNo,
          this.nodeService.getHexToNumberString(transaction.transactionIndex),
          transaction.hash,
          blockDate
        )
      }
    }

    return;
  }

  public async eventDataSync(blockNumber,txIndex,hash,blockDate){

    const receipt = await this.nodeService.getTransactionReceipt(hash);
    
    //this.addCallback(blockNo,()=>{this.socketService.resultTx(receipt.transactionHash,(receipt.status)?true:false)});
    for (const log of receipt.logs) {
      const topicHash = !!log.topics && !!log.topics[0] ? log.topics[0].toLowerCase() : null
      await this.vaultService.handler(blockNumber,topicHash,log,blockDate,this.functionQueue)
    }

    return;
  }

  public async blockEndCallback(blockNo){

    var key = String(blockNo);
    if(this.functionQueue.size>0 && this.functionQueue.has(key)){
      var functionArr = this.functionQueue.get(key);
      this.functionQueue.delete(key);
      for(let i=0; i<functionArr.length; i++){
        await functionArr[i]()   
      }
    }

    this.functionQueue.delete(key);
  }

  public addCallback(id,func){
    var strKey = String(id);  //키 타입 string으로 고정
    let bulkArr = this.functionQueue.get(strKey);
    bulkArr.push(func);
    if(bulkArr.length > 0) this.functionQueue.set(strKey,bulkArr);
  }
}
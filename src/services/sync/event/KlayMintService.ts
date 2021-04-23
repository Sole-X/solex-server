
import { Service, Inject } from 'typedi';
import { Activity } from '../../../entities/Activity';
import { BridgeTx } from '../../../entities/BridgeTx';

@Service("KlayMintService")
export class KlayMintService {
  eventMap;

  constructor (
    @Inject('logger') private logger,
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("currency") private currency,
    @Inject("SocketService") private socketService,
    @Inject("contractAddress") private contractAddress,
    
  ) {
    this.eventMap = this.abiService.getEventMap('klayminter-abi')
  }

  public async handler(blockNo,topicHash,log,blockDate,callbackQueue){
    const eventInfo = this.eventMap.get(topicHash) || '';
    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['Swap','SwapNFT','SwapRequest','SwapRequestNFT']

    if(!acceptEvent.includes(eventInfo.name)) return;

    const data = (decodeParams.data)? await this.abiService.getDecodeParameters([{
      "name": "accountAddress",
      "type": "address"
    },
    {
      "name": "hash",
      "type": "bytes32"
    }], decodeParams.data) : ['',''];

    switch(eventInfo.name){
      case "Swap":
        return await this.swap(blockNo,decodeParams,log.transactionHash,blockDate,data,callbackQueue);
      break;
      case "SwapNFT":
        return await this.swapNFT(blockNo,decodeParams,log.transactionHash,blockDate,data,callbackQueue);
      break;
      case "SwapRequest":
        return await this.swapRequest(blockNo,decodeParams,log.transactionHash,blockDate,data,callbackQueue);
      break;
      case "SwapRequestNFT":
        return await this.swapRequestNFT(blockNo,decodeParams,log.transactionHash,blockDate,data,callbackQueue);
      break;

    }
  }

  //event Swap(string fromChain, bytes fromAddr, bytes toAddr, address tokenAddress, bytes32[] bytes32s, uint[] uints, bytes data);
  //eth sync가 고장나서 activity가 없을경우는 activity insert 정상시 update
  async swap(blockNo,params,txHash,blockDate,data,callbackQueue){
    const toOther = (params.fromAddr != data[0])? true:false;
    const activity = await Activity.findOne({tradeId:data[1],accountAddress:params.fromAddr});

    if(toOther){
      const otherActivity = await Activity.findOne({tradeId:data[1],accountAddress:data[0]});

      if(otherActivity){
        await this.bulkService.addData(blockNo,{
          tableName:"activity",
          data:{
            txHash:txHash,
            bridgeId:params.uints[2],
            status:this.constant.STATUS.TOKEN.DEPOSIT,
            updatedAt:blockDate
          },
          where:{
            tradeId:data[1],
            accountAddress:data[0],
            bridgeId:params.uints[2]
          },
          queryType:"update"
        });
      }else{
        await this.bulkService.addData(blockNo,{
          tableName:"activity",
          data:{
            eventType:this.constant.TYPE.EVENT.TOKEN,
            status:this.constant.STATUS.TOKEN.DEPOSIT,
            tokenAddress: params.tokenAddress,
            tradeId:data[1],
            txHash:txHash,
            amount:params.uints[0],
            accountAddress: data[0],
            bridgeId:params.uints[2],
            createdAt:blockDate,
            updatedAt:blockDate
          },
          queryType:"insert",
        });
      }
    }

    if(activity){
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          txHash:txHash,
          status:this.constant.STATUS.TOKEN.DEPOSIT,
          updatedAt:blockDate
        },
        where:{
          tradeId:data[1],
          accountAddress:params.fromAddr,
          bridgeId:params.uints[2]          
        },
        queryType:"update"
      });
    }else{
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.TOKEN,
          status:this.constant.STATUS.TOKEN.DEPOSIT,
          tokenAddress: params.tokenAddress,
          tradeId:data[1],
          txHash:txHash,
          amount:params.uints[0],
          accountAddress: params.fromAddr,
          bridgeId:params.uints[2],
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert",
      });
    }

    await this.bulkService.addData(blockNo,{
      tableName:"bridge_tx",
      data:{
        platform:params.fromChain,
        hashId:data[1],
        tokenAddress:params.tokenAddress,
        amount:params.uints[0],
        depositId:params.uints[2],        
        blockNumber:blockNo,
        txHash:txHash,
        fromAddress:params.fromAddr,
        toAddress:data[0],
        type:this.constant.STATUS.TOKEN.MINT,
        status:1,
        createdAt:blockDate
      },
      queryType:"insert",
    });
    this.addCallback(blockNo,()=>{this.socketService.bridge(data[1],params.uints[2],txHash,'mint')},callbackQueue);
    return;
  }
  
  //event SwapNFT(string fromChain, bytes fromAddr, bytes toAddr, address tokenAddress, bytes32[] bytes32s, uint[] uints, bytes data);
  async swapNFT(blockNo,params,txHash,blockDate,data,callbackQueue){

    const toOther = (params.fromAddr != data[0])? true:false;
    const activity = await Activity.findOne({tradeId:data[1],accountAddress:params.fromAddr,bridgeId:params.uints[2]});

    if(toOther){
      const otherActivity = await Activity.findOne({tradeId:data[1],accountAddress:data[0]});

      if(otherActivity){
        await this.bulkService.addData(blockNo,{
          tableName:"activity",
          data:{
            txHash:txHash,
            bridgeId:params.uints[2],
            status:this.constant.STATUS.NFT.DEPOSIT,
            updatedAt:blockDate
          },
          where:{
            tradeId:data[1],
            accountAddress:data[0],
            bridgeId:params.uints[2]
          },
          queryType:"update"
        });
      }else{
        await this.bulkService.addData(blockNo,{
          tableName:"activity",
          data:{
            eventType:this.constant.TYPE.EVENT.NFT,
            status:this.constant.STATUS.NFT.DEPOSIT,
            tokenAddress: params.tokenAddress,
            tradeId:data[1],
            txHash:txHash,
            tokenId:params.uints[1],
            accountAddress: data[0],
            bridgeId:params.uints[2],
            createdAt:blockDate,
            updatedAt:blockDate
          },
          queryType:"insert",
        });
      }
    }

    if(activity){
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          txHash:txHash,
          status:this.constant.STATUS.NFT.DEPOSIT,
          updatedAt:blockDate
        },
        where:{
          tradeId:data[1],
          accountAddress:params.fromAddr,
          bridgeId:params.uints[2]          
        },
        queryType:"update"
      });
    }else{
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.NFT,
          status:this.constant.STATUS.NFT.DEPOSIT,
          tokenAddress: params.tokenAddress,
          tradeId:data[1],
          txHash:txHash,
          tokenId:params.tokenId,
          toAddress:data[0],
          accountAddress: params.fromAddr,
          bridgeId:params.depositId,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert",
      });
    }

    await this.bulkService.addData(blockNo,{
      tableName:"bridge_tx",
      data:{
        platform:params.fromChain,
        hashId:data[1],
        tokenAddress:params.tokenAddress,
        tokenId:params.uints[1],
        depositId:params.uints[2],        
        blockNumber:blockNo,
        txHash:txHash,
        fromAddress:params.fromAddr,
        toAddress:data[0],
        type:this.constant.STATUS.TOKEN.MINT,
        status:1,
        createdAt:blockDate
      },
      queryType:"insert",
    });
    this.addCallback(blockNo,()=>{this.socketService.bridge(data[1],params.uints[2],txHash,'mint')},callbackQueue);

    return;
  }
  //event SwapRequest(string toChain, address fromAddr, bytes toAddr, bytes token, address tokenAddress, uint8 decimal, uint amount, uint depositId, bytes data);
  async swapRequest(blockNo,params,txHash,blockDate,data,callbackQueue){
    console.log('swap requset', params,data)
    if(params.toAddr.toLowerCase()==this.contractAddress['OrbitFeeAddress']) return;

    const activity = await Activity.findOne({tradeId:data[1],accountAddress:data[0]});

    //activity 데이터가 없을때만
    if(!activity){
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.TOKEN,
          status:this.constant.STATUS.TOKEN.BURN,
          tokenAddress: params.tokenAddress,
          tradeId:data[1],
          txHash:txHash,
          amount:params.amount,
          accountAddress: data[0],
          fromAddress: data[0],
          toAddress: params.toAddr,
          bridgeId:params.depositId,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert",
      });
    }

    await this.bulkService.addData(blockNo,{
      tableName:"bridge_tx",
      data:{
        platform:params.toChain,
        hashId:data[1],
        tokenAddress:params.tokenAddress,
        depositId:params.depositId,
        amount:params.amount,
        blockNumber:blockNo,
        txHash:txHash,
        fromAddress:data[0],
        toAddress:params.toAddr,
        type:this.constant.STATUS.TOKEN.BURN,
        status:1,
        createdAt:blockDate
      },
      queryType:"insert",
    });

    this.addCallback(blockNo,()=>{this.socketService.bridge(data[1],params.depositId,txHash,'burn')},callbackQueue);

    return;
  }  
  //event SwapRequestNFT(string toChain, address fromAddr, bytes toAddr, bytes token, address tokenAddress, uint tokenId, uint amount, uint depositId, bytes data);
  async swapRequestNFT(blockNo,params,txHash,blockDate,data,callbackQueue){
    console.log('swap requset nft', params,data)
    if(params.toAddr.toLowerCase()==this.contractAddress['OrbitFeeAddress']) return;

    const activity = await Activity.findOne({tradeId:data[1],bridgeId:params.depositId});

    //activity 데이터가 없을때만
    if(!activity){
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.NFT,
          status:this.constant.STATUS.NFT.BURN,
          tokenAddress: params.tokenAddress,
          tradeId:data[1],
          txHash:txHash,
          tokenId:params.tokenId,
          accountAddress: data[0],
          fromAddress: data[0],
          toAddress: params.toAddr,
          bridgeId:params.depositId,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert",
      });
    }

    await this.bulkService.addData(blockNo,{
      tableName:"bridge_tx",
      data:{
        platform:params.toChain,
        hashId:data[1],
        tokenAddress:params.tokenAddress,
        depositId:params.depositId,
        tokenId:params.tokenId,
        blockNumber:blockNo,
        txHash:txHash,
        fromAddress:data[0],
        toAddress:params.toAddr,
        type:this.constant.STATUS.NFT.BURN,
        status:1,
        createdAt:blockDate
      },
      queryType:"insert",
    });
    this.addCallback(blockNo,()=>{this.socketService.bridge(data[1],params.depositId,txHash,'burn')},callbackQueue);
    return;
  }  

  public addCallback(id,func,queue:any){
    var strKey = String(id);  //키 타입 string으로 고정
    let bulkArr = queue.get(strKey);
    bulkArr.push(func);
    queue.set(strKey,bulkArr);
  }

}

import { Service, Inject } from 'typedi';
import { Sale } from '../../../entities/Sale';

@Service("ReserveService")
export class ReserveService {
  eventMap;
  type="reserve";

  constructor (
    @Inject('logger') private logger,
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("CommonService") private commonService,
    @Inject("NodeService") private nodeService,
    @Inject("contractAddress") private contractAddress
  ) {
    this.eventMap = this.abiService.getEventMap('reserve-abi')
  }

  public async handler(blockNo,topicHash,log,blockDate,callbackQueue){
    const eventInfo = this.eventMap.get(topicHash) || '';

    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['DepositNft','WithdrawNft','BridgeDepositNft','BridgeWithdrawNft','DepositToken',
    'WithdrawToken','BridgeDepositToken','BridgeWithdrawToken','TransferToken','TransferNft','WhiteListSet']
    if(!acceptEvent.includes(eventInfo.name)) return;

    switch(eventInfo['name']){
      case "DepositNft":
        await this.depositNft(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "WithdrawNft":
        await this.withdrawNft(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "BridgeDepositNft":
        await this.bridgeDepositNft(blockNo,log.transactionHash,decodeParams,blockDate)
      break;      
      case "BridgeWithdrawNft":
        await this.bridgeWithdrawNft(blockNo,log.transactionHash,decodeParams,blockDate)
      break;            
      case "DepositToken":
        await this.depositToken(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "WithdrawToken":
        await this.withdrawToken(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "BridgeDepositToken":
        await this.bridgeDepositToken(blockNo,log.transactionHash,decodeParams,blockDate)
      break;      
      case "BridgeWithdrawToken":
        await this.bridgeWithdrawToken(blockNo,log.transactionHash,decodeParams,blockDate)
      break;         
      case "TransferToken":
        await this.transferToken(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "TransferNft":
        await this.transferNft(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
      case "WhiteListSet":
        await this.whiteListSet(blockNo,log.transactionHash,decodeParams,blockDate)
      break;
    }
  }

  //event BridgeDepositNft(bytes32 hash, address tokenAddr, uint tokenId, address fromAddr);
  async bridgeDepositNft(blockNo,txHash,params,blockDate){
    await this.depositNft(blockNo,txHash,params,blockDate)
  }
  //nft 입금
  //event DepositNft(address tokenAddr, uint tokenId, address fromAddr);
  async depositNft(blockNo,txHash,params,blockDate){
  
    await this.bulkService.addData(blockNo,{
      tableName:"nft_queue",
      data:{
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId
      },
      queryType:"insert",
    });

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.NFT,
        status:this.constant.STATUS.NFT.DEPOSIT,
        tokenUri:'',
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId,
        accountAddress:params.fromAddr,
        createdAt:blockDate
      },
      queryType:"insert"
    });
  

    await this.bulkService.rankInBulk(this.bulkService, blockNo, params.tokenAddr, 0,['nftCntPlus'])

    await this.bulkService.addData(blockNo,{
      tableName:"account",
      data:{
        accountAddress:params.fromAddr,
        username:"user_"+params.fromAddr.replace("0x","").slice(0,6),
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"upsert",
      conflict_target:['accountAddress'],
      overwrite:['updatedAt']
    })

    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId,
        ownerAddress:params.fromAddr,
        platform:this.constant.CHAIN.ETH,
        price:0,
        status:this.constant.STATUS.NFT.DEPOSIT,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"upsert",
      conflict_target:['tokenAddress','tokenId'],
      overwrite:['updatedAt','ownerAddress','status']
    });

  }

  //event BridgeDepositToken(bytes32 hash, address tokenAddr, uint amount, address fromAddr, uint totalAmount);
  async bridgeDepositToken(blockNo,txHash,params,blockDate){
    await this.depositToken(blockNo,txHash,params,blockDate,params.hash)
  }

  //event DepositToken(address tokenAddr, uint amount, address fromAddr, uint totalAmount);
  async depositToken(blockNo,txHash,params,blockDate,bridge=""){
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, params.amount);

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.DEPOSIT,
        tradeId:bridge,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        amount:params.amount,
        usdPrice:usdPrice,
        accountAddress:params.fromAddr,
        toAddress:params.fromAddr,
        createdAt:blockDate
      },
      queryType:"insert"
    });
    
    await this.bulkService.addData(blockNo,{
      tableName:"account",
      data:{
        accountAddress:params.fromAddr,
        username:"user_"+params.fromAddr.replace("0x","").slice(0,6),
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"upsert",
      conflict_target:['accountAddress'],
      overwrite:['updatedAt']
    })

    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        accountAddress:params.fromAddr,
        amount:params.totalAmount,
        tokenAddress:params.tokenAddr
      },
      queryType:"upsert",
      conflict_target:['accountAddress','tokenAddress'],
      overwrite:['amount','updatedAt']
    })
  }

  //event BridgeWithdrawNft(bytes32 hash, address tokenAddr, uint tokenId, address userAddr, address toAddr, string toChain);
  async bridgeWithdrawNft(blockNo,txHash,params,blockDate){
    await this.bulkService.rankInBulk(this.bulkService, blockNo, params.tokenAddr, 0,['nftCntMinus'])
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.NFT,
        status:this.constant.STATUS.NFT.WITHDRAW,
        txHash:txHash,
        updatedAt:blockDate,
        fromAddress:params.userAddr,
        toAddress:params.toAddr,
        accountAddress:params.userAddr,
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId,          
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        status:this.constant.STATUS.NFT.WITHDRAW,
        ownerAddress:"",
        updatedAt:blockDate
      },
      where:{
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId
      },
      queryType:"update"
    });
  }

  //event WithdrawNft(bytes32 hash, address tokenAddr, uint tokenId, address toAddr, address fromAddr);
  async withdrawNft(blockNo,txHash,params,blockDate,bridge=""){
    await this.bulkService.rankInBulk(this.bulkService, blockNo, params.tokenAddr, 0,['nftCntMinus'])
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.NFT,
        status:this.constant.STATUS.NFT.WITHDRAW,
        txHash:txHash,
        updatedAt:blockDate,
        fromAddress:params.fromAddr,
        toAddress:params.toAddr,
        accountAddress:params.fromAddr,
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId,          
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        status:this.constant.STATUS.NFT.WITHDRAW,
        ownerAddress:"",
        updatedAt:blockDate
      },
      where:{
        tokenAddress:params.tokenAddr,
        tokenId:params.tokenId
      },
      queryType:"update"
    });

  }

  //event BridgeWithdrawToken(bytes32 hash, address tokenAddr, uint amount, address userAddr, address toAddr, uint leftAmount, string toChain);
  async bridgeWithdrawToken(blockNo,txHash,params,blockDate){

    const amount = BigInt(params.amount);
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, amount);
  
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.WITHDRAW,
        tradeId:params.hash,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        toAddress:params.toAddr,
        amount:amount,
        usdPrice:usdPrice,
        accountAddress:params.userAddr,
        createdAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        amount:params.leftAmount,
        updatedAt:blockDate
      },
      where:{tokenAddress:params.tokenAddr,accountAddress:params.userAddr},
      queryType:"update"
    });

  }
  //event event WithdrawToken(bytes32 hash, address tokenAddr, uint amount, address toAddr, uint leftAmount, address fromAddr);
  async withdrawToken(blockNo,txHash,params,blockDate,bridge=""){

    const amount = BigInt(params.amount);
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, amount);
  
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.WITHDRAW,
        tradeId:bridge,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        toAddress:params.toAddr,
        amount:amount,
        usdPrice:usdPrice,
        accountAddress:params.fromAddr,
        createdAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        amount:params.leftAmount,
        updatedAt:blockDate
      },
      where:{tokenAddress:params.tokenAddr,accountAddress:params.fromAddr},
      queryType:"update"
    });
  }

  //event TransferToken(uint transferType, address tokenAddr, uint amount, address fromAddr, address toAddr, uint fromAmount, uint toAmount, bytes32 id);
  async transferToken(blockNo,txHash,params,blockDate){
    const transAmount = this.commonService.toBN(params.amount).toString();
    var tradeType = "";

    //1=lock 2=release
    //release 되는 경우 
    if(params.transferType==2){

      tradeType = this.abiService.getTradeType(params.fromAddr);

      var update = { 
        accountAddress:params.toAddr,
        tokenAddress:params.tokenAddr,
        amount:params.toAmount, 
        updatedAt:blockDate 
      };

      if(tradeType == 'AUCTION'){
        update['lockAuctionAmount'] = ()=>"lockAuctionAmount -"+transAmount;
      }else if(tradeType == 'SELL'){
        update['lockSellAmount'] = ()=>"lockSellAmount -"+transAmount;
      }else if(tradeType == 'STAKE'){
        update['lockStakeAmount'] = ()=>"lockStakeAmount -"+transAmount;
      }
  
      //스테이킹에서 가져가지 않은 거래 수수료 업데이트
      if(this.contractAddress['FeeReceiver']==params.toAddr.toLowerCase()){
        await this.bulkService.addData(blockNo,{
          tableName:"token_info",
          data:{ feeReceiver:params.toAmount },
          where:{ tokenAddress:params.tokenAddr },
          queryType:"update"
        });
      }
      
      await this.bulkService.addData(blockNo,{
        tableName:"token_balance",
        data:update,
        conflict_target:['accountAddress','tokenAddress'],
        overwrite:['updatedAt','lockAuctionAmount','lockSellAmount','lockStakeAmount','amount'],
        queryType:"upsert",
      });

    //lock 되는 경우
    }else if(params.transferType==1){

      tradeType = this.abiService.getTradeType(params.toAddr);
      var update2 = {
        accountAddress:params.fromAddr,
        tokenAddress:params.tokenAddr,
        amount:params.fromAmount,
        updatedAt:blockDate
      };

      if(tradeType == 'AUCTION'){
        update2['lockAuctionAmount'] = ()=>"lockAuctionAmount +"+transAmount;
      }else if(tradeType == 'SELL'){
        update2['lockSellAmount'] = ()=>"lockSellAmount +"+transAmount;
      }else if(tradeType == 'BUY'){
        update2['lockBuyAmount'] = ()=>"lockBuyAmount +"+transAmount;
      }else if(tradeType == 'STAKE'){
        update2['lockStakeAmount'] = ()=>"lockStakeAmount +"+transAmount;
      }

      await this.bulkService.addData(blockNo,{
        tableName:"token_balance",
        data:update2,
        conflict_target:['accountAddress','tokenAddress'],
        overwrite:['updatedAt','lockAuctionAmount','lockSellAmount','lockBuyAmount','lockStakeAmount','amount'],
        queryType:"upsert",
      });

    ///staking에서 fee 가져가는 경우
    }else if(
      params.transferType==0 && 
      this.contractAddress['FeeReceiver']==params.fromAddr.toLowerCase() && 
      this.contractAddress['StakeContract']==params.toAddr.toLowerCase() 
      ){
        //남은 수수료 업데이트
        await this.bulkService.addData(blockNo,{
          tableName:"token_info",
          data:{ feeReceiver:params.fromAmount },
          where:{ tokenAddress:params.tokenAddr },
          queryType:"update"
        });
    }

  }

  //event TransferNft(uint transferType, address tokenAddr, uint tokenId, address fromAddr, address toAddr, bytes32 id);
  async transferNft(blockNo,txHash,params,blockDate){
    
    var TradeType = "";
    var fromAddress = ""; //거래완료시에만 존재

    //release 되는 경우 
    if(params.transferType==2){
      TradeType = this.abiService.getTradeType(params.fromAddr);
      if(params.id != ""){
        if(TradeType == 'AUCTION'){
          const auctionInfo = await Sale.findOne({where:{id:params.id},select:['ownerAddress']});
          fromAddress = auctionInfo.ownerAddress;
        }else if(TradeType == 'SELL'){
          fromAddress = (await Sale.findOne({where:{id:params.id},select:['ownerAddress']})).ownerAddress;
        }else if(TradeType == 'BUY'){
          fromAddress = params.fromAddr;
        }
      }

      //취소 경우 자기 자신에게 전송하는 격이므로 activity 포함 X
      if(fromAddress != params.toAddr){
        await this.bulkService.addData(blockNo,{
          tableName:"activity",
          data:{
            eventType:this.constant.TYPE.EVENT.NFT,
            status:this.constant.STATUS.NFT.DEPOSIT,
            txHash:txHash,
            tokenAddress:params.tokenAddr,
            tradeId:params.id,
            tokenId:params.tokenId,
            accountAddress:params.toAddr,
            fromAddress:fromAddress,
            toAddress:params.toAddr,
            createdAt:blockDate
          },
          queryType:"insert"
        });
      }

      await this.bulkService.addData(blockNo,{
        tableName:"nft_item",
        data:{
          status:this.constant.STATUS.NFT.DEPOSIT,
          updatedAt:blockDate,
          ownerAddress:params.toAddr,
          tradeId:params.id
        },
        where:{
          tokenAddress:params.tokenAddr,
          tokenId:params.tokenId
        },
        queryType:"update"
      });
    //lock 되는 경우
    }else if(params.transferType==1){
      
      TradeType = this.abiService.getTradeType(params.toAddr);
      var status = 0;

      switch(TradeType){
        case "AUCTION":
          status = this.constant.STATUS.NFT.AUCTION;
        break;
        case "SELL":
          status = this.constant.STATUS.NFT.SELL;
        break;
        case "BUY":
          status = this.constant.STATUS.NFT.BUY;
        break;
      }

      await this.bulkService.addData(blockNo,{
        tableName:"nft_item",
        data:{
          status:status,
          updatedAt:blockDate,
          tradeId:params.id
        },
        where:{
          tokenAddress:params.tokenAddr,
          tokenId:params.tokenId
        },
        queryType:"update"
      });
    }

  }

  //event WhiteListSet(address tokenAddr, bool value, bool isNft);
  async whiteListSet(blockNo,txHash,decodeParams,blockDate){

    //value = false → 화이트리스트에서 제외
    //value = true → 화이트리스트 추가
    var tokenAddr = decodeParams[0]; 
    var value = decodeParams[1];
    var isNft = decodeParams[2];
    var tableName = (isNft)? 'nft_info':'token_info';
    var overwrite = ['name','symbol','updatedAt','status'];
    const [name,symbol,decimal] = await this.nodeService.getTokenInfo(tokenAddr,isNft);
    
    var data = {}

    if(!isNft){
      overwrite.push('decimals')
      data['decimals'] = decimal; 
    } 

    data['tokenAddress'] = tokenAddr;
    data['updatedAt'] = blockDate;
    data['name'] = name;
    data['symbol'] = symbol;

    if(value){
      data['status'] = 1;
      await this.bulkService.addData(blockNo,{
        tableName:tableName,
        data:data,
        conflict_target:['tokenAddress'],
        overwrite:overwrite,
        queryType:"upsert"
      });
    }else{
      data['status'] = 2;
      await this.bulkService.addData(blockNo,{
        tableName:tableName,
        data:data,
        conflict_target:['tokenAddress'],
        overwrite:overwrite,
        queryType:"upsert"
      });
    }
  }

  getEventDesc(functionName){
    var type = "";
    var action = "";

    if(functionName.indexOf('Nft') >-1){
      type = "nft";
    }else if(functionName.indexOf('Token') >-1){
      type = "token";
    }

    if(functionName.indexOf('Deposit') >-1){
      action = 'deposit';
    }else if(functionName.indexOf('Withdraw') >-1){
      action = 'withdraw';
    }else if(functionName.indexOf('Transfer') >-1){
      action = 'transfer';
    }

    return [type, action];
  }

}

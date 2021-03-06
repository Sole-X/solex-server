import { Service, Inject } from 'typedi';
import { Sale } from '../../../entities/Sale';
import { NftItemDesc } from '../../../entities/NftItemDesc';
import { Activity } from '../../../entities/Activity';

import {LessThan} from "typeorm";

@Service("AuctionService")
export class AuctionService {
  eventMap;

  constructor (
    @Inject('logger') private logger,
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("currency") private currency,
    @Inject("NodeService") private nodeService,
    @Inject("CommonService") private commonService,
  

  ) {
    this.eventMap = this.abiService.getEventMap('auction-abi')
  }

  public async handler(blockNo,eventIndex,topicHash,log,blockDate,callbackQueue){

    const eventInfo = this.eventMap.get(topicHash) || '';
    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['AuctionAdded','AuctionCompleted','AuctionCanceled','AuctionExpired','AuctionEdited','AuctionClosed','BiddingUpdated']
    if(!acceptEvent.includes(eventInfo.name)) return;
    
    switch(eventInfo.name){
      case "AuctionAdded":
        return await this.auctionAdded(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "AuctionCompleted":
        return await this.auctionCompleted(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "AuctionCanceled":
        return await this.auctionCanceled(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "AuctionExpired":
        return await this.auctionExpired(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "AuctionEdited":
        return await this.auctionEdited(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "BiddingUpdated":
        return await this.biddingUpdated(blockNo,decodeParams,log.transactionHash,blockDate)
      break;
    }
  }


  //event AuctionAdded(bytes32 auctionId, address auctionOwner, address nftAddr, uint tokenId, address biddingToken, uint minAmount, uint maxAmount, uint endTime, bool isInstantTrade);
  async auctionAdded(blockNo,params,txHash,blockDate){
    
    var endTime = new Date(params.endTime*1000);

    var type = (params.isInstantTrade)?this.constant.TYPE.SALE.INSTANT_AUCTION:this.constant.TYPE.SALE.NORMAL_AUCTION;
    const nftDesc = await NftItemDesc.findOne({select:['name'],where:{tokenAddress:params.nftAddr,tokenId:params.tokenId}})
    var tokenName = (nftDesc && 'name' in nftDesc)? nftDesc.name:"";
    const usdPrice = await this.commonService.convertUsdPrice(params.biddingToken, params.minAmount);
 
    //????????? ?????? ???????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.AUCTION,
        status:this.constant.STATUS.AUCTION.START,
        txHash:txHash,
        tradeId:params.auctionId,
        currency:params.biddingToken,
        amount:params.minAmount,
        tokenAddress:params.nftAddr,
        tokenId:params.tokenId,
        accountAddress:params.auctionOwner,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    //?????? ????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        id:params.auctionId,
        tokenAddress:params.nftAddr,
        tokenId:params.tokenId,
        tokenName:tokenName,
        currency:params.biddingToken,
        startTime:blockDate,
        endTime:endTime,
        basePrice:params.minAmount,
        usdPrice: usdPrice,
        currentPrice:params.minAmount,
        straightPrice:params.maxAmount,
        createTxHash:txHash,
        ownerAddress:params.auctionOwner,
        type:type,
        status:this.constant.STATUS.AUCTION.START,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    //????????? ????????? ????????? ?????? ????????? ???????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{endTime:endTime},
      where:{tokenAddress:params.nftAddr,tokenId:params.tokenId},
      queryType:"update"
    });

    return params.auctionId;
  }

  //event AuctionCompleted(hash, auctionId, nftReceiverAddr, tokenReceiverAddr, nftAddr, tokenId, tokenAddr, tokenAmount);
  async auctionCompleted(blockNo,params,txHash,blockDate){

    const auction = await Sale.findOne(params.auctionId);
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, params.tokenAmount);
    const paidAmount = await this.nodeService.getPaidAmount(params.tokenAmount); //????????? ????????????
 
    //????????? ?????? ???????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.AUCTION.DONE,   
        currency:params.tokenAddr,
        amount:paidAmount,
        usdPrice: usdPrice,
        toAddress:params.nftReceiverAddr,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{ 
        tradeId:params.auctionId,
        eventType:this.constant.TYPE.EVENT.AUCTION
      },
      queryType:"update"
    });

    //????????? ????????? ?????? ???????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.AUCTION.DONE,
        currency:params.tokenAddr,
        amount:paidAmount,
        usdPrice: usdPrice,
      },
      where:{ 
        tradeId:params.auctionId,
        eventType:this.constant.TYPE.EVENT.BID,
        status:this.constant.STATUS.BID.START
      },
      queryType:"update"
    });

    //?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        status:this.constant.STATUS.AUCTION.DONE,
        currentPrice: paidAmount,
        buyerAddress: params.nftReceiverAddr,
        usdPrice: usdPrice,
        lastTxHash:txHash,
        updatedAt:blockDate        
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });

    //?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"auction_bid",
      data:{
        status:this.constant.STATUS.BID.DONE,
        updatedAt:blockDate
      },
      where:{ id:params.auctionId,status:this.constant.STATUS.BID.START },
      queryType:"update"
    });

    //????????? ?????? ?????? ?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.DEPOSIT,
        tradeId:params.auctionId,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        currency:params.tokenAddr,
        amount:params.tokenAmount,
        usdPrice:usdPrice,
        accountAddress:params.tokenReceiverAddr,
        fromAddress:params.nftReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });
  
    //????????? ?????? ?????? ?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.WITHDRAW,
        tradeId:params.auctionId,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        currency:params.tokenAddr,
        amount:paidAmount,
        usdPrice:usdPrice,
        accountAddress:params.nftReceiverAddr,
        toAddress:params.tokenReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });  

    //?????? ????????? nft item ?????? ????????????
    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        currency:params.tokenAddr,
        price: paidAmount,
        usdPrice: usdPrice,
      },
      where:{ tokenAddress:auction.tokenAddress,tokenId:auction.tokenId },
      queryType:"update"
    });    

    //?????? ?????? release ??????
    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        lockAuctionAmount:()=>"lockAuctionAmount - " + paidAmount
      },
      where:{ accountAddress:params.nftReceiverAddr,tokenAddress:params.tokenAddr},
      queryType:"update"
    });

    //Ranking ????????? ????????????
    await this.bulkService.rankInBulk(this.bulkService, blockNo, auction.tokenAddress, usdPrice,['total','week','tradeCnt'])
  }

  //event AuctionCanceled(bytes32 hash, bytes32 auctionId, address auctionOwner);
  async auctionCanceled(blockNo,params,txHash,blockDate){
    
    //????????? ?????? ?????? ?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.AUCTION.CANCEL,
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{ 
        tradeId:params.auctionId,
        eventType:this.constant.TYPE.EVENT.AUCTION
      },
      queryType:"update"
    });

    //?????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        status:this.constant.STATUS.AUCTION.CANCEL,
        updatedAt:blockDate,
        lastTxHash:txHash
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"sale_expire",
      data:{
        status:this.constant.STATUS.SALE_QUEUE.SUCCESS,
        txHash:txHash
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });

    return params.auctionId;

  }

  //????????? ?????? ????????? ??????
  //event AuctionExpired(bytes32 hash, bytes32 auctionId, address auctionOwner);
  async auctionExpired(blockNo,params,txHash,blockDate){

    //????????? ?????? ?????? ?????? ????????????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.AUCTION.CANCEL,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{ 
        tradeId:params.auctionId
      },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        status:this.constant.STATUS.AUCTION.CANCEL,
        updatedAt:blockDate,
        lastTxHash:txHash
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"sale_expire",
      data:{
        status:this.constant.STATUS.SALE_QUEUE.SUCCESS,
        txHash:txHash
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });
  }

  //event AuctionEdited(bytes32 hash, bytes32 auctionId, address auctionOwner, address biddingToken, uint minAmount, uint maxAmount, uint endTime, bool isInstantTrade);
  async auctionEdited(blockNo,params,txHash,blockDate){

    var endTime = new Date(params.endTime*1000);
    var type = (params.isInstantTrade)?this.constant.TYPE.SALE.INSTANT_AUCTION:this.constant.TYPE.SALE.NORMAL_AUCTION;

    //????????? ?????? ???????????? txHash ????????????
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{ 
        tradeId:params.auctionId,
        accountAddress:params.auctionOwner
      },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        currency:params.biddingToken,
        currentPrice:params.minAmount,
        straightPrice:params.maxAmount,
        endTime:endTime,
        type:type,
        updatedAt:blockDate,
        lastTxHash:txHash
      },
      where:{ id:params.auctionId },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{currency:params.biddingToken,price:params.minAmount,endTime:endTime},
      where:{tradeId:params.auctionId},
      queryType:"update"
    });
  }

  //event BiddingUpdated(bytes32 hash, bytes32 auctionId, address tokenAddr, uint amount, address bidderAddr, uint biddingCount, uint endTime);
  async biddingUpdated(blockNo,params,txHash,blockDate){
    const endTime = new Date(params.endTime*1000);
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr,params.amount);
    const auction = await Sale.findOne({ id:params.auctionId });
    var status = this.constant.STATUS.BID.START;

    //???????????? ???????????? ???????????? ??????????????? ????????? ?????? ??????
    //??????????????? ?????? ???????????? ????????? ????????? ????????? ??? ?????????????????? ???????????? ?????? ?????? ????????? ???????????? ????????? ??????
    if(auction.type == this.constant.TYPE.SALE.INSTANT_AUCTION && Number(auction.straightPrice) <= Number(params.amount)){
      status = this.constant.STATUS.BID.DONE;

      //????????? ?????? ???????????? ??????
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.BUY,
          status:status,
          tradeId:params.auctionId,
          txHash:txHash,
          tokenAddress:auction.tokenAddress,
          tokenId:auction.tokenId,
          currency:params.tokenAddr,
          amount:params.amount,
          usdPrice:usdPrice,
          accountAddress: params.bidderAddr,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert"
      });
    }else{
      //????????? ?????? ???????????? ??????
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.BID,
          status:status,
          tradeId:params.auctionId,
          txHash:txHash,
          tokenAddress:auction.tokenAddress,
          tokenId:auction.tokenId,
          currency:params.tokenAddr,
          amount:params.amount,
          usdPrice:usdPrice,
          accountAddress: params.bidderAddr,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert"
      });
    }

    //???????????? ??????
    await this.bulkService.addData(blockNo,{
      tableName:"auction_bid",
      data:{
        id:params.hash,
        accountAddress:params.bidderAddr,
        auctionId:params.auctionId,
        bidIndex:params.biddingCount,
        bidPrice:params.amount,
        usdPrice:usdPrice,
        status:status,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });


    if(params.biddingCount>1){
      //?????? ?????? ???????????? ??????
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          status:this.constant.STATUS.BID.FAIL,
          txHash:txHash,
          updatedAt:blockDate
        },
        where:{
          eventType:this.constant.TYPE.EVENT.BID,
          status:this.constant.STATUS.BID.START,
          tradeId:params.auctionId,
          updatedAt:LessThan(blockDate)
        },
        queryType:"update"
      });

      //?????? ?????? ?????? ??????
      await this.bulkService.addData(blockNo,{
        tableName:"auction_bid",
        data:{
          status:this.constant.STATUS.BID.FAIL,
        },
        where:{
          auctionId:params.auctionId,
          bidIndex:(Number(params.biddingCount)-1)
        },
        queryType:"update"
      });
    }

    //???????????? ?????? ?????? ????????????
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        currentPrice:params.amount,
        lastTxHash:txHash,
        buyerAddress:params.bidderAddr,
        participant:()=>"participant+1",
        endTime:endTime
      },
      where:{
        id:params.auctionId
      },
      queryType:"update"
    });
    
    return params.auctionId;
  }

}

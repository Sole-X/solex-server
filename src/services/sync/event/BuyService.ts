
import { Service, Inject } from 'typedi';
import { Buy } from '../../../entities/Buy';
import { NftItemDesc } from '../../../entities/NftItemDesc';
import { NftItem } from '../../../entities/NftItem';

@Service("BuyService")
export class BuyService {
  eventMap;

  constructor (
    @Inject('logger') private logger,
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("currency") private currency,
    @Inject("NodeService") private nodeService,
    @Inject("CommonService") private commonService
  ) {
    this.eventMap = this.abiService.getEventMap('buy-abi')
  }

  public async handler(blockNo,topicHash,log,blockDate){

    const eventInfo = this.eventMap.get(topicHash) || '';
    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['BuyOfferAdded','BuyOfferCompleted','BuyOfferCanceled','BuyOfferEdited']
    if(!acceptEvent.includes(eventInfo.name)) return;

    switch(eventInfo.name){
      case "BuyOfferAdded":
        return await this.buyOfferAdded(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "BuyOfferCompleted":
        return await this.buyOfferCompleted(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "BuyOfferCanceled":
        return await this.buyOfferCanceled(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "BuyOfferEdited":
        return await this.buyOfferEdited(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
   
    }
  }
  
 // event BuyOfferAdded(bytes32 offerId, address offerOwner, address nftAddr, uint tokenId, address offeredToken, uint amount, uint startTime);
  async buyOfferAdded(blockNo,params,txHash,blockDate){

    const startTime = new Date(params.startTime*1000);
    const nftItem = await NftItem.findOne({select:['tokenAddress','tokenId'],where:{tokenAddress: params.nftAddr,tokenId:params.tokenId}});
    const nftDesc = await NftItemDesc.findOne({select:['name'],where:{tokenAddress:params.nftAddr,tokenId:params.tokenId}})
    const usdPrice = await this.commonService.convertUsdPrice(params.offeredToken,params.amount);
    const tokenName = (nftDesc && 'name' in nftDesc)? nftDesc.name:"";

    //buy 글 작성시 아이템 없으면 추가
    if(!nftItem){
      await this.bulkService.addData(blockNo,{
        tableName:"nft_item",
        data:{
          tokenAddress:params.nftAddr,
          tokenId:params.tokenId,
          status:this.constant.STATUS.NFT.WITHDRAW,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"upsert",
        conflict_target:['tokenAddress','tokenId'],
        overwrite:['createdAt','updatedAt','status']
      });

      await this.bulkService.addData(blockNo,{
        tableName:"nft_queue",
        data:{
          tokenAddress:params.nftAddr,
          tokenId:params.tokenId
        },
        queryType:"insert",
      });
    }
    
    await this.bulkService.addData(blockNo,{
      tableName:"buy",
      data:{
        id: params.offerId,
        tokenAddress: params.nftAddr,
        tokenId: params.tokenId,
        tokenName: tokenName,
        currency: params.offeredToken,
        startTime: startTime,
        basePrice: params.amount,
        usdPrice:usdPrice,
        createTxHash:txHash,
        buyerAddress: params.offerOwner,
        status:this.constant.STATUS.BUY.START,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.BUY,
        status:this.constant.STATUS.BUY.START,
        tradeId: params.offerId,
        tokenAddress: params.nftAddr,
        currency:params.offeredToken,
        txHash:txHash,
        amount:params.amount,
        tokenId: params.tokenId,
        accountAddress: params.offerOwner,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    return params.offerId;
  }

  //event BuyOfferCompleted(bytes32 hash, bytes32 offerId, address nftReceiverAddr, address tokenReceiverAddr);
  async buyOfferCompleted(blockNo,params,txHash,blockDate){
    
    const buy = await Buy.findOne(params.offerId)
    const usdPrice = await this.commonService.convertUsdPrice(buy.currency,buy.basePrice);
    const endTime = new Date(params.endTime*1000);
    const fee = await this.nodeService.getFee(buy.basePrice); //구매자 지불금액

    await this.bulkService.rankInBulk(this.bulkService, blockNo, buy.tokenAddress, usdPrice,['total','week','tradeCnt'])

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.BUY,
        status:this.constant.STATUS.BUY.DONE,
        toAddress:params.nftReceiverAddr,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{ 
        tradeId: params.offerId,
        eventType:this.constant.TYPE.EVENT.BUY
      },
      queryType:"update"
    });

    //판매자 판매 활동내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.SELL,
        status:this.constant.STATUS.SELL.DONE,
        currency:buy.currency,
        amount:buy.basePrice,
        tradeId: params.offerId,
        tokenAddress: buy.tokenAddress,
        tokenId: buy.tokenId,
        txHash:txHash,
        accountAddress: params.tokenReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    //구매자 토큰 입금 내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.DEPOSIT,
        tradeId:params.offerId,
        tradeType:this.constant.TYPE.TRADE.BUY,
        txHash:txHash,
        tokenAddress:buy.currency,
        amount:Number(buy.basePrice)-fee,
        usdPrice:usdPrice,
        accountAddress:params.tokenReceiverAddr,
        fromAddress:params.nftReceiverAddr,
        toAddress:params.tokenReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });
  
    //구매자 토큰 출금 내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.WITHDRAW,
        tradeId:params.offerId,
        tradeType:this.constant.TYPE.TRADE.BUY,
        txHash:txHash,
        tokenAddress:buy.currency,
        amount:buy.basePrice,
        usdPrice:usdPrice,
        accountAddress:params.nftReceiverAddr,
        fromAddress:params.nftReceiverAddr,
        toAddress:params.tokenReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        ownerAddress: params.nftReceiverAddr,
        tradeId: params.offerId,
        currency:buy.currency,
        price:buy.basePrice,
        usdPrice:usdPrice
      },
      where:{ tokenAddress:buy.tokenAddress,tokenId:buy.tokenId },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"buy",
      data:{
        endTime:endTime,
        lastTxHash:txHash,
        buyerAddress: params.nftReceiverAddr,
        sellerAddress: params.tokenReceiverAddr,
        status:this.constant.STATUS.BUY.DONE,
        usdPrice:usdPrice,
        updatedAt:blockDate
      },
      where:{ id: params.offerId },
      queryType:"update"
    });

    //보유량 업데이트
    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        lockBuyAmount:()=>"lockBuyAmount -"+buy.basePrice
      },
      where:{ accountAddress:params.nftReceiverAddr, tokenAddress:buy.currency },
      queryType:"update"
    });

    //경매 종료시 nft item 가격 업데이트
    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        currency: buy.currency,
        price: buy.basePrice,
        usdPrice: usdPrice,
      },
      where:{ tokenAddress:buy.tokenAddress,tokenId:buy.tokenId },
      queryType:"update"
    });    
  }

  //event BuyOfferCanceled(bytes32 hash, bytes32 offerId, address offerOwner);
  async buyOfferCanceled(blockNo,params,txHash,blockDate){
    const buy = await Buy.findOne(params.offerId)

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.BUY.CANCEL,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{ 
        tradeId: params.offerId
      },
      queryType:"update"
    });

    //보유량 업데이트
    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        lockBuyAmount:()=>"lockBuyAmount -"+buy.basePrice
      },
      where:{ accountAddress:buy.buyerAddress, tokenAddress:buy.currency },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"buy",
      data:{
        status:this.constant.STATUS.BUY.CANCEL,
        updatedAt:blockDate,
        lastTxHash:txHash
      },
      where:{ id:params.offerId },
      queryType:"update"
    });

    return params.offerId;

  }
  
  //event BuyOfferEdited(bytes32 hash, bytes32 offerId, address offerOwner, address offeredToken, uint amount);
  async buyOfferEdited(blockNo,params,txHash,blockDate){
  
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.BUY.EDIT,
        currency:params.offeredToken,
        amount:params.amount,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{ 
        tradeId: params.offerId
      },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"buy",
      data:{
        currency: params.offeredToken,
        basePrice: params.amount,
        updatedAt: blockDate,
        lastTxHash: txHash
      },
      where:{ id:params.offerId },
      queryType:"update"
    });
  }



}

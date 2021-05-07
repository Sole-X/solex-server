import { Service, Inject } from 'typedi';
import { Sale } from '../../../entities/Sale';
import { SellNego } from '../../../entities/SellNego';
import { NftItemDesc } from '../../../entities/NftItemDesc';

import { Not } from "typeorm";

@Service("SellService")
export class SellService {
  eventMap;

  constructor (
    @Inject("BulkService") private bulkService,
    @Inject("AbiService") private abiService,
    @Inject("constant") private constant,
    @Inject("CommonService") private commonService,
    @Inject("NodeService") private nodeService,
  ) {
    this.eventMap = this.abiService.getEventMap('sell-abi')
  }

  public async handler(blockNo,topicHash,log,blockDate){

    const eventInfo = this.eventMap.get(topicHash) || '';
    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'],log)
    const acceptEvent = ['SellOfferAdded','SellOfferCompleted','SellOfferCanceled','SellOfferEdited','NegoAdded'
    ,'NegoCanceled','NegoRejected'];
 
    if(!acceptEvent.includes(eventInfo.name)) return;

    switch(eventInfo.name){
      case "SellOfferAdded":
        return await this.sellOfferAdded(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "SellOfferCompleted":
        return await this.sellOfferCompleted(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "SellOfferCanceled":
        return await this.sellOfferCanceled(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "SellOfferEdited":
        return await this.sellOfferEdited(blockNo,decodeParams,log.transactionHash,blockDate);
      break;
      case "NegoAdded":
        return await this.negoAdded(blockNo,decodeParams,log.transactionHash,blockDate)
      break;
      case "NegoCanceled":
        return await this.negoCanceled(blockNo,decodeParams,log.transactionHash,blockDate)
      break;
      case "NegoRejected":
        return await this.negoRejected(blockNo,decodeParams,log.transactionHash,blockDate)
      break;      
    }
  }

  //event SellOfferAdded(bytes32 offerId, address offerOwner, address nftAddr, uint tokenId, address wantedToken, uint maxAmount, bool isNegotiable);
  async sellOfferAdded(blockNo,params,txHash,blockDate){
    const sellType = ( params.isNegotiable)? this.constant.TYPE.SALE.NEGOTIABLE_SELL:this.constant.TYPE.SALE.DIRECT_SELL
    const nftDesc = await NftItemDesc.findOne({select:['name'],where:{tokenAddress:params.nftAddr,tokenId:params.tokenId}})
    var tokenName = (nftDesc && 'name' in nftDesc)? nftDesc.name:"";
    const usdPrice = await this.commonService.convertUsdPrice(params.wantedToken, params.maxAmount);
 
    //판매글 생성
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        id: params.offerId,
        tokenAddress: params.nftAddr,
        tokenId: params.tokenId,
        tokenName: tokenName,
        currency: params.wantedToken,
        startTime:blockDate,
        basePrice: params.maxAmount,
        currentPrice: params.maxAmount,
        usdPrice: usdPrice,
        createTxHash:txHash,
        ownerAddress: params.offerOwner,
        type:sellType,
        status:this.constant.STATUS.SELL.START,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    //판매자 판매 활동내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.SELL,
        status:this.constant.STATUS.SELL.START,
        currency:params.wantedToken,
        amount:params.maxAmount,
        tradeId: params.offerId,
        tokenAddress: params.nftAddr,
        tokenId: params.tokenId,
        txHash:txHash,
        accountAddress: params.offerOwner,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    return params.sellId;
  }

  //event SellOfferCompleted(hash, offerId, nftReceiverAddr, tokenReceiverAddr, isNegoAccepted, nftAddr, tokenId, tokenAddr, tokenAmount);
  async sellOfferCompleted(blockNo,params,txHash,blockDate){
    
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, params.tokenAmount);
    const sell = await Sale.findOne(params.offerId);
    const paidAmount = await this.nodeService.getPaidAmount(params.tokenAmount); //구매자 지불금액
    
    //nego 수락하여 거래 완료됐을 경우
    if(params.isNegoAccepted){
      const nego = await SellNego.findOne({
        sellId:params.offerId,
        accountAddress:params.nftReceiverAddr,
        status:this.constant.STATUS.NEGO.START
      });

      //구매자 협상 끝내기
      await this.bulkService.addData(blockNo,{
        tableName:"sell_nego",
        data:{
          status:this.constant.STATUS.NEGO.DONE,
          usdPrice:usdPrice
        },
        where:{ 
          id:nego.id
        },
        queryType:"update"
      });

      //구매자 협상 활동내역 끝내기
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          status:this.constant.STATUS.NEGO.DONE,
          usdPrice:usdPrice,
          amount:paidAmount,
          txHash:txHash,
          updatedAt:blockDate
        },
        where:{ 
          tradeId: params.offerId,
          accountAddress:params.nftReceiverAddr,
          eventType:this.constant.TYPE.EVENT.NEGO,
          status:this.constant.STATUS.NEGO.START
        },
        queryType:"update"
      });
    }else{
      //즉시구매시 구매자 협상(거래) 내역 추가 
      await this.bulkService.addData(blockNo,{
        tableName:"activity",
        data:{
          eventType:this.constant.TYPE.EVENT.BUY,
          status:this.constant.STATUS.NEGO.DONE,
          tradeId: params.offerId,
          txHash:txHash,
          tokenAddress: sell.tokenAddress,
          tokenId: sell.tokenId,
          currency:params.tokenAddr,
          amount:paidAmount,
          usdPrice:usdPrice,
          accountAddress: params.nftReceiverAddr,
          fromAddress:params.tokenReceiverAddr,
          toAddress:params.nftReceiverAddr,
          createdAt:blockDate,
          updatedAt:blockDate
        },
        queryType:"insert"
      });
    }

    //판매자 판매활동 종료 처리
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.SELL.DONE,
        currency:params.tokenAddr,
        amount:paidAmount,
        usdPrice:usdPrice,
        toAddress:params.nftReceiverAddr,
        tradeId:params.offerId,
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{ 
        tradeId: params.offerId,
        eventType:this.constant.TYPE.EVENT.SELL,
        accountAddress:params.tokenReceiverAddr
      },
      queryType:"update"
    });

    //판매자 토큰 입금 내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.TOKEN,
        status:this.constant.STATUS.TOKEN.DEPOSIT,
        tradeId:params.offerId,
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        currency:params.tokenAddr,
        amount:params.tokenAmount,
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
        txHash:txHash,
        tokenAddress:params.tokenAddr,
        currency:params.tokenAddr,
        amount:paidAmount,
        usdPrice:usdPrice,
        accountAddress:params.nftReceiverAddr,
        fromAddress:params.nftReceiverAddr,
        toAddress:params.tokenReceiverAddr,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });
    
    //판매 종료시 nft item 가격 업데이트
    await this.bulkService.addData(blockNo,{
      tableName:"nft_item",
      data:{
        currency:params.tokenAddr,
        price: paidAmount,
        usdPrice: usdPrice,
      },
      where:{ tokenAddress:sell.tokenAddress,tokenId:sell.tokenId },
      queryType:"update"
    });    

    //판매글 종료 처리
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        status:this.constant.STATUS.SALE.DONE,
        buyerAddress:params.nftReceiverAddr,
        currency:params.tokenAddr,
        currentPrice:paidAmount,
        usdPrice:usdPrice,
        endTime:blockDate,
        lastTxHash:txHash,
        updatedAt:blockDate
      },
      where:{ id: params.offerId },
      queryType:"update"
    });

    //거래 금액 release 처리
    await this.bulkService.addData(blockNo,{
      tableName:"token_balance",
      data:{
        lockAuctionAmount:()=>"lockSellAmount - " + paidAmount
      },
      where:{ accountAddress:params.nftReceiverAddr,tokenAddress:params.tokenAddr},
      queryType:"update"
    });
    
    await this.bulkService.rankInBulk(this.bulkService, blockNo, sell.tokenAddress, usdPrice,['total','week','tradeCnt'])
  }

  //event SellOfferCanceled(bytes32 hash, bytes32 offerId, address offerOwner);
  async sellOfferCanceled(blockNo,params,txHash,blockDate){
  
    //판매자 판매 활동내역 취소 변경
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.SELL.CANCEL,
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{ 
        tradeId: params.offerId,
        accountAddress: params.offerOwner
      },
      queryType:"update"
    });

    //판매글 취소
    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        status:this.constant.STATUS.SELL.CANCEL,
        lastTxHash:txHash,
        updatedAt:blockDate
      },
      where:{ id:params.offerId },
      queryType:"update"
    });

    return params.offerId;
  }

  //event SellOfferEdited(bytes32 hash, bytes32 offerId, address offerOwner, address wantedToken, uint maxAmount, bool isNegotiable);
  async sellOfferEdited(blockNo,params,txHash,blockDate){
    
    const sellType = ( params.isNegotiable)? this.constant.TYPE.SALE.NEGOTIABLE_SELL:this.constant.TYPE.SALE.DIRECT_SELL

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{ 
        tradeId: params.offerId,
        accountAddress: params.offerOwner
      },
      queryType:"update"
    });

    await this.bulkService.addData(blockNo,{
      tableName:"sale",
      data:{
        currency:params.wantedToken,
        basePrice:params.maxAmount,
        currentPrice:params.maxAmount,
        type:sellType,
        lastTxHash:txHash,
        updatedAt:blockDate
      },
      where:{ id:params.offerId },
      queryType:"update"
    });
  }

  //event NegoAdded(bytes32 hash, bytes32 offerId, address negoUser, address tokenAddr, uint amount);
  async negoAdded(blockNo,params,txHash,blockDate){

    const sell = await Sale.findOne({ id:params.offerId });
    const usdPrice = await this.commonService.convertUsdPrice(params.tokenAddr, params.amount);
    
    //구매자 협상 활동내역 추가
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        eventType:this.constant.TYPE.EVENT.NEGO,
        status:this.constant.STATUS.NEGO.START,
        tradeId: params.offerId,
        txHash:txHash,
        tokenAddress: sell.tokenAddress,
        tokenId: sell.tokenId,
        currency: params.tokenAddr,
        amount: params.amount,
        usdPrice:usdPrice,
        accountAddress: params.negoUser,
        fromAddress:params.negoUser,
        toAddress:sell.ownerAddress,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    //협상 추가
    await this.bulkService.addData(blockNo,{
      tableName:"sell_nego",
      data:{
        id: params.hash,
        accountAddress: params.negoUser,
        sellId:params.offerId,
        negoPrice:params.amount,
        usdPrice:usdPrice,
        currency:params.tokenAddr,
        status:this.constant.STATUS.NEGO.START,
        createdAt:blockDate,
        updatedAt:blockDate
      },
      queryType:"insert"
    });

    return params.hash;
  }

  //event NegoCanceled(bytes32 hash, bytes32 offerId, address negoUser);
  async negoCanceled(blockNo,params,txHash,blockDate){

    //협상 활동내역 취소
    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.NEGO.CANCEL,
        txHash:txHash,
        updatedAt:blockDate
      },
      where:{
        eventType:this.constant.TYPE.EVENT.NEGO,
        status:this.constant.STATUS.NEGO.START,
        tradeId: params.offerId,
        accountAddress: params.negoUser
      },
      queryType:"update"
    });
    
    //협상 취소
    await this.bulkService.addData(blockNo,{
      tableName:"sell_nego",
      data:{
        status:this.constant.STATUS.NEGO.CANCEL
      },
      where:{
        status:this.constant.STATUS.NEGO.START,
        sellId:params.offerId,
        accountAddress:params.negoUser
      },
      queryType:"update"
    });

  }

  //event NegoRejected(bytes32 hash, bytes32 offerId, address negoUser);
  async negoRejected(blockNo,params,txHash,blockDate){

    await this.bulkService.addData(blockNo,{
      tableName:"activity",
      data:{
        status:this.constant.STATUS.NEGO.REJECT,
        updatedAt:blockDate,
        txHash:txHash
      },
      where:{
        eventType: this.constant.TYPE.EVENT.NEGO,
        tradeId: params.offerId,
        accountAddress:params.negoUser
      },
      queryType:"update"
    });
    
    await this.bulkService.addData(blockNo,{
      tableName:"sell_nego",
      data:{
        status:this.constant.STATUS.NEGO.REJECT,
      },
      where:{
        status:this.constant.STATUS.NEGO.START,
        sellId:params.offerId,
        accountAddress:params.negoUser
      },
      queryType:"update"
    });


    return params.hash;
  }
}

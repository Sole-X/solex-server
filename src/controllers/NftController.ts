import { Request, Response, NextFunction } from 'express';
import { getRepository,In,Between,LessThan,Like,Not } from "typeorm";
import { Container } from "typedi";

import { NftItem } from "../entities/NftItem";
import { NftItemDesc } from "../entities/NftItemDesc";
import { NftRank } from "../entities/NftRank";
import { NftLiked } from "../entities/NftLiked";
import { NftInfo } from "../entities/NftInfo";
import { Activity } from "../entities/Activity";
import { Buy } from '../entities/Buy';
import { Sale } from '../entities/Sale';
import { Account } from '../entities/Account';

import { RedisService } from '../services/RedisService';
import { NftService } from '../services/NftService';
import { CommonService } from '../services/CommonService';

//아이템 검색 (Sale)
exports.saleSearch = async function (req:Request, res:Response, next:NextFunction) {
  const commonService:any  = Container.get('CommonService');
  const constant:any = Container.get('constant');
  const nftService:NftService  = Container.get('NftService');

  const status:any = req.query.status || "SELL,AUCTION";
  const categories = req.query.category;
  const collections:any = req.query.collection;
  const platform:any = req.query.platform;
  const currency:any = req.query.currency;
  const price:any = req.query.price;
  const page:any = req.query.page || 1;
  const limit:any = req.query.limit || 10;
  const search = req.query.search;
  const buyerAddr = req.query.buyerAddr;
  const ownerAddr = req.query.ownerAddr;
  const connectAddr = req.query.connectAddr;
  const publisher = req.query.publisher;
  const lifeStatus = req.query.lifeStatus || '';

  var order:any = req.query.order || "DATE";

  try {
    var where = await commonService.makeWhereFromReq({
      category:categories,
      collection:collections,
      currency:currency,
      price:price,
      priceName:"currentPrice",
      search:search,
      platformByInfo:platform,
      publisher:publisher
    });

    var statusArr = [];
    if(order.indexOf("PARTICIPANT")<0 && status.indexOf("SELL") > -1) statusArr.push(constant.TYPE.SALE.DIRECT_SELL,constant.TYPE.SALE.NEGOTIABLE_SELL);
    if(!status || status.indexOf("AUCTION") > -1) statusArr.push(constant.TYPE.SALE.NORMAL_AUCTION,constant.TYPE.SALE.INSTANT_AUCTION);
    if(statusArr.length > 0) where['type'] = In(statusArr);

    if(lifeStatus == "START"){
      where['status'] = constant.STATUS.SALE.START;
    }else if(lifeStatus == "DONE"){
      where['status'] = constant.STATUS.SALE.DONE;
    }else{
      where['status'] = In([constant.STATUS.SALE.START,constant.STATUS.SALE.DONE]);
    }
    
    if(buyerAddr) where['buyerAddress'] = buyerAddr;
    if(ownerAddr) where['ownerAddress'] = ownerAddr;
    
    order = await commonService.makeOrderFromReq(order);
    
    var result:any = await Sale.pagination(page, limit, where,order);
    
    result.items = await nftService.bindNft(result.items,true);   
    result.items = await nftService.bindInfo(result.items,['like','buyInfo'],{connectAddr:connectAddr});
    result.items = await nftService.saleBindNegoBid(result.items);
    
    return res.status(200).json( result );
  } catch (e) {
    return next(e);
  }
  
}

//아이템/컬렉션/계정 일치 검색
exports.matchSearch = async function (req:Request, res:Response, next:NextFunction) {
  
  const constant:any = Container.get('constant');
  const type = req.query.type || "SALE";
  const limit = 4;
  const search = (req.query.search)? req.query.search.toString().trim():"SALE";
  var result={};
  var nftItems;
  var accounts;

  try {
    if(search == '') throw Error("SEARCH EMPTY");

    var tokenAddrArr = [];
    var tokenIdArr = [];

    if(type=="SALE"){
      nftItems = await Sale.find({
        where:{
          tokenName:Like("%"+search+"%"),
          status:In([constant.STATUS.SALE.START,constant.STATUS.SALE.DONE])
        },
        relations:['desc'],
        take: limit
      })

    }else if(type=="BUY"){
      nftItems = await Buy.find({
        where:{
          tokenName:Like("%"+search+"%"),
          status:In([constant.STATUS.BUY.START,constant.STATUS.BUY.DONE])
        },
        relations:['desc'],
        take: limit
      })

    }

    const pubs = await getRepository(NftItem)
    .createQueryBuilder()
    .select('publisher')
    .where({ publisher: Like("%" + search + "%") })
    .distinct(true)
    .execute()

    tokenAddrArr = tokenAddrArr.concat(nftItems.map(item => item.tokenAddress))
    tokenIdArr = tokenIdArr.concat(nftItems.map(item => item.tokenId))

    accounts = await Account.find({
      select:['accountAddress','username'],
      where:[
        {accountAddress:Like("%"+search+"%")},
        {username:Like("%"+search+"%")}
      ],
      take:limit
    });
    const nftInfos = await NftInfo.find({where:{name:Like("%"+search+"%")},take:limit });

    result['nftItems'] = nftItems;
    result['nftInfos'] = nftInfos;
    result['accounts'] = accounts;
    result['publishers'] = pubs.map(item => item.publisher);
  
    return res.status(200).json( result );
  } catch (e) {
    console.log('e',e)
    return next(e);
  }
}

//특정 아이템 정보
exports.getCollectionInfo = async function (req:Request, res:Response, next:NextFunction) {

  try {
    var tokenAddr = req.params.tokenAddr;

    const publisherCnt = await NftItem.count({tokenAddress:tokenAddr,publisher:Not("")})
    const nftRank = await NftRank.findOne({tokenAddress:tokenAddr})
    const ownerCnt = nftRank.ownerCnt;
    const nftCnt = nftRank.nftCnt;
    const avgPrice = nftRank.avgPrice;
    const volume = nftRank.total;


    return res.status(200).json( {
      nftCnt: nftCnt,
      publisherCnt: publisherCnt,
      ownerCnt: ownerCnt,
      avgPrice: avgPrice,
      volume: volume
    } );
  } catch (e) {
    return next(e);
  }
}

//특정 아이템 정보
exports.getNft = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');
  const commonService:any = Container.get('CommonService');
  const constant:any = Container.get('constant');

  try {
    var tokenAddr = req.params.tokenAddr;
    var tokenId = req.params.tokenId;
    var buyId:any = req.query.buyId;

    var result:any = await NftItem.findOne({
      where:{tokenAddress:(tokenAddr),tokenId:(tokenId)},
      relations:['desc']
    });

    if(!result && !buyId) throw Error("NO NFT");

    if(!result && buyId && buyId != ""){
      var buyInfo = await Buy.findOne(buyId);
      buyInfo = (await commonService.convertStatusStr([buyInfo],'BUY'))[0];
      buyInfo = (await nftService.bindInfo([buyInfo],['like'],{connectAddr:req.query.connectAddr}))[0];

      if(buyInfo){
        result = {
          buy:buyInfo
        };
      }else{
        throw Error("NO BUY && NFT");
      } 
    }else{
      result = (await nftService.bindInfo([result],['trade','like','buyInfo'],{connectAddr:req.query.connectAddr}))[0];
      const key = Object.keys(constant.STATUS.NFT).find(key => constant.STATUS.NFT[key] === result.status);
      result['statusStr'] = key;
  
      result['nftInfo'] = await NftInfo.findOne(result.tokenAddress);
      const createActivity = await Activity.findOne({
        select:['accountAddress'],
        where:{tokenAddress:result.tokenAddress, tokenId:result.tokenId,eventType:constant.TYPE.EVENT.NFT,status:1},
        order:{createdAt:"ASC"}
      })
      if(createActivity){
        result['creator'] = await NftInfo.findOne(createActivity.accountAddress);
      }else{
        result['creator'] = ''
      }

      if(buyId && buyId != ""){
        var buyInfo = await Buy.findOne(buyId);
        buyInfo = (await commonService.convertStatusStr([buyInfo],'BUY'))[0];

        if(buyInfo) result['buy'] = buyInfo;
      }
    }
    
    return res.status(200).json( result );
  } catch (e) {
    return next(e);
  }
}


exports.getMetadata = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');
  var tokenAddr:any = req.query.tokenAddr;
  var tokenIds:any = req.query.tokenIds;
  tokenIds = tokenIds.split(",");
  var result = {};

  try {
    var dbNftsObjs = await getRepository(NftItem).find({
      where:{tokenAddress:tokenAddr,tokenId:In(tokenIds)}
      ,relations:['desc']});

    const nftInfos = dbNftsObjs.reduce(function(result:any, element) {
      if(result[element.tokenAddress]){
        if(result[element.tokenAddress][element.tokenId]){
          result[element.tokenAddress][element.tokenId] = element;
        }else{
          result[element.tokenAddress][element.tokenId] = element;
        } 
      }else{
        result[element.tokenAddress] ={};
        result[element.tokenAddress][element.tokenId] = element;
      }

      return result;
    }, {}); 

    for(let i=0; i<tokenIds.length;i++){

      if(!(nftInfos[tokenAddr][tokenIds[i]]['desc'])){
        var [name,description,image,animationUrl] = await nftService.getMetadata(tokenAddr,tokenIds[i]);
        nftInfos[tokenAddr][tokenIds[i]]['desc'] = {
          name:name,
          description:description,
          image:image,
          animationUrl:animationUrl
        }
      }      
    }
    
    return res.status(200).json({ nfts: nftInfos });
  } catch (e) {
    return next(e);
  }
}

//최신 아이템 목록
exports.latest = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');

  try {
    var result = await getRepository(NftItem).find({order: {createdAt: "DESC"},take:10,relations:['desc']});
    result = await nftService.bindInfo(result,['trade','like','buyInfo'],{connectAddr:req.query.connectAddr});

    return res.status(200).json({ nfts: result });
  } catch (e) {
    return next(e);
  }
}

//찜 등록
exports.like = async function (req:Request, res:Response, next:NextFunction) {

  const accountAddr = req.body.accountAddr;
  const tradeId = req.body.tradeId;
  var type = 'sale';
  
  try {
    var trade:any = await Sale.findOne(tradeId);
    if(!trade){
      trade = await Buy.findOne(tradeId);
      if(!trade){
        throw Error("NO TRADE");
      }else{
        type = 'buy';
      } 
    } 
    
    const nftLiked:NftLiked = await getRepository(NftLiked).findOne({where: {accountAddress:accountAddr,tradeId:tradeId}});
    if(!nftLiked){
      await getRepository(NftLiked).insert({accountAddress:accountAddr,tokenAddress:trade.tokenAddress,tokenId:trade.tokenId,tradeId:tradeId});
      await getRepository(type).increment({id:tradeId},'liked',1);
    } 

    return res.status(200).json({ status: 200 });
  } catch (e) {
    return next(e);
  }
}

//찜 해제
exports.deleteLike = async function (req:Request, res:Response, next:NextFunction) {

  const accountAddr = req.body.accountAddr;
  const tradeId = req.body.tradeId;
  var type = 'sale';

  try {
    var trade:any = await Sale.findOne(tradeId);
    if(!trade){
      trade = await Buy.findOne(tradeId);
      if(!trade){
        throw Error("NO TRADE");
      }else{
        type = 'buy';
      } 
    } 
    
    const nftLiked:NftLiked = await getRepository(NftLiked).findOne({accountAddress:accountAddr,tradeId:tradeId})
    if(nftLiked){
      await getRepository(NftLiked).delete({accountAddress:accountAddr,tradeId:tradeId});
      if(trade.liked>0) await getRepository(type).decrement({id:tradeId},'liked',1);
    } 

    return res.status(200).json({ status: 200});
  } catch (e) {
    return next(e);
  }
}

//찜 목록
exports.getLike = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');

  var accountAddr = req.params.accountAddr;
  var items = [];
  try {
    if(accountAddr == "") throw Error("INVALID ACCOUNT");

    var nftLikeds = await NftLiked.pagination(req.query.page, req.query.limit, {accountAddress:accountAddr},{createdAt:"DESC"},['nft','nft.desc']);

    nftLikeds.items.forEach((nftLiked:any)=>{ 
      
      if(nftLiked.nft){
        nftLiked.nft['likeTradeId'] = nftLiked.tradeId;
        items.push(nftLiked.nft);
      }else{
        nftLiked.nft = {};
        nftLiked['likeTradeId'] = nftLiked.tradeId;
      }
    })
    
    items = await nftService.bindInfo(items,['trade','like','buyInfo']);

    nftLikeds.items = items;

    return res.status(200).json(nftLikeds);
  } catch (e) {
    return next(e);
  }
}

//찜 많은 눌린 아이템 목록
exports.mostLike = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');

  try {
    var nfts = await Sale.find({select:['tokenAddress','tokenId'],order: {liked: "DESC"},take:10});
    nfts = await nftService.convertNft(nfts,true);
    nfts = await nftService.bindInfo(nfts,['trade','like','buyInfo']);

    return res.status(200).json({ nfts: nfts});
  } catch (e) {
    return next(e);
  }
}

//체인별 최신 아이템 목록
exports.latestChain = async function (req:Request, res:Response, next:NextFunction) {
  const constant:any = Container.get('constant');

  try {
    var platform = req.params.chainName;
    const result = await NftItem.find({
      where:{platform:constant.CHAIN[platform]},
      order: {createdAt: "DESC"},
      take:10,
      relations:['desc']
    });

    return res.status(200).json({ status: 200, data: result});
  } catch (e) {
    return next(e);
  }
}

//address 별 최근 본 아이템
exports.recentViewList = async function (req:Request, res:Response, next:NextFunction) {
  const nftService:NftService  = Container.get('NftService');
  const redisServer:RedisService = Container.get("RedisService");
  const constant:any = Container.get('constant');
  const accountAddr = req.params.accountAddr || "";
  const rangeKey = "recentView" + ((accountAddr=="")?"":accountAddr )
  var nfts = [];
  var nftInfos = {};

  return redisServer.lrange(rangeKey,0,20).then(async (result)=>{
    
    const sales = await Sale.find({where:{id:In(result)}});
    const buys = await Buy.find({where:{id:In(result)}});
    const saleInfos = [...sales,...buys];
    saleInfos.map((item)=>{ nftInfos[item.id]=item; })
    
    nfts = result.reduce((result,item:any)=>{
      if(item in nftInfos){
        if('sellerAddress' in nftInfos[item]){
          nftInfos[item]['saleType'] = 'BUY'
          result.push(nftInfos[item])
        }else{
          if(item.type == constant.TYPE.SALE.NORMAL_AUCTION || item.type == constant.TYPE.SALE.INSTANT_AUCTION){
            nftInfos[item]['saleType'] = 'AUCTION'
          }else{
            nftInfos[item]['saleType'] = 'SELL'
          }
          result.push(nftInfos[item])
        }
        
      } 
      return result;
    },[]);
    nfts = await nftService.bindNft(nfts,true);
    nfts = await nftService.bindInfo(nfts,['like','buyInfo'],{connectAddr:req.query.connectAddr});
    nfts = await nftService.saleBindNegoBid(nfts);
    
    return res.status(200).json({ items:nfts });
  }).catch((e)=>{
    return next(e);
  });
}

//최근 본 아이템
exports.recentView = async function (req:Request, res:Response, next:NextFunction) {

  const redisService:RedisService = Container.get("RedisService");
  try {
    var accountAddr = req.body.accountAddr;
    var tradeId = req.body.tradeId;
    
    var nft:any = await getRepository(Sale).findOne({id:tradeId});
    if(!nft){
      nft = await getRepository(Buy).findOne({id:tradeId});
      if(!nft) throw Error("NO NFT");
    } 

    if(accountAddr == "") throw Error("NO ACCOUNT");

    await redisService.lrem("recentView"+accountAddr,tradeId);

    redisService.lpush("recentView"+accountAddr,tradeId).then((result)=>{
      //일주일 후 만료
      if(result > 20) redisService.rpop("recentView"+accountAddr)
      redisService.expire("recentView"+accountAddr,60*60*24*7); //60*60*24*7 일주일
    });


    return res.status(200).json({ status: 200 });
  } catch (e) {
    return next(e);
  }
}

//거래내역 & 가격 변동내역
exports.getNftHistory = async function (req:Request, res:Response, next:NextFunction) {
  const constant:any = Container.get('constant');
  const commonService:CommonService  = Container.get('CommonService');
  const eventType = constant.TYPE.EVENT;
  try {
 
    var tokenAddr = req.params.tokenAddr;
    var tokenId = req.params.tokenId;
    var sum:any = 0;
    const history:any = await Activity.find({
      where:{
        tokenAddress:tokenAddr,
        tokenId:tokenId,
        eventType:In([eventType.AUCTION, eventType.SELL,eventType.BUY]),
        status:In([7])  //status 1=pending, 2=start 7=done
      },
      order:{updatedAt:"ASC"}
    });

    const prices = [];
    
    for(let i=0; i<history.length; i++){
      const item = history[i];
      if(Number(item.usdPrice)==0 && item.currency !="" && Number(item.amount)>0){
        item.usdPrice = await commonService.convertUsdPrice(item.currency, item.amount); 
      } 
      prices.push(item.usdPrice)
      sum += Number(item.usdPrice);
    }

    const avgPrice = (sum / history.length) || 0;

    const result = {
      minPrice:Math.min.apply(null,prices),
      maxPrice:Math.max.apply(null,prices),
      avgPrice:avgPrice,
      prices:[prices],
      history:[history]
    }
    return res.status(200).json( result );
  } catch (e) {
    return next(e);
  }
}
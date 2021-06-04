import { TokenInfo } from "../entities/TokenInfo";
import { NftInfo } from "../entities/NftInfo";
import { NftItem } from "../entities/NftItem";
import { Category } from "../entities/Category";
import { Variable } from "../entities/Variable";
import { Sale } from "../entities/Sale";
import { Newsletter } from "../entities/Newsletter";
import { Buy } from "../entities/Buy";

import { Container } from "typedi";
import { RedisService } from '../services/RedisService';
import banWord from '../config/banWord';
import { getRepository, In,Not } from 'typeorm';


exports.getStakingInfo = async function (req, res, next) {
  const nodeService:any = Container.get("NodeService");
  const contractAddress:any = Container.get("contractAddress");

  try {
    var result = {};
    
    const variable = await Variable.find({
      where:{
        key:In(["totalStaking","totalReward"])
      }
    })
    
    const tokenInfo = await TokenInfo.findOne({
      where:{
        tokenAddress:contractAddress.TRIX
      }
    })
    
    for(let i=0;i<variable.length;i++){
      if(variable[i].key=="totalStaking") result['totalStaking'] = variable[i].value;
      if(variable[i].key=="totalReward") result['totalReward'] = variable[i].value;
    }
    result['trixPrice'] = tokenInfo.usdPrice;
    result['totalSupply'] = '9999982296000000000000000000';

    return res.status(200).json( result );
  } catch (e) {
    return next(e);
  }
}

exports.getWhitelist = async function (req, res, next) {
  const redisService:RedisService = Container.get("RedisService");
  const nodeService:any = Container.get("NodeService");
  const commonService:any = Container.get("CommonService");
  const constant:any = Container.get("constant");

  try {
    var nfts = await NftInfo.find();
    nfts = await commonService.convertStatusStr(nfts,'WHITELIST');
    var tokens = await TokenInfo.find();
    tokens = await commonService.convertStatusStr(tokens,'WHITELIST');

    var fee = await redisService.get("fee");
    if(!fee){
      const feeInfo = await nodeService.getFeeInfo();
      fee = Number(feeInfo.numer)/Number(feeInfo.denom)*100
      await redisService.set("fee",fee,100);
    }

    return res.status(200).json( {nfts,tokens,fee} );
  } catch (e) {
    return next(e);
  }
}

exports.getSideInfo = async function (req, res, next) {
  const redisService:RedisService = Container.get("RedisService");
  const constant:any = Container.get("constant");

  try {
    const nftCnt = await redisService.hgetall('nftCnt');
    const pubRst = await getRepository(NftItem).createQueryBuilder()
    .select('publisher')
    .where({"publisher":Not("")})
    .distinct(true)
    .limit(5)
    .execute()
    const pubs = pubRst.map(item=>item.publisher)
    var result = {};
    if(nftCnt && Object.keys(nftCnt).length>1){
      result = nftCnt;
    }else{

      result['nftCntAuction'] = await Sale.count({
        type:In([constant.TYPE.SALE.NORMAL_AUCTION,constant.TYPE.SALE.INSTANT_AUCTION]),
        status:In([constant.STATUS.SALE.START])
      });
      result['nftCntSell'] = await Sale.count({
        type:In([constant.TYPE.SALE.DIRECT_SELL,constant.TYPE.SALE.NEGOTIABLE_SELL]),
        status:In([constant.STATUS.SALE.START])
      });
      result['nftCntDone'] = await Sale.count({
        type:In([constant.TYPE.SALE.NORMAL_AUCTION,constant.TYPE.SALE.INSTANT_AUCTION,constant.TYPE.SALE.DIRECT_SELL,constant.TYPE.SALE.NEGOTIABLE_SELL]),
        status:In([constant.STATUS.SALE.DONE])
      });

      result['nftCntBuy'] = await Buy.count({
        status:In([constant.STATUS.BUY.START])
      });

      result['nftCntBuyDone'] = await Buy.count({
        status:In([constant.STATUS.BUY.DONE])
      });
      var table = ['buy','sale'];
      var query = "SELECT ";

      //카테고리 카운트 쿼리
      const nftCate = Object.keys(constant.TOKEN_CATE);
      for(let i=0; i<nftCate.length; i++){
        const cateAddrArr = await Category.find({where:{category:nftCate[i],type:constant.TYPE.CATEGORY.NFT}});
        const cateAddrs = cateAddrArr.map(arr=>arr.tokenAddress);
        if(cateAddrs.length > 0){
          query += " SUM( CASE WHEN tokenAddress In (";
          for(let j=0;j<cateAddrs.length;j++){
            query += " '"+cateAddrs[j]+"',";
          }
          query = query.slice(0,query.length-1)+") THEN 1 ELSE 0 END) AS {table}Cate"+nftCate[i]+","
        }else{
          result['saleCate'+nftCate[i]] = 0;
          result['buyCate'+nftCate[i]] = 0;
        }
      }

      //콜렉션 카운트 쿼리
      const nftInfos = await NftInfo.find({status:constant.STATUS.NFT_INFO.USE});
      for(let i=0; i<nftInfos.length; i++){
        query += "SUM( CASE WHEN tokenAddress = '"+nftInfos[i].tokenAddress+"' THEN 1 ELSE 0 END) AS {table}Collection"+nftInfos[i].symbol+",";
      }

      //통화 카운트 쿼리
      const tokenInfos = await TokenInfo.find({status:constant.STATUS.TOKEN_INFO.USE});
      for(let i=0; i<tokenInfos.length; i++){
        query += "SUM( CASE WHEN currency = '"+tokenInfos[i].tokenAddress+"'  THEN 1 ELSE 0 END) AS {table}Currency"+tokenInfos[i].symbol+","
      }

      query = query.slice(0,query.length-1)+" FROM {table} WHERE status In ("+constant.STATUS.BUY.START+","+constant.STATUS.BUY.DONE+") "; 

      for(let i=0; i<table.length; i++){
        const queryResult =query.replace(/{table}/gi,table[i]);
        const data = (await getRepository(table[i]).query(queryResult))[0];
        Object.keys(data).forEach(key=>{ result[key] = Number(data[key]) })
      }
      await redisService.hmset("nftCnt",result);
      redisService.expire("nftCnt",60);
    }

    return res.status(200).json( { nftCnt:result,pubs:pubs } );
  } catch (e) {
    return next(e);
  }
}


exports.sendMail = async function (req, res, next) {
  const mailService:any = Container.get("MailService");

  const tokenAddr = req.body.tokenAddress;
  const tokenId = req.body.tokenId;
  const reason = req.body.reason;

  try {

    const info = await mailService.report(tokenAddr, tokenId, reason);

    return res.status(200).json( {msg:info.response} );
  } catch (e) {
    return next(e);
  }
}

exports.nameCheck = async function (req, res, next) {
  var username = req.params.username;
  username = username.replace(/(\s*)/g, "")
  
  try {
    for(var i = 0;i < banWord.length;i++){ 
      if(username.indexOf(banWord[i]) > -1) throw Error("'"+banWord[i]+"' is not valid")
    }
    return res.status(200).json( {msg:"OK"} );
  } catch (e) {
    return next(e);
  }

}

exports.registNewsletter = async function (req, res, next) {

  const email = req.body.email;

  try {
    await Newsletter.insertIfNotExist({email:email});

    return res.status(200).json( {msg:'success'} );
  } catch (e) {
    return next(e);
  }
}

exports.sendNewsletter = async function (req, res, next) {
  const mailService:any = Container.get("MailService");

  const templateId = req.body.templateId;

  try {
    
    const info = await mailService.sendNewsletter()

    return res.status(200).json( {msg:info.response} );
  } catch (e) {
    return next(e);
  }
}
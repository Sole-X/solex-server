import { TokenInfo } from "../entities/TokenInfo";
import { NftInfo } from "../entities/NftInfo";
import { NftItem } from "../entities/NftItem";
import { Category } from "../entities/Category";
import { Variable } from "../entities/Variable";
import { Sale } from "../entities/Sale";

import { Container } from "typedi";
import { RedisService } from '../services/RedisService';
import banWord from '../config/banWord';
import { getRepository, In,Not } from 'typeorm';
import { Buy } from "../entities/Buy";
import { constant } from "lodash";

const nodemailer = require("nodemailer");

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
    result['totalSupply'] = await nodeService.getTrixTotalSupply();

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
    var result = {};
    if(nftCnt && Object.keys(nftCnt).length>1){
      result = nftCnt;
    }else{

      result['nftCntAuction'] = await Sale.count({
        type:In([constant.TYPE.SALE.NORMAL_AUCTION,constant.TYPE.SALE.INSTANT_AUCTION]),
        status:In([constant.STATUS.SALE.START,constant.STATUS.SALE.DONE])
      });
      result['nftCntSell'] = await Sale.count({
        type:In([constant.TYPE.SALE.DIRECT_SELL,constant.TYPE.SALE.NEGOTIABLE_SELL]),
        status:In([constant.STATUS.SALE.START,constant.STATUS.SALE.DONE])
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

    return res.status(200).json( { nftCnt:result } );
  } catch (e) {
    return next(e);
  }
}


exports.sendMail = async function (req, res, next) {

  const tokenAddr = req.body.tokenAddress;
  const tokenId = req.body.tokenId;
  const reason = req.body.reason;

  try {

    const mailOption = {
      host: "localhost",
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    };
    const transporter = nodemailer.createTransport(mailOption);

    let info = await transporter.sendMail({
      from: '"solex" <solex@solex.ozys.net>',
      to: ["wnrudgns73@ozys.net", 'lusterk@ozys.net'],
      subject: "Report - "+tokenAddr+" #"+tokenId, 
      text: reason,
      html: "<b>"+reason+"</b>" 
    });

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




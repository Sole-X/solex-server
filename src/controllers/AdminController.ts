import { Container } from "typedi";

import { Category } from "../entities/Category";
import { NftInfo } from "../entities/NftInfo";

exports.setCategory = async function (req, res, next) {

  const nftAddr = req.body.nftAddr;
  const cate = req.body.cate;
  var cateArr:any = []

  try {
    if(cate) cateArr=cate.split(",");

    await Category.delete({ tokenAddress:nftAddr });

    for(let i=0; i<cateArr.length; i++){
      await Category.insert({tokenAddress:nftAddr,category:cateArr[i],});
    }

    return res.status(200).json( {msg:"OK"} );
  } catch (e) {
    return next(e);
  }
}

exports.setCollection = async function (req, res, next) {
  const nodeService:any = Container.get("NodeService");

  const tokenAddr = req.body.tokenAddr;
  const platform = req.body.platform;
  const ethAddr = req.body.ethAddr;
  const explorer = req.body.explorer;
  const logoUrl = req.body.logoUrl;
  const desc = req.body.desc;
  const link = req.body.link;

  const [name,symbol,decimal] = await nodeService.getTokenInfo(tokenAddr,true);
  
  try {
    const result = await NftInfo.insertIfNotExist({
      tokenAddress:tokenAddr,
      platform:platform,
      ethAddress:ethAddr,
      name:name,
      symbol:symbol,
      explorer:explorer,
      desc:desc,
      link:link,
      logoUrl:logoUrl,
    });

    return res.status(200).json( result );

  } catch (e) {
    return next(e);
  }
}

exports.makeKasAccount = async function (req, res, next) {
  const kasService:any = Container.get("KasService");
  const chainId = req.query.chainId;

  try {

    const address = await kasService.makeKasAccount(chainId);
    //const address = await kasService.getKasAccounts(chainId);
    return res.status(200).json( address );
  } catch (e) {
    return next(e);
  }
}


exports.banNft = async function (req, res, next) {
  const nodeService = Container.get("NodeService");

  const tokenAddr = req.body.tokenAddr;
  const platform = req.body.platform;
  const tokenId = req.body.tokenId;
  const toAddr = req.body.toAddr;

  try {

    const result = {};
    return res.status(200).json( result );

  } catch (e) {
    return res.status(400).json( {msg:"FAIL:"+e.message} );
  }

}

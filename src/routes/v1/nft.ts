import { Router } from 'express';

const nftCtrl = require("../../controllers/NftController");
const route = Router();
const { nftValidationRules } = require('../../middlewares/validators/NftValidator')
const { commonValidationRules } = require('../../middlewares/validators/CommonValidator')

const { validate } = require('../../middlewares/validators/ResultValidator')

export default (app: Router) => {

  app.use('/v1/nfts', route);

  //아이템 검색
  route.get('', commonValidationRules(), validate, nftCtrl.saleSearch)

  //아이템 검색
  route.get('/match', nftCtrl.matchSearch)

  //아이템 get metadata && db insert 
  route.get('/metadata', nftCtrl.getMetadata)

  //최근본 아이템 목록
  route.get('/recentView', nftCtrl.recentViewList)

  //최근본 아이템 목록
  route.get('/recentView/:accountAddr', nftCtrl.recentViewList)

  //최근본 아이템(아이템 조회시 호출)
  route.post('/recentView', nftCtrl.recentView)

  //찜 등록
  route.post('/like', nftValidationRules(), validate, nftCtrl.like)

  //찜 해제
  route.post('/unlike', nftValidationRules(), validate, nftCtrl.deleteLike)

  //찜 목록
  route.get('/like/:accountAddr', nftValidationRules(), validate, nftCtrl.getLike)

  //찜 많은 눌린 아이템 목록
  route.get('/mostLike', nftCtrl.mostLike)

  //최신 아이템 목록
  route.get('/latest', nftCtrl.latest)

  //체인별 최신 아이템 목록
  route.get('/latest/:chainName', nftCtrl.latestChain)

  //컬렉션 정보 호출
  route.get('/:tokenAddr', nftValidationRules(), validate, nftCtrl.getCollectionInfo)

  //단일 아이템 정보 호출
  route.get('/:tokenAddr/:tokenId', nftValidationRules(), validate, nftCtrl.getNft)

  //단일 아이템 정보 호출
  route.get('/:tokenAddr/:tokenId/history', nftValidationRules(), validate, nftCtrl.getNftHistory)

  //체인별 최신 아이템 목록
  //route.get('/recently/:address', nftCtrl.recently)

};

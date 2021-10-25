import { Service, Inject } from 'typedi';
import { getRepository, In, Not } from 'typeorm';
import { Sale } from '../entities/Sale';
import { SellNego } from '../entities/SellNego';
import { AuctionBid } from '../entities/AuctionBid';
import { Buy } from '../entities/Buy';
import { NftLiked } from '../entities/NftLiked';
import { NftItem } from '../entities/NftItem';
import { NftItemDesc } from '../entities/NftItemDesc';
import { constant, find } from 'lodash';
const rp = require('request-promise');

@Service('NftService')
export class NftService {
  constructor(
    @Inject('logger') private logger,
    @Inject('constant') private constant,
    @Inject('CommonService') private commonService,
    @Inject('NodeService') private nodeService,
  ) {}

  //nft 배열에 관련 데이터 bind
  async bindNft(datas: any[], desc = false) {
    var nftKeys = [];

    for (let i = 0; i < datas.length; i++) {
      if (datas[i].tokenAddress && datas[i].tokenId)
        nftKeys.push("('" + datas[i].tokenAddress + "','" + datas[i].tokenId + "')");
    }

    if (nftKeys.length < 1) return datas;
    const nftKeysStr = '(' + nftKeys.join(',') + ')';

    var query = getRepository(NftItem)
      .createQueryBuilder()
      .where('(NftItem.tokenAddress, NftItem.tokenId) In ' + nftKeysStr);
    if (desc) query.leftJoinAndSelect('NftItem.desc', 'desc');
    const nftArr = await query.getMany();

    const nfts = await nftArr.reduce(function (result, data) {
      result[data.tokenAddress + ',' + data.tokenId] = data;
      return result;
    }, {});

    datas = await datas.reduce(function (result, data) {
      if (data.tokenAddress + ',' + data.tokenId in nfts)
        data['nftInfo'] = nfts[data.tokenAddress + ',' + data.tokenId];
      result.push(data);
      return result;
    }, []);

    return datas;
  }

  async bindInfo(nfts: any[], option, params: any = {}) {
    if (option.includes('trade') && nfts.length > 0) {
      const tradeIds = nfts.reduce(function (result, nft) {
        if (nft && nft.tradeId) result.push(nft.tradeId);
        return result;
      }, []);

      const sales = await Sale.find({
        where: { id: In(tradeIds) },
        relations: ['bids', 'negos'],
      });
      const saleInfo = sales.reduce((result, element) => {
        if (Number(element.usdPrice) <= 0)
          element.usdPrice = this.commonService.convertMaxUnit(element.tokenAddress, element.basePrice);
        result[element.id] = element;
        return result;
      }, {});

      nfts = await nfts.reduce((result, element) => {
        if (element.tradeId && element.tradeId in saleInfo) {
          if (
            saleInfo[element.tradeId].type == this.constant.TYPE.SALE.NORMAL_AUCTION ||
            saleInfo[element.tradeId].type == this.constant.TYPE.SALE.INSTANT_AUCTION
          ) {
            element['auction'] = saleInfo[element.tradeId];
            element['participation'] = saleInfo[element.tradeId].bids.length;
          } else {
            element['sell'] = saleInfo[element.tradeId];
            element['participation'] = saleInfo[element.tradeId].negos.length;
          }
        }

        result.push(element);
        return result;
      }, []);
    }

    if (option.includes('like') && params.connectAddr && nfts.length > 0) {
      const accountAddr = params.connectAddr;
      if (accountAddr != '') {
        const likeds = await NftLiked.find({
          select: ['tradeId'],
          where: { accountAddress: accountAddr },
        });
        const likeMap = likeds.map((liked) => liked.tradeId);

        nfts = nfts.reduce(function (result, element) {
          element['like'] = likeMap.includes(element.id) ? true : false;

          result.push(element);
          return result;
        }, []);
      }
    }

    //연결된 지갑이 조회중인 아이템이 구매 등록한 이력이 있는지 여부
    if (option.includes('buyInfo') && params.connectAddr && nfts.length > 0) {
      const buys = await Buy.find({
        where: {
          status: this.constant.STATUS.BUY.START,
          buyerAddress: params.connectAddr,
        },
      });
      const buyMap = buys.reduce(function (result: any, element) {
        if (result[element.tokenAddress]) {
          if (result[element.tokenAddress][element.tokenId]) {
            result[element.tokenAddress][element.tokenId].push(element);
          } else {
            result[element.tokenAddress][element.tokenId] = [element];
          }
        } else {
          result[element.tokenAddress] = {};
          result[element.tokenAddress][element.tokenId] = [element];
        }

        return result;
      }, {});

      nfts = nfts.reduce(function (result, element) {
        element['buys'] = [];

        if (element.tokenAddress in buyMap && element.tokenId in buyMap[element.tokenAddress]) {
          element['buys'] = buyMap[element.tokenAddress][element.tokenId];
        }
        result.push(element);
        return result;
      }, []);
    }

    return nfts;
  }

  async bindNegos(tradeArr: any[]) {
    const tradeIds = tradeArr.reduce(function (result, nft) {
      if (nft.tradeId) result.push(nft.tradeId);
      return result;
    }, []);

    const negos = await SellNego.find({
      select: ['sellId', 'declineReason', 'declineType'],
      where: { sellId: In(tradeIds) },
    });

    const negoInfo = negos.reduce((result, element) => {
      result[element.sellId] = element;
      return result;
    }, {});

    tradeArr = await tradeArr.reduce((result, element) => {
      if (element.tradeId && element.tradeId in negoInfo) {
        element['negoInfo'] = negoInfo[element.tradeId];
      }
      result.push(element);
      return result;
    }, []);
    return tradeArr;
  }

  //address, id 받아서 nft 배열로 반환
  async convertNft(datas: any[], desc = false) {
    var nftKeys = [];

    for (let i = 0; i < datas.length; i++) {
      if (datas[i].tokenAddress && datas[i].tokenId)
        nftKeys.push("('" + datas[i].tokenAddress + "','" + datas[i].tokenId + "')");
    }

    if (nftKeys.length < 1) return datas;
    const nftKeysStr = '(' + nftKeys.join(',') + ')';

    var query = getRepository(NftItem)
      .createQueryBuilder()
      .where('(NftItem.tokenAddress, NftItem.tokenId) In ' + nftKeysStr);
    if (desc) query.leftJoinAndSelect('NftItem.desc', 'desc');
    const nftArr = await query.getMany();

    const nfts = await nftArr.reduce(function (result, data) {
      result[data.tokenAddress + ',' + data.tokenId] = data;
      return result;
    }, {});

    datas = await datas.reduce(function (result, data) {
      if (data.tokenAddress + ',' + data.tokenId in nfts) {
        data = nfts[data.tokenAddress + ',' + data.tokenId];
      } else {
        data = data;
      }
      result.push(data);
      return result;
    }, []);

    return datas;
  }

  //게시글에 negobid 바인딩
  async saleBindNegoBid(sales: any[]) {
    const tradeIds = sales.reduce(function (result, sale) {
      if (sale.id) result.push(sale.id);
      return result;
    }, []);

    const bids = await AuctionBid.find({ where: { auctionId: In(tradeIds) } });
    const bidInfo = bids.reduce((result, element) => {
      if (!result[element.auctionId]) result[element.auctionId] = [];
      result[element.auctionId].push(element);
      return result;
    }, {});

    const negos = await SellNego.find({ where: { sellId: In(tradeIds) } });
    const negoInfo = negos.reduce((result, element) => {
      if (!result[element.sellId]) result[element.sellId] = [];
      result[element.sellId].push(element);
      return result;
    }, {});

    sales = await sales.reduce((result, sale) => {
      if (!('bids' in sale)) sale['bids'] = [];
      if (!('negos' in sale)) sale['negos'] = [];

      if (sale.id && sale.id in bidInfo) sale['bids'] = bidInfo[sale.id];
      if (sale.id && sale.id in negoInfo) sale['negos'] = negoInfo[sale.id];

      result.push(sale);
      return result;
    }, []);

    return sales;
  }

  async getMetadata(tokenAddr, tokenId) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    try {
      var tokenURI = await this.nodeService.getTokenURI(tokenAddr, tokenId);

      if (!tokenURI && (process.env.NODE_ENV == 'local' || process.env.NODE_ENV == 'development')) {
        if (Number(tokenId) % 2 == 0) {
          tokenURI = 'https://nft.service.cometh.io/' + (Math.floor(Math.random() * 300) + 6000000).toString();
        } else {
          tokenURI =
            'https://joyworld.azurewebsites.net/api/HttpTrigger?id=' + Math.floor(Math.random() * 300).toString();
        }
      }

      if (tokenURI) {
        if (pattern.test(tokenURI)) {
          var [name, description, image, animationUrl] = await this.parseUrl(tokenURI);
        } else {
          var [name, description, image, animationUrl] = this.parseStandard(tokenURI);
        }
        await NftItem.createQueryBuilder()
          .insert()
          .values({
            tokenAddress: tokenAddr,
            tokenId: tokenId,
            tokenUri: tokenURI,
            status: this.constant.STATUS.NFT.WITHDRAW,
          })
          .orUpdate({
            conflict_target: ['tokenAddress', 'tokenId'],
            overwrite: ['tokenUri'],
          })
          .updateEntity(false)
          .execute();

        await NftItemDesc.createQueryBuilder()
          .insert()
          .values({
            tokenAddress: tokenAddr,
            tokenUri: tokenURI,
            tokenId: tokenId,
            name: name,
            description: description,
            image: image,
            animationUrl: animationUrl,
          })
          .orUpdate({
            conflict_target: ['tokenAddress', 'tokenId'],
            overwrite: ['name', 'description', 'image', 'animationUrl'],
          })
          .updateEntity(false)
          .execute();

        return [name, description, image, animationUrl];
      } else {
        return ['', '', ''];
      }
    } catch (e) {
      this.logger.error('tokenURI error' + e.message);
    }

    return ['', '', ''];
  }

  async parseUrl(tokenURI) {
    const requestOptions = {
      method: 'GET',
      uri: tokenURI,
      json: true,
      gzip: true,
    };

    const data = await rp(requestOptions);
    var animationUrl = 'animation_url' in data ? data.animation_url : '';
    return [data.name, data.description, data.image, animationUrl];
  }

  parseStandard(tokenURI) {
    var name, description, image, animationUrl;

    const data = JSON.parse(tokenURI);

    name = data.name;
    description = data.description;
    image = data.image;
    animationUrl = 'animation_url' in data ? data.animation_url : '';

    return [name, description, image, animationUrl];
  }
}

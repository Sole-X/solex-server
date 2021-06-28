import { Service, Inject } from 'typedi';
import { getRepository, In, Between, LessThan, MoreThan, Raw, Like } from 'typeorm';
import { BigNumber } from 'bignumber.js';
import { Category } from '../entities/Category';
import { NftInfo } from '../entities/NftInfo';
import { TokenInfo } from '../entities/TokenInfo';
import { Account } from '../entities/Account';
import { NftItem } from '../entities/NftItem';

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
});

@Service('CommonService')
export class CommonService {
  methodList = ['toBN', 'addBN', 'subBN', 'mulBN', 'modBN', 'divBN', 'toMinUnit', 'toMaxUnit'];

  constructor(@Inject('constant') private constant, @Inject('currency') private currency) {}

  toBN(number) {
    const result = new BigNumber(number);

    // 초기화 시에 메소드 리스트 추가하기
    if (this.methodList) {
      for (const method of this.methodList) {
        result[method] = this[method];
      }
    }

    return result;
  }

  addBN(num1, num2) {
    if (!BigNumber.isBigNumber(num1)) {
      num1 = this.toBN(num1);
    }

    if (num2 !== undefined) {
      num2 = this.toBN(num2);
    } else {
      num2 = num1;
      num1 = this;
    }

    return this.toBN(num1.plus(num2));
  }

  subBN(num1, num2) {
    if (!BigNumber.isBigNumber(num1)) {
      num1 = this.toBN(num1);
    }

    if (num2 !== undefined) {
      num2 = this.toBN(num2);
    } else {
      num2 = num1;
      num1 = this;
    }

    return this.toBN(num1.minus(num2));
  }

  mulBN(num1, num2) {
    if (!BigNumber.isBigNumber(num1)) {
      num1 = this.toBN(num1);
    }

    if (num2 !== undefined) {
      num2 = this.toBN(num2);
    } else {
      num2 = num1;
      num1 = this;
    }

    return this.toBN(num1.multipliedBy(num2));
  }

  divBN(num1, num2) {
    // TODO : over 18
    if (!BigNumber.isBigNumber(num1)) {
      num1 = this.toBN(num1);
    }

    if (num2 !== undefined) {
      num2 = this.toBN(num2);
    } else {
      num2 = num1;
      num1 = this;
    }

    if (num1.toString() === '0' || num2.toString() === '0') {
      return this.toBN('0');
    }

    return this.toBN(num1.dividedBy(num2).toPrecision(18));
  }

  modBN(num1, num2) {
    if (!BigNumber.isBigNumber(num1)) {
      num1 = this.toBN(num1);
    }

    if (num2 !== undefined) {
      num2 = this.toBN(num2);
    } else {
      num2 = num1;
      num1 = this;
    }

    return this.toBN(num1.mod(num2));
  }

  // 자연수 > 컨트랙트 상 단위
  toMinUnit(v, d) {
    if (v !== 0 && !v) {
      return '0';
    }

    if (d === undefined) {
      d = v;
      v = this;
    }

    if (!BigNumber.isBigNumber(v)) {
      v = this.toBN(v);
    }

    if (d !== 0) {
      d = this.toBN(10).pow(d);
    }

    return this.toBN(v.multipliedBy(d)).toString();
  }

  // 컨트랙트 상 단위 > 자연수
  toMaxUnit(v, d, p = 6) {
    if (v !== 0 && !v) {
      return '0';
    }

    if (d === undefined) {
      d = v;
      v = this;
    }

    if (!BigNumber.isBigNumber(v)) {
      v = this.toBN(v);
    }

    if (d !== 0) {
      d = this.toBN(10).pow(d);
    }
    var test = this.toBN(v.dividedBy(d));

    return this.toBN(v.dividedBy(d)).toString();
  }

  dprec(str, d, force = false) {
    // 강제로 소수점 이하 d자리 출력
    if (!force && parseFloat(str) === 0) {
      return '0';
    }

    let dot = str.indexOf('.');
    if (dot === -1) dot = str.length;
    let num = str.rsubstr(0, dot),
      dec = str.substr(dot + 1);

    if (dec.length > d) {
      dec = dec.substr(0, d);
    } else {
      dec += '0'.repeat(d - dec.length);
    }

    if (d > 0) {
      num += '.' + dec;
    }

    return num;
  }

  async convertUsdPrice(tokenAddr, amount) {
    if (!tokenAddr) return 0;
    tokenAddr = tokenAddr.toLowerCase();
    if (!this.currency[tokenAddr]) return 0;
    if (!this.currency[tokenAddr].decimal || !this.currency[tokenAddr].price) return 0;

    amount = this.toMaxUnit(Number(amount), Number(this.currency[tokenAddr].decimal));
    var currencyPrice = Number(this.currency[tokenAddr].price);
    amount = (amount * currencyPrice).toFixed(2);
    return amount ? amount : 0;
  }

  convertMinUnit(tokenAddr, amount) {
    var decimal = 18;
    if (tokenAddr != '' && this.currency[tokenAddr]) {
      tokenAddr = tokenAddr.toLowerCase();
      decimal = this.currency[tokenAddr].decimal ? this.currency[tokenAddr].decimal : 18;
    }
    return this.toMinUnit(amount, Number(decimal));
  }

  convertMaxUnit(tokenAddr, amount) {
    var decimal = 18;
    if (tokenAddr != '' && this.currency[tokenAddr]) {
      tokenAddr = tokenAddr.toLowerCase();
      decimal = this.currency[tokenAddr].decimal ? this.currency[tokenAddr].decimal : 18;
    }
    return this.toMaxUnit(amount, Number(decimal));
  }

  async convertStatusStr(items, type, target = 'STATUS', columnName = 'status') {
    for (let i = 0; i < items.length; i++) {
      const key = Object.keys(this.constant[target][type]).find(
        (key) => this.constant[target][type][key] === items[i][columnName],
      );
      items[i][target.toLowerCase() + 'Str'] = key;
    }
    return items;
  }

  async getWeekNum() {
    const today: any = new Date();
    const firstDayOfYear: any = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async makeOrderFromReq(_order) {
    var order: any = { createdAt: 'DESC' };
    //POP,NEW,OLD,PRICE,EXPIRE
    if (order) {
      var sort = _order.indexOf('~') > -1 ? 'ASC' : 'DESC';
      _order = _order.replace('~', '');

      switch (_order) {
        case 'POP':
          order = { liked: sort };
          break;
        case 'DATE':
          order = { updatedAt: sort };
          break;
        case 'PRICE':
          order = { usdPrice: sort };
          break;
        case 'EXPIRE':
          order = { status: 'ASC', endTime: sort };
          break;
        case 'PARTICIPANT':
          order = { participant: sort };
          break;
      }
    } else {
      order = { updatedAt: 'DESC' };
    }

    return order;
  }

  async makeWhereFromReq(params) {
    var where = {};
    var tokenAddrArr = [];
    var tokenIdArr = [];
    var nowCurrency = '';

    if ('ownerAddress' in params && params.ownerAddress) where['ownerAddress'] = params.ownerAddress;
    if ('accountAddress' in params && params.accountAddress) where['accountAddress'] = params.accountAddress;

    if ('id' in params && params.id) where['id'] = params.id;

    if ('search' in params && params.search) where['tokenName'] = Like('%' + params.search + '%');

    if ('eventType' in params && params.eventType) {
      const eventParams = params.eventType.split(',');
      const eventTypes = eventParams.map((item) => this.constant.TYPE.EVENT[item]);
      where['eventType'] = In(eventTypes);
    }

    if ('currency' in params && params.currency) {
      const currencyArr = params.currency.split(',');
      where['currency'] = In(currencyArr);
      nowCurrency = currencyArr[0];
    }

    if ('price' in params && params.price) {
      const priceArr = params.price.replace(/(\s*)/g, '').split(',');
      var priceName = 'priceName' in params && params.priceName ? params.priceName : 'price';
      where[priceName] = Raw((alias) => {
        var sql = '( ';
        for (let i = 0; i < priceArr.length; i++) {
          //포함 검색
          if (priceArr[i].indexOf('-') > -1) {
            const price = priceArr[i].split('-');
            sql +=
              ' ( ' +
              this.convertMinUnit(nowCurrency, price[0]) +
              ' <= ' +
              alias +
              ' and ' +
              this.convertMinUnit(nowCurrency, price[1]) +
              ' >= ' +
              alias +
              ') OR';
          } else if (priceArr[i].indexOf('~') > -1) {
            const price = priceArr[i].replace('~', '');
            sql += ' ( ' + this.convertMinUnit(nowCurrency, price) + ' <= ' + alias + ') OR';
          } else {
            sql += ' ( ' + this.convertMinUnit(nowCurrency, priceArr[i]) + ' = ' + alias + ') OR';
          }
        }
        sql = sql.slice(0, sql.length - 2);
        sql += ')';
        return sql;
      });
    }

    if ('category' in params && params.category) {
      const categoryAddr = await Category.getTokenAddrs(params.category);
      tokenAddrArr = tokenAddrArr.concat(categoryAddr);
    }

    if ('collection' in params && params.collection) tokenAddrArr = tokenAddrArr.concat(params.collection.split(','));

    if ('platform' in params && params.platform) {
      var platformArr = [];
      if (params.platform.indexOf('ETH') > -1) platformArr.push(1);
      if (params.platform.indexOf('KLAY') > -1) platformArr.push(2);
      if (platformArr.length > 0) where['platform'] = In(platformArr);
    }

    if ('platformByInfo' in params && params.platformByInfo) {
      const nftInfos = await NftInfo.find({
        select: ['tokenAddress'],
        where: { platform: In([params.platformByInfo.split(',')]) },
      });
      const tokenInfos = await TokenInfo.find({
        select: ['tokenAddress'],
        where: { platform: In([params.platformByInfo.split(',')]) },
      });
      tokenAddrArr = tokenAddrArr.concat(nftInfos.map((item) => item.tokenAddress));
      tokenAddrArr = tokenAddrArr.concat(tokenInfos.map((item) => item.tokenAddress));
    }

    if ('publisher' in params && params.publisher) {
      const nftItems = await NftItem.find({
        select: ['tokenAddress', 'tokenId'],
        where: { publisher: Like('%' + params.publisher + '%') },
      });
      var pubTokenIds = nftItems.map((item) => item.tokenId);

      tokenAddrArr = tokenAddrArr.concat(nftItems.map((item) => item.tokenAddress));
      tokenIdArr = tokenIdArr.concat(nftItems.map((item) => item.tokenId));
      if (pubTokenIds.length < 1) tokenAddrArr = ['nothing'];
    }

    if (tokenAddrArr.length > 0) where['tokenAddress'] = In(tokenAddrArr);
    if (tokenIdArr.length > 0) where['tokenId'] = In(tokenIdArr);

    if ('status' in params && params.status) where['status'] = In(params.status.split(','));

    return where;
  }

  constantToStr(datas, target) {
    datas = datas.reduce((result, data: any) => {
      if ('status' in datas && datas.status) {
        const status = Object.keys(this.constant.STATUS[target]).find(
          (key) => this.constant.STATUS[target][key] === data.status,
        );
        data['statusStr'] = status;
      }
      if ('type' in datas && datas.status) {
        const type = Object.keys(this.constant.TYPE[target]).find(
          (key) => this.constant.TYPE[target][key] === data.type,
        );
        data['typeStr'] = type;
      }
      if ('eventType' in datas && datas.status) {
        const eventType = Object.keys(this.constant.TYPE.EVENT).find(
          (key) => this.constant.TYPE.EVENT[key] === data.eventType,
        );
        data['eventTypeStr'] = eventType;
      }

      result.push(data);

      return result;
    }, []);

    return datas;
  }

  addCallback(id, func, queue: any) {
    var strKey = String(id); //키 타입 string으로 고정
    let bulkArr = queue.get(strKey);
    bulkArr.push(func);
    queue.set(strKey, bulkArr);
  }

  //accountAddress 배열에 관련 계정 데이터 bind
  async bindAccountDesc(datas: any[], keys = []) {
    var accountIds = datas.reduce(function (result, data) {
      if (data.accountAddress && 'accountAddress' in data) result.push(data.accountAddress);
      if (data.fromAddress && 'fromAddress' in data) result.push(data.fromAddress);
      if (data.toAddress && 'toAddress' in data) result.push(data.toAddress);
      return result;
    }, []);
    accountIds = Array.from(new Set(accountIds));

    const accountArr = await Account.find({
      select: ['accountAddress', 'username', 'profile', 'display'],
      where: { accountAddress: In(accountIds) },
    });

    const accounts = accountArr.reduce(function (result, data) {
      result[data.accountAddress] = data;
      return result;
    }, {});

    datas = await datas.reduce(function (result, data) {
      if (data.accountAddress && data.accountAddress in accounts)
        data['accountAddressDesc'] = accounts[data.accountAddress];
      if (data.fromAddress && data.fromAddress in accounts) data['fromAddressDesc'] = accounts[data.fromAddress];
      if (data.toAddress && data.toAddress in accounts) data['toAddressDesc'] = accounts[data.toAddress];
      result.push(data);
      return result;
    }, []);

    return datas;
  }
}

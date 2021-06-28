import { Service, Inject } from 'typedi';
import { humanReadableStringToHexAddress, isAddress } from 'caver-js/packages/caver-utils/';
import { TokenInfo } from '../entities/TokenInfo';
import { Variable } from '../entities/Variable';
import { StakeReward } from '../entities/StakeReward';
import { Stake } from '../entities/Stake';
const ethjs = require('ethereumjs-util');
const EthContract = require('web3-eth-contract');

@Service('NodeService')
export class NodeService {
  kip7;
  kip17;
  erc20;
  stakeContract;
  reserveContract;
  reserveFeeDenom = 100;
  reserveFeeNumber = 5;

  constructor(
    @Inject('logger') private logger,
    @Inject('caverClient') private caverClient,
    @Inject('ethClient') private ethClient,
    @Inject('contractAddress') private contractAddress,
    @Inject('AbiService') private abiService,
    @Inject('CommonService') private commonService,
    @Inject('RedisService') private redisService,
  ) {
    const { KIP7, KIP17, Contract } = this.caverClient.klay;
    const EthContract = this.ethClient.eth.Contract;

    this.kip7 = new KIP7();
    this.kip17 = new KIP17();
    this.stakeContract = new Contract(this.abiService.getAbiMap('stake-abi'));
    this.stakeContract.options.address = this.contractAddress['StakeContract'];
    this.reserveContract = new Contract(this.abiService.getAbiMap('reserve-abi'));
    this.reserveContract.options.address = this.contractAddress['ReserveContract'];
    this.erc20 = new EthContract(this.abiService.getAbiMap('kip7-abi'));
  }

  async getTokenURI(address, tokenId) {
    this.kip17.options.address = address;
    try {
      if (this.kip17.supportsInterface('0x80ac58cd')) return await this.kip17.tokenURI(tokenId);
    } catch (e) {
      this.logger.error('Get TokenURI error' + e.message);
      return '';
    }
  }

  async getKlayBalance(accountAddr) {
    return await this.caverClient.klay.getBalance(accountAddr);
  }

  async getTokenInfo(address, isNft = true) {
    var kip = isNft ? this.kip17 : this.kip7;
    kip.options.address = address;
    try {
      const name = await kip.name();
      const symbol = await kip.symbol();

      if (isNft) {
        return [name, symbol, ''];
      } else {
        const decimal = await kip.decimals();
        return [name, symbol, decimal];
      }
    } catch (e) {
      return ['', '', '0'];
    }
  }

  getTransactionReceipt(hash) {
    return this.ethClient.eth.getTransactionReceipt(hash);
  }

  getBlockNumber(type = 'caver') {
    if (type == 'eth') return this.ethClient.eth.getBlockNumber();
    return this.caverClient.klay.getBlockNumber();
  }

  getBlockWithConsensusInfo(blockNumber, type = 'caver') {
    if (type == 'eth') return this.ethClient.eth.getBlock(blockNumber, true);
    return this.caverClient.klay.getBlockWithConsensusInfo(blockNumber, true);
  }

  getHexToNumberString(number) {
    return this.caverClient.utils.hexToNumberString(number);
  }

  getHexToNumber(hexstr) {
    return this.caverClient.utils.hexToNumber(hexstr);
  }

  getHashMessage(msg) {
    return this.caverClient.utils.hashMessage(msg);
  }

  public static isAddress(address: string): boolean {
    return isAddress(address);
  }

  public static isHraWithoutKlaytnSuffix(address: string): boolean {
    return /^[A-Za-z][0-9A-Za-z]{0,12}$/.test(address);
  }

  public static isHraWithKlaytnSuffix(address: string) {
    return /^[A-Za-z][0-9A-Za-z]{4,12}\.klaytn$/.test(address);
  }

  public static hraToAddress(hra: string): string {
    return humanReadableStringToHexAddress(hra);
  }

  async getFeeInfo(blockNumber = null) {
    this.reserveContract.options.address = this.contractAddress['ReserveContract'];

    var feeDenom = await this.reserveContract.methods
      .feeDenom()
      .call(null, blockNumber)
      .catch(() => {
        return 100;
      });
    var feeNumer = await this.reserveContract.methods
      .feeNumer()
      .call(null, blockNumber)
      .catch(() => {
        return 5;
      });

    return { denom: feeDenom, numer: feeNumer };
  }

  async setFeeInfo(blockNo) {
    const feeInfo = await this.getFeeInfo(blockNo);
    this.reserveFeeDenom = feeInfo.denom;
    this.reserveFeeNumber = feeInfo.numer;
  }

  async getFee(amount) {
    return (amount * this.reserveFeeNumber) / this.reserveFeeDenom;
  }

  //차감된 금액에서 원래 금액 알아오기
  async getPaidAmount(amount) {
    amount = this.commonService.mulBN(amount, this.reserveFeeDenom);
    amount = this.commonService.divBN(amount, this.reserveFeeDenom - this.reserveFeeNumber);
    return amount.toString();
  }

  async getRewardInfo(to) {
    var result = {};
    var tokenInfos = await TokenInfo.find({ where: { reward: 1 } });
    var IndexPrecision = 1000000000000000000;
    var tsVal = await Variable.findOne({ where: { key: 'totalStaking' } });
    var totalStaking = Number(tsVal.value);

    const accountStake = await Stake.findOne(to);
    const stakingBalance = accountStake ? Number(accountStake.amount) : 0;

    if (!totalStaking) totalStaking = 0;

    for (let i = 0; i < tokenInfos.length; i++) {
      const tokenAddr = tokenInfos[i].tokenAddress;
      var reward = Number(tokenInfos[i].stakeIndex);
      if (reward >= 0) {
        var newReward = Number(tokenInfos[i].feeReceiver);

        if (newReward > 0 && totalStaking > 0) {
          var newIndex = (newReward * IndexPrecision) / totalStaking;
          reward += newIndex;
        }

        const stakeReward = await StakeReward.findOne({
          where: { accountAddress: to, currency: tokenAddr },
        });
        var userInfo = stakeReward ? Number(stakeReward.userIndex) : 0;

        if (reward > userInfo) {
          var amount = this.commonService.toMaxUnit((stakingBalance * (reward - userInfo)) / IndexPrecision, 18);
          const dot = amount.indexOf('.');
          amount = amount.toString().substring(0, dot + 4);

          result[tokenAddr.toLowerCase()] = amount;
        } else {
          result[tokenAddr.toLowerCase()] = 0;
        }
      }
    }

    return result;
  }

  async getTrixTotalSupply() {
    var totalSupply = await this.redisService.get('trixTotalSuply');
    if (process.env.NODE_ENV != 'live') return '9999982296000000000000000000';
    if (totalSupply > 0 || false) {
      return totalSupply;
    } else {
      this.erc20.options.address = this.contractAddress['TRIX'];
      totalSupply = await this.erc20.methods.totalSupply().call().catch(console.log);

      if (totalSupply > 0) {
        this.redisService.set('trixTotalSuply', totalSupply);
        this.redisService.expire('trixTotalSuply', 60);
      } else {
        return '9999982296000000000000000000';
      }
    }
  }

  async checkSignAddress(address, hashType, msg, signHash) {
    const msgBuffer = ethjs.toBuffer(msg);

    var msgHash;

    if (hashType == 1) {
      msgHash = ethjs.hashPersonalMessage(msgBuffer);
    } else if (hashType == 2) {
      msgHash = ethjs.toBuffer(this.getHashMessage(msgBuffer));
    }

    signHash = signHash.replace(/['"]+/g, '');

    const signatureBuffer = ethjs.toBuffer(signHash);

    const signatureParams = ethjs.fromRpcSig(signatureBuffer);

    const publicKey = ethjs.ecrecover(msgHash, signatureParams.v, signatureParams.r, signatureParams.s);

    const addressBuffer = ethjs.publicToAddress(publicKey);
    const signAddress = ethjs.bufferToHex(addressBuffer);

    //if(address != signAddress) return [false, null, null, null, null];

    return [true, signAddress, signatureParams.v, signatureParams.r, signatureParams.s];
  }
}

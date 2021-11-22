import { Service, Inject } from 'typedi';
import { AbiService } from './AbiService';
import { SolexTx } from '../entities/SolexTx';

const Queue = require('bull');
const ethjs = require('ethereumjs-util');
const abiCoder = require('web3-eth-abi');
const CaverExtKAS = require('caver-js-ext-kas');

@Service('KasService')
export class KasService {
  constructor(
    @Inject('AbiService') private abiService: AbiService,
    @Inject('logger') private logger,
    @Inject('NodeService') private nodeService,
    @Inject('CommonService') private commonService,
    @Inject('contractAddress') private contractAddress,
  ) {}

  async makeKasAccount(chainId) {
    const caver = new CaverExtKAS(chainId, process.env.KAS_KEY1, process.env.KAS_KEY2)

    return await caver.kas.wallet.createAccount();
  }

  async getKasAccounts(chainId) {
    const caver = new CaverExtKAS(chainId, process.env.KAS_KEY1, process.env.KAS_KEY2);

    return await caver.kas.wallet.getAccountList();
  }

  async executeTx(hash, toAddress, functionEncoded, address, v, r, s, hashType, bridge = 'false') {

    var chainFee = 0;

    try {
      if (bridge == 'token' || bridge == 'nft') {
        chainFee = await this.nodeService.getBridgeFee();
      }
      const sendKlay = (bridge != 'false') ? chainFee : 0;
      const executeAbi = this.abiService.getFunctionAbi('execute-abi', 'executeFunction');

      var encoded = abiCoder.encodeFunctionCall(executeAbi, [
        toAddress,
        sendKlay,
        functionEncoded,
        address,
        v,
        ethjs.bufferToHex(r),
        ethjs.bufferToHex(s),
        hashType
      ]);

      const tx = {
        from: this.contractAddress['KasAccount'],
        to: this.contractAddress['ExecutorContract'],
        value: sendKlay,
        input: encoded,
        gas: 500000,
        submit: true
      }


      const hashChk = await SolexTx.findOne({ hashId: hash });

      if (hashChk) {
        throw Error("used hash");
      } else {
        await SolexTx.insert({ hashId: hash });
      }

      var myRateLimitedQueue = new Queue('kasQueue', {
        limiter: {
          max: 50,
          duration: 1000,
        },
        redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST }
      });

      await myRateLimitedQueue.add({ hash, tx, bridge });

    } catch (e) {

      this.logger.error("kas error", e.message);
    }
  }
}

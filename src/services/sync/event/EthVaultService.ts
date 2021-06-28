import { Service, Inject } from 'typedi';
import { Activity } from '../../../entities/Activity';
import { TokenInfo } from '../../../entities/TokenInfo';
import { NftInfo } from '../../../entities/NftInfo';

@Service('EthVaultService')
export class EthVaultService {
  eventMap;

  constructor(
    @Inject('logger') private logger,
    @Inject('BulkService') private bulkService,
    @Inject('AbiService') private abiService,
    @Inject('constant') private constant,
    @Inject('contractAddress') private contractAddress,
    @Inject('SocketService') private socketService,
  ) {
    this.eventMap = this.abiService.getEventMap('ethvault-abi');
  }

  public async handler(blockNo, topicHash, log, blockDate, callbackQueue) {
    const eventInfo = this.eventMap.get(topicHash) || '';

    const acceptEvent = ['Deposit', 'DepositNFT', 'Withdraw', 'WithdrawNFT'];

    if (!acceptEvent.includes(eventInfo.name)) return;

    const decodeParams = await this.abiService.getDecodeLog(eventInfo['inputs'], log);

    const data = decodeParams.data
      ? await this.abiService.getDecodeParameters(
          [
            {
              name: 'accountAddress',
              type: 'address',
            },
            {
              name: 'hash',
              type: 'bytes32',
            },
          ],
          decodeParams.data,
        )
      : ['', ''];

    switch (eventInfo.name) {
      case 'Deposit':
        return await this.deposit(blockNo, decodeParams, log.transactionHash, blockDate, data, callbackQueue);
        break;
      case 'DepositNFT':
        return await this.depositNFT(blockNo, decodeParams, log.transactionHash, blockDate, data, callbackQueue);
        break;
      case 'Withdraw':
        return await this.withdraw(blockNo, decodeParams, log.transactionHash, blockDate, data, callbackQueue);
        break;
      case 'WithdrawNFT':
        return await this.withdrawNFT(blockNo, decodeParams, log.transactionHash, blockDate, data, callbackQueue);
        break;
    }
  }

  //event Deposit(string toChain, address fromAddr, bytes toAddr, address token, uint8 decimal, uint amount, uint depositId, bytes data);
  async deposit(blockNo, params, txHash, blockDate, data, callbackQueue) {
    //solex reserve contract check
    if (!params.toAddr) return;
    if (params.toAddr.toLowerCase() != this.contractAddress['ReserveContract']) return;

    const toOther = params.fromAddr != data[0] ? true : false;
    const activity = await Activity.findOne({
      tradeId: data[1],
      accountAddress: params.fromAddr,
    });
    const tokenInfo = await TokenInfo.findOne({
      where: { ethAddress: params.token },
    });
    const tokenAddr = tokenInfo ? tokenInfo.tokenAddress : params.token;

    //다른 주소로 전송시 해당 주소 activity 추가
    if (toOther) {
      const otherActivity = await Activity.findOne({
        tradeId: data[1],
        accountAddress: data[0],
      });
      if (!otherActivity) {
        await this.bulkService.addData(blockNo, {
          tableName: 'activity',
          data: {
            eventType: this.constant.TYPE.EVENT.TOKEN,
            status: this.constant.STATUS.TOKEN.VAULT,
            tokenAddress: tokenAddr,
            tradeId: data[1],
            txHash: txHash,
            amount: params.amount,
            accountAddress: data[0],
            fromAddress: params.fromAddr,
            toAddress: data[0],
            bridgeId: params.depositId,
            createdAt: blockDate,
            updatedAt: blockDate,
          },
          queryType: 'insert',
        });
      }
    }

    //activity 데이터가 없을때만
    if (!activity) {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          eventType: this.constant.TYPE.EVENT.TOKEN,
          status: this.constant.STATUS.TOKEN.VAULT,
          tokenAddress: tokenAddr,
          tradeId: data[1],
          txHash: txHash,
          amount: params.amount,
          accountAddress: params.fromAddr,
          fromAddress: params.fromAddr,
          toAddress: data[0],
          bridgeId: params.depositId,
          createdAt: blockDate,
          updatedAt: blockDate,
        },
        queryType: 'insert',
      });
    }

    await this.bulkService.addData(blockNo, {
      tableName: 'bridge_tx',
      data: {
        platform: 'ETH',
        hashId: data[1],
        tokenAddress: tokenAddr,
        depositId: params.depositId,
        amount: params.amount,
        blockNumber: blockNo,
        txHash: txHash,
        fromAddress: params.fromAddr,
        toAddress: data[0],
        type: this.constant.STATUS.TOKEN.VAULT,
        status: 1,
        createdAt: blockDate,
      },
      queryType: 'insert',
    });
    this.addCallback(
      blockNo,
      () => {
        this.socketService.bridge(data[1], params.depositId, txHash, 'vault');
      },
      callbackQueue,
    );

    return;
  }

  //event DepositNFT(string toChain, address fromAddr, bytes toAddr, address token, uint tokenId, uint amount, uint depositId, bytes data);
  async depositNFT(blockNo, params, txHash, blockDate, data, callbackQueue) {
    if (!params.toAddr) return;
    if (params.toAddr.toLowerCase() != this.contractAddress['ReserveContract']) return;

    const toOther = params.fromAddr != data[0] ? true : false;
    const activity = await Activity.findOne({
      tradeId: data[1],
      accountAddress: params.fromAddr,
      bridgeId: params.depositId,
    });
    const tokenInfo = await NftInfo.findOne({
      where: { ethAddress: params.token },
    });
    const tokenAddr = tokenInfo ? tokenInfo.ethAddress : params.token;

    //다른 주소로 전송시 해당 주소 activity 추가
    if (toOther) {
      const otherActivity = await Activity.findOne({
        tradeId: data[1],
        accountAddress: data[0],
      });
      if (!otherActivity) {
        await this.bulkService.addData(blockNo, {
          tableName: 'activity',
          data: {
            eventType: this.constant.TYPE.EVENT.NFT,
            status: this.constant.STATUS.NFT.VAULT,
            tokenAddress: tokenAddr,
            tradeId: data[1],
            txHash: txHash,
            tokenId: params.tokenId,
            accountAddress: data[0],
            fromAddress: params.fromAddr,
            toAddress: data[0],
            bridgeId: params.depositId,
            createdAt: blockDate,
            updatedAt: blockDate,
          },
          queryType: 'insert',
        });
      }
    }

    //activity 데이터가 없을때만
    if (!activity) {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          eventType: this.constant.TYPE.EVENT.NFT,
          status: this.constant.STATUS.NFT.VAULT,
          tokenAddress: tokenAddr,
          tradeId: data[1],
          txHash: txHash,
          tokenId: params.tokenId,
          accountAddress: params.fromAddr,
          fromAddress: params.fromAddr,
          toAddress: data[0],
          bridgeId: params.depositId,
          createdAt: blockDate,
          updatedAt: blockDate,
        },
        queryType: 'insert',
      });
    }

    await this.bulkService.addData(blockNo, {
      tableName: 'bridge_tx',
      data: {
        platform: 'ETH',
        hashId: data[1],
        tokenAddress: tokenAddr,
        depositId: params.depositId,
        tokenId: params.tokenId,
        blockNumber: blockNo,
        txHash: txHash,
        fromAddress: params.fromAddr,
        toAddress: data[0],
        type: this.constant.STATUS.TOKEN.VAULT,
        status: 1,
        createdAt: blockDate,
      },
      queryType: 'insert',
    });
    this.addCallback(
      blockNo,
      () => {
        this.socketService.bridge(data[1], params.depositId, txHash, 'vault');
      },
      callbackQueue,
    );

    return;
  }

  //event Withdraw(string fromChain, bytes fromAddr, bytes toAddr, bytes token, bytes32[] bytes32s, uint[] uints, bytes data);
  async withdraw(blockNo, params, txHash, blockDate, data, callbackQueue) {
    if (!params.fromAddr) return;
    if (params.fromAddr.toLowerCase() != this.contractAddress['ReserveContract']) return;

    const activity = await Activity.findOne({
      where: { tradeId: data[1], bridgeId: params.uints[2] },
    });
    const tokenInfo = await TokenInfo.findOne({
      where: { ethAddress: params.token },
    });
    const tokenAddr = tokenInfo ? tokenInfo.tokenAddress : params.token;

    if (activity) {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          txHash: txHash,
          status: this.constant.STATUS.TOKEN.WITHDRAW,
          updatedAt: blockDate,
        },
        where: {
          tradeId: data[1],
          bridgeId: params.uints[2],
        },
        queryType: 'update',
      });
    } else {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          eventType: this.constant.TYPE.EVENT.TOKEN,
          status: this.constant.STATUS.TOKEN.WITHDRAW,
          tokenAddress: tokenAddr,
          tradeId: data[1],
          txHash: txHash,
          amount: params.uints[0],
          accountAddress: data[0],
          bridgeId: params.uints[2],
          createdAt: blockDate,
          updatedAt: blockDate,
        },
        queryType: 'insert',
      });
    }

    await this.bulkService.addData(blockNo, {
      tableName: 'bridge_tx',
      data: {
        platform: 'ETH',
        hashId: data[1],
        tokenAddress: params.token,
        amount: params.uints[0],
        depositId: params.uints[2],
        blockNumber: blockNo,
        txHash: txHash,
        fromAddress: data[0],
        toAddress: params.toAddr,
        type: this.constant.STATUS.TOKEN.SEND,
        status: 1,
        createdAt: blockDate,
      },
      queryType: 'insert',
    });
    this.addCallback(
      blockNo,
      () => {
        this.socketService.bridge(data[1], params.uints[2], txHash, 'send');
      },
      callbackQueue,
    );
  }

  //event WithdrawNFT(string fromChain, bytes fromAddr, bytes toAddr, bytes token, bytes32[] bytes32s, uint[] uints, bytes data);
  async withdrawNFT(blockNo, params, txHash, blockDate, data, callbackQueue) {
    if (!params.fromAddr) return;
    if (params.fromAddr.toLowerCase() != this.contractAddress['ReserveContract']) return;

    const activity = await Activity.findOne({
      where: { tradeId: data[1], bridgeId: params.uints[2] },
    });
    const tokenInfo = await NftInfo.findOne({
      where: { ethAddress: params.token },
    });
    const tokenAddr = tokenInfo ? tokenInfo.tokenAddress : params.token;

    if (activity) {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          txHash: txHash,
          status: this.constant.STATUS.NFT.WITHDRAW,
          updatedAt: blockDate,
        },
        where: {
          tradeId: data['1'],
          bridgeId: params.uints[2],
        },
        queryType: 'update',
      });
    } else {
      await this.bulkService.addData(blockNo, {
        tableName: 'activity',
        data: {
          eventType: this.constant.TYPE.EVENT.NFT,
          status: this.constant.STATUS.NFT.WITHDRAW,
          tokenAddress: tokenAddr,
          tradeId: data['1'],
          txHash: txHash,
          tokenId: params.uints[1],
          accountAddress: data['0'],
          bridgeId: params.uints[2],
          createdAt: blockDate,
          updatedAt: blockDate,
        },
        queryType: 'insert',
      });
    }

    await this.bulkService.addData(blockNo, {
      tableName: 'bridge_tx',
      data: {
        platform: 'ETH',
        hashId: data[1],
        tokenAddress: params.token,
        tokenId: params.uints[1],
        blockNumber: blockNo,
        depositId: params.uints[2],
        txHash: txHash,
        fromAddress: data[0],
        toAddress: params.toAddr,
        type: this.constant.STATUS.TOKEN.SEND,
        status: 1,
        createdAt: blockDate,
      },
      queryType: 'insert',
    });
    this.addCallback(
      blockNo,
      () => {
        this.socketService.bridge(data[1], params.uints[2], txHash, 'send');
      },
      callbackQueue,
    );
  }

  public addCallback(id, func, queue: any) {
    var strKey = String(id); //키 타입 string으로 고정

    let bulkArr = queue.get(strKey);
    bulkArr.push(func);
    queue.set(strKey, bulkArr);
  }
}

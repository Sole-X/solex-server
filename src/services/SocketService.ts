import { Service, Inject } from 'typedi';
import { getRepository } from 'typeorm';
import { SolexTx } from '../entities/SolexTx';
import { BridgeTx } from '../entities/BridgeTx';

@Service('SocketService')
export class SocketService {
  private io = require('socket.io-emitter')({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  });

  constructor(@Inject('constant') private constant, @Inject('logger') private logger) {}

  async pendingTx(hash, tx, result) {
    try {
      if (result == 'success') {
        var status = this.constant.STATUS.TX.PENDING;
      } else {
        var status = this.constant.STATUS.TX.FAIL;
      }
      await getRepository(SolexTx).update({ hashId: hash }, { txHash: tx, status: status });
      this.io.to(hash).emit('pending', { hash: hash, txHash: tx, status: status });
    } catch (e) {
      console.log('err', e.message);
    }
  }

  async resultTx(tx, result) {
    const solexTx = await SolexTx.findOne({ txHash: tx });

    if (solexTx) {
      const hash = solexTx.hashId;
      if (result) {
        var status = this.constant.STATUS.TX.DONE;
      } else {
        var status = this.constant.STATUS.TX.FAIL;
      }
      await getRepository(SolexTx).update({ hashId: hash }, { txHash: tx, status: status });
      this.io.to(hash).emit('result', { hash: hash, txHash: tx, result: result });
    }
  }

  //hash는 중복의 오류가 있어 hash, depositId로 묶어서 사용
  async bridge(hash, depositId, txHash, type) {
    var result: any = {};
    if (type == 'vault' || type == 'mint') {
      result = {
        depositId: depositId,
        vault: { txHash: '', status: '' },
        mint: { txHash: '', status: '' },
      };
    } else if (type == 'burn' || type == 'send') {
      result = {
        depositId: depositId,
        burn: { txHash: '', status: '' },
        send: { txHash: '', status: '' },
      };
    }

    const bridgeTx = await BridgeTx.find({
      where: {
        hashId: hash,
        depositId: depositId,
      },
    });

    result[type]['txHash'] = txHash;
    result[type]['status'] = 1;
    if (type == 'vault') {
      var mintIndex = bridgeTx
        .map(function (item) {
          return item.type;
        })
        .indexOf(this.constant.STATUS.TOKEN.MINT);
      if (mintIndex > -1) {
        result.mint['txHash'] = bridgeTx[mintIndex].txHash;
        result.mint['status'] = bridgeTx[mintIndex].status;
      }
    } else if (type == 'mint') {
      var vaultIndex = bridgeTx
        .map(function (item) {
          return item.type;
        })
        .indexOf(this.constant.STATUS.TOKEN.VAULT);
      if (vaultIndex > -1) {
        result.vault['txHash'] = bridgeTx[vaultIndex].txHash;
        result.vault['status'] = bridgeTx[vaultIndex].status;
      }
    } else if (type == 'burn') {
      var sendIndex = bridgeTx
        .map(function (item) {
          return item.type;
        })
        .indexOf(this.constant.STATUS.TOKEN.SEND);
      if (sendIndex > -1) {
        result.send['txHash'] = bridgeTx[sendIndex].txHash;
        result.send['status'] = bridgeTx[sendIndex].status;
      }
    } else if (type == 'send') {
      var burnIndex = bridgeTx
        .map(function (item) {
          return item.type;
        })
        .indexOf(this.constant.STATUS.TOKEN.BURN);
      if (burnIndex > -1) {
        result.burn['txHash'] = bridgeTx[burnIndex].txHash;
        result.burn['status'] = bridgeTx[burnIndex].status;
      }
    }

    this.io.to(hash).emit('bridge', result);
  }
}

const Queue = require('bull');
import { Container } from 'typedi';

//KAS

export default () => {
  const logger: any = Container.get('logger');
  const caver: any = Container.get('kasCaver');

  var myRateLimitedQueue = new Queue('kasQueue', {
    limiter: {
      max: 50,
      duration: 1000,
    },
    removeOnComplete: true,
    redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST },
  });

  myRateLimitedQueue.process(async function (job, done) {
    var tx = job.data.tx;
    var hash = job.data.hash;
    var bridge = job.data.bridge;

    const socket: any = Container.get('SocketService');

    try {
      const result = await caver.kas.wallet.requestSmartContractExecution(tx);
      await socket.pendingTx(hash, result.transactionHash, 'success');

      done(null, result.transactionHash);
    } catch (e) {
      await socket.pendingTx(hash, '', 'fail');
      logger.error('err' + e.message);
      done(new Error(e.message));
    }
  });

  myRateLimitedQueue.on('completed', async (job, result) => {
    job.remove();
  });

  return myRateLimitedQueue;
};

import { Container, Service, Inject } from 'typedi';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Account } from '../entities/Account';
import { KasService } from '../services/KasService';
import { AbiService } from '../services/AbiService';
import { getRepository } from 'typeorm';

const ethjs = require('ethereumjs-util');

@Service()
export class AuthService {
  constructor(@Inject('logger') private logger) {}

  public async SignIn(addr, msg, signHash, signTime): Promise<{ userRecord: Account; token: string }> {
    const msgBuffer = ethjs.toBuffer(ethjs.fromAscii(msg));

    const msgHash = ethjs.hashPersonalMessage(msgBuffer);

    signHash = signHash.replace(/['"]+/g, '');

    const signatureBuffer = ethjs.toBuffer(signHash);

    const signatureParams = ethjs.fromRpcSig(signatureBuffer);

    const publicKey = ethjs.ecrecover(
      msgHash,

      signatureParams.v,

      signatureParams.r,

      signatureParams.s,
    );

    const addressBuffer = ethjs.publicToAddress(publicKey);

    const address = ethjs.bufferToHex(addressBuffer);

    if (address == addr) {
      var userRecord = await Account.findOne({ accountAddress: address });

      if (!userRecord) {
        var nickname = 'user' + address.replace('0x', '').substring(0, 10);
        //userRecord = await Account.create({accountAddress:address,nickname:nickname,loginTime:signTime});
      } else {
        userRecord.loginTime = signTime;
      }

      const token = this.generateToken(userRecord, signTime);

      Reflect.deleteProperty(userRecord, 'createdAt');
      Reflect.deleteProperty(userRecord, 'At');

      return { userRecord, token };
    } else {
      throw new Error('Invalid Sign');
    }
  }

  private generateToken(user, signTime) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    this.logger.silly(`Sign JWT for userId: ${user._id}`);
    return jwt.sign(
      {
        iss: 'solex',
        sub: 'auth',
        iat: Number(signTime),
        role: user.role,
        name: user.name,
        exp: exp.getTime() / 1000,
        _addr: user.accountAddress, // We are gonna use this in the middleware 'isAuth'
      },
      process.env.JWT_SECRET,
    );
  }
}

import { Container } from 'typedi';
import { Logger } from 'winston';
import { KasService } from '../services/KasService';
import { AuthService } from '../services/AuthService';

const ethjs = require('ethereumjs-util');
const contractAddress = require('../resources/' + process.env.NODE_ENV + '/contract-address.json');

exports.verify = async function (req, res, next) {
  try {
    const user = '';
    const token = '';
    //await this.authService.SignUp(req.body);
    return res.status(201).json({ user, token });
  } catch (e) {
    return next(e);
  }
};

//사용자 서명 메시지 생성
exports.login = async function (req, res, next) {
  const authService: any = Container.get(AuthService);

  var addr = req.body.from; //id로 쓰일 random hash
  var msg = req.body.msg;
  var signHash = req.body.signHash; //message에 서명한뒤 나온 hash
  var signTime = req.body.signTime;

  try {
    const { userRecord, token } = await authService.SignIn(addr, msg, signHash, signTime);
    return res.json({ userRecord, token }).status(200);
  } catch (e) {
    return next(e);
  }
};

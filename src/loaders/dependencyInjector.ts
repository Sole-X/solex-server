import LoggerInstance from './logger';
import constant from '../config/constant';

import { Container } from 'typedi';
import { AbiService } from '../services/AbiService'
import { RedisService } from '../services/RedisService'
import { KasService } from '../services/KasService'
import { NftService } from '../services/NftService'
import { CommonService } from '../services/CommonService'
import { SocketService } from '../services/SocketService'
import { NodeService } from '../services/NodeService'

import { connectDB } from './database';

import { Variable } from '../entities/Variable'
import { TokenInfo } from '../entities/TokenInfo'
const Caver = require('caver-js')
const Web3 = require('web3')
const contractAddress = require('../resources/'+process.env.NODE_ENV+'/contract-address.json');

const CaverExtKAS = require("caver-js-ext-kas");
const kasCaver = new CaverExtKAS(process.env.KAS_NETWORK, process.env.KAS_KEY1, process.env.KAS_KEY2)

export default async () => {

  try {
    await connectDB();
    
    const currency = (await TokenInfo.find()).reduce((result,item)=>{
      result[item.tokenAddress.toLowerCase()] = {};
      result[item.tokenAddress.toLowerCase()]['price'] = item.usdPrice;
      result[item.tokenAddress.toLowerCase()]['decimal'] = item.decimals;
      result[item.tokenAddress.toLowerCase()]['reward'] = item.reward;
      return result;
    },{})

    for(let objKey of Object.keys(contractAddress)){
      if(contractAddress[objKey].indexOf("0x")>-1) contractAddress[objKey] = contractAddress[objKey].toLowerCase();
    }
        
    if(process.env.BLOCK_RPC_USING){
      Container.set('caverClient',new Caver(process.env.BLOCK_RPC || 'http://klaytn.dxm.kr:8551'));
    }else{
      const accessKeyId = process.env.KAS_KEY1;
      const secretAccessKey = process.env.KAS_KEY2;
      
      const option = {
        headers: [
          {name: 'Authorization', value: 'Basic ' + Buffer.from(accessKeyId + ':' + secretAccessKey).toString('base64')},
          {name: 'x-chain-id', value: process.env.KAS_NETWORK},
        ]
      }
      Container.set('caverClient',new Caver(new Caver.providers.HttpProvider("https://node-api.klaytnapi.com/v1/klaytn", option)));
    }

    Container.set('currency',currency);
    Container.set('contractAddress',contractAddress);
    Container.set('logger', LoggerInstance);
    Container.set('constant', constant);  
    Container.set('ethClient',new Web3(process.env.ETH_BLOCK_RPC));
    Container.set("kasCaver",kasCaver);
    Container.set("RedisService",new RedisService(LoggerInstance));
    Container.get(AbiService);
    Container.get(CommonService);
    Container.get(NftService); 
    Container.get(NodeService);
    Container.get(KasService);
    Container.get(SocketService);
    
    Container.set('migrationVersion',(await Variable.findOne({key:"migrationVersion"})).value)

    return;
  } catch (e) { 
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};

import { Service, Inject } from 'typedi';
const abiCoder = require('web3-eth-abi');
const fs = require('fs');

@Service("AbiService")
export class AbiService {
  private abiMap:Map<string,[]> = new Map();
  private eventMap:Map<string,any> = new Map();
  private functionMap:Map<string,any> = new Map();
  private functionNameMap:Map<string,any> = new Map();

  private addr;
  private objCache;
  private abis:object[] = [];

  constructor(
    @Inject('logger') private logger,
    @Inject('contractAddress') private contractAddress,
  ) {
    this.addr = "";
    this.objCache = new Map();
    this.load();
  }

  load() {
    fs.readdirSync("./src/resources/abi").forEach((file)=>{
      if(file.indexOf("abi")>-1){
        const abiFile = require("../resources/abi/"+file)

        this.abiMap.set(file.split('.')[0],abiFile);
        this.abis.push(abiFile)
      }
    })

    this.generateEventMap();
  }

  generateEventMap() {
    this.abiMap.forEach((abi:{},idx)=>{

      let events = new Map();
      let functions = new Map();
      let functionsName = new Map();

      for (let i = 0; i < Object.keys(abi).length; i++) {
        let item = abi[i];
        if (!item.type)
          continue;
        if (item.type.toLowerCase() == 'event') {
          var signaturehash = abiCoder.encodeEventSignature(item);
          events.set(signaturehash.toLowerCase(), item);
        } else if (item.type.toLowerCase() == 'function') {
          var signaturehash = abiCoder.encodeFunctionSignature(item);
          functions.set(signaturehash.toLowerCase(), item);
          functionsName.set(item.name,item)
        }
      }

      this.eventMap.set(idx,events);
      this.functionMap.set(idx,functions);
      this.functionNameMap.set(idx,functionsName);
    })
  }

  async getDecodeParameters(funcInputs,data){
    var inputs = funcInputs.map(function(input) {return input.type;});
    try{
      return await abiCoder.decodeParameters(inputs,data);
    }catch(e){
      this.logger.info(e.message);
      return [];
    }
  }

  getDecodeLog(funcInputs,log){
    if(!funcInputs) return "";
    return abiCoder.decodeLog(funcInputs,log.data,log.topics);
  }
  

  getSignMessage(abiName,funcName,params){
    const funcAbi = this.getFunctionAbi(abiName,funcName);
    return abiCoder.encodeFunctionCall(funcAbi,params);
  }

  getFunctionAbi(abiName,funcName){
    const abi = this.functionNameMap.get(abiName);
    return abi.get(funcName);
  }

  getEventMap(abiName){
    return this.eventMap.get(abiName)
  }

  getFunctionMap(abiName){
    return this.functionMap.get(abiName)
  }

  getAbiMap(abiName){
    return this.abiMap.get(abiName)
  }

  checkTradeContract(address){
    
    if(!address) return false;

    const tradeAddrArr = [
      this.contractAddress['AuctionContract'],
      this.contractAddress['ReserveContract'],
      this.contractAddress['ExecutorContract'],
      this.contractAddress['SellOfferContract'],
      this.contractAddress['BuyOfferContract'],
      this.contractAddress['StakeContract'],
      this.contractAddress['KlayMintContract']
    ];

    if(tradeAddrArr.indexOf(address.toLowerCase())>-1) return true;
    
    return false;
  }

  getTradeType(address){
    address = address.toLowerCase();
    if(address == this.contractAddress['AuctionContract']){
      return 'AUCTION';
    }else if(address == this.contractAddress['SellOfferContract']){
      return "SELL";
    }else if(address == this.contractAddress['BuyOfferContract']){
      return "BUY";
    }else if(address == this.contractAddress['StakeContract']){
      return "STAKE";
    }
  }

}

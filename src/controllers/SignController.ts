import { Container } from "typedi";
import { KasService } from "../services/KasService";

const contractAddress = require("../resources/" +
  process.env.NODE_ENV +
  "/contract-address.json");

//서명메시지 트랜잭션 전송
exports.sign = async function (req, res, next) {
  const nodeService: any = Container.get("NodeService");

  try {
    var hash = req.body.hash; //id로 쓰일 random hash
    var cate = req.body.cate;
    var msg = req.body.msg;
    var signHash = req.body.signHash; //message에 서명한뒤 나온 hash
    var hashType = req.body.hashType;
    var address = req.body.address;
    var bridge = false;

    const kasService: KasService = Container.get("KasService");

    const [result, signAddress, v, r, s] = await nodeService.checkSignAddress(
      address,
      hashType,
      msg,
      signHash
    );

    //bridge를 통한 출금일 경우 cate가 token 혹은 nft로 바뀌면
    if (cate == "bridge") {
      cate = "token";
      bridge = true;
    }
    const toAddress = getContractByCate(cate);

    kasService.executeTx(
      hash,
      toAddress,
      msg,
      signAddress,
      v,
      r,
      s,
      hashType,
      bridge
    );

    return res.status(200).json({ result, signAddress, v, r, s });
  } catch (e) {
    return next(e);
  }
};

//사용자 서명 메시지 생성
exports.getSignMessage = async function (req, res, next) {
  const abiService: any = Container.get("AbiService");

  var cate = req.body.cate;
  var action = req.body.action;
  var params = req.body.params;

  try {
    var message: any = "";
    const [abiName, funcName] = getAbiFuncName(cate, action);
    message = abiService.getSignMessage(abiName, funcName, params);

    return res.status(200).json({ message });
  } catch (e) {
    return next(e);
  }
};

function getContractByCate(cate) {
  var conAddr = "";
  switch (cate) {
    case "sell":
      conAddr = contractAddress["SellOfferContract"];
      break;
    case "buy":
      conAddr = contractAddress["BuyOfferContract"];
      break;
    case "bridge":
    case "token":
    case "nft":
      conAddr = contractAddress["ReserveContract"];
      break;
    case "auction":
      conAddr = contractAddress["AuctionContract"];
      break;
    case "stake":
      conAddr = contractAddress["StakeContract"];
      break;
  }

  return conAddr;
}

function getAbiFuncName(cate, action) {
  var abiName = "";
  var functionName = "";

  abiName = cate + "-abi";
  if (cate == "token" || cate == "nft" || cate == "bridge")
    abiName = "reserve-abi";

  switch (action) {
    case "add":
      functionName = "add" + cate.charAt(0).toUpperCase() + cate.slice(1);
      if (cate == "sell" || cate == "buy") {
        functionName += "Offer";
      }
      break;
    case "deposit":
      functionName =
        "testDeposit" + cate.charAt(0).toUpperCase() + cate.slice(1);
      break;
    case "withdraw":
      functionName = "withdraw" + (cate == "nft" ? "Nft" : "");
      break;
    case "cancel":
      functionName = "cancel" + cate.charAt(0).toUpperCase() + cate.slice(1);
      if (cate == "sell" || cate == "buy") {
        functionName += "Offer";
      }
      break;
    case "bid":
      functionName = "placeBid";
      break;
    case "nego":
      functionName = "addNego";
      break;
    case "close":
      functionName = "close" + cate.charAt(0).toUpperCase() + cate.slice(1);
      if (cate == "sell" || cate == "buy") {
        functionName += "Offer";
      }
      break;
    case "edit":
      functionName = "edit" + cate.charAt(0).toUpperCase() + cate.slice(1);
      if (cate == "sell" || cate == "buy") {
        functionName += "Offer";
      }
      break;
    case "retrieve":
      functionName = "retrieve";
      break;
    default:
      functionName = action;
      break;
  }

  return [abiName, functionName];
}

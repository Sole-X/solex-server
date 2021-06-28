import { Service, Inject } from "typedi";

import { AuctionService } from "./event/AuctionService";
import { ReserveService } from "./event/ReserveService";
import { SellService } from "./event/SellService";
import { BuyService } from "./event/BuyService";
import { StakeService } from "./event/StakeService";
import { KlayMintService } from "./event/KlayMintService";

import { AbiService } from "../AbiService";

const contractAddress = require("../../resources/" +
  process.env.NODE_ENV +
  "/contract-address.json");

@Service("EventService")
export class EventService {
  constructor(
    @Inject("AuctionService") private auctionService: AuctionService,
    @Inject("ReserveService") private reserveService: ReserveService,
    @Inject("SellService") private sellService: SellService,
    @Inject("BuyService") private buyService: BuyService,
    @Inject("AbiService") private abiService: AbiService,
    @Inject("StakeService") private stakeService: StakeService,
    @Inject("KlayMintService") private klayMintService: KlayMintService,
    @Inject("BulkService") private bulkService,
    @Inject("constant") private constant
  ) {}

  public async handler(
    blockNo,
    txIndex,
    eventIndex,
    log,
    blockDate,
    callbackQueue
  ) {
    const topicHash =
      !!log.topics && !!log.topics[0] ? log.topics[0].toLowerCase() : null;
    log.address = log.address.toLowerCase();
    if (this.abiService.checkTradeContract(log.address)) {
      await this.bulkService.addData(blockNo, {
        tableName: "event",
        data: {
          blockNumber: blockNo,
          txHash: topicHash,
          address: log.address,
          log: log.data,
          createdAt: blockDate,
        },
        queryType: "insert",
      });
      if (log.address == contractAddress["AuctionContract"]) {
        return await this.auctionService.handler(
          blockNo,
          eventIndex,
          topicHash,
          log,
          blockDate,
          callbackQueue
        );
      } else if (log.address == contractAddress["ReserveContract"]) {
        return await this.reserveService.handler(
          blockNo,
          topicHash,
          log,
          blockDate,
          callbackQueue
        );
      } else if (log.address == contractAddress["SellOfferContract"]) {
        return await this.sellService.handler(
          blockNo,
          topicHash,
          log,
          blockDate
        );
      } else if (log.address == contractAddress["BuyOfferContract"]) {
        return await this.buyService.handler(
          blockNo,
          topicHash,
          log,
          blockDate
        );
      } else if (log.address == contractAddress["StakeContract"]) {
        return await this.stakeService.handler(
          blockNo,
          topicHash,
          log,
          blockDate
        );
      } else if (log.address == contractAddress["KlayMintContract"]) {
        return await this.klayMintService.handler(
          blockNo,
          topicHash,
          log,
          blockDate,
          callbackQueue
        );
      }
    }
  }
}

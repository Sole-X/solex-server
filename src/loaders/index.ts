import expressLoader from "./express";
import socketLoder from "./socketIo";
import coinMarketCap from "./coinMarketCap";
import getTokenURI from "./getTokenURI";
import saleExpire from "./saleExpire";

import Logger from "./logger";
import dependencyInjectorLoader from "./dependencyInjector";
import KasQueue from "./kasQueue";
import { Container } from "typedi";
import { Sync } from "../services/sync/Sync";
import { EthSync } from "../services/sync/EthSync";

export default async ({ expressApp }) => {
  await dependencyInjectorLoader();

  if (process.env.WORKER_ON) {
    await KasQueue();
    Logger.info("✌️worker started!");
  }

  if (process.env.SYNC_ON) {
    Container.get(Sync);
    Logger.info("✌️sync started!");
  }

  if (process.env.ETH_SYNC_ON) {
    Container.get(EthSync);
    Logger.info("✌️eth sync started!");
  }
  if (process.env.API_ON) {
    await expressLoader({ app: expressApp });
    expressApp = await socketLoder({ app: expressApp });
    expressApp
      .listen(process.env.API_PORT, () => {
        Logger.info(`🛡️  Server listening on port: ${process.env.API_PORT} 🛡️`);
      })
      .on("error", (err) => {
        Logger.error("Server listening err", err);
        process.exit(1);
      });
  }

  if (process.env.CMC_ON) {
    coinMarketCap();
  }

  if (process.env.GET_TOKEN_URI_ON) {
    getTokenURI();
  }

  if (process.env.ADMIN_ON) {
    await expressLoader({ app: expressApp });
    expressApp = await socketLoder({ app: expressApp });
    expressApp
      .listen(process.env.ADMIN_PORT, () => {
        Logger.info(
          `🛡️  Admin Server listening on port: ${process.env.ADMIN_PORT} 🛡️`
        );
      })
      .on("error", (err) => {
        Logger.error("Server listening err", err);
        process.exit(1);
      });
  }

  if (process.env.SALE_AUTO_EXPIRE) {
    saleExpire();
  }
};

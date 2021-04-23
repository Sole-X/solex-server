import { Column, Entity } from "typeorm";

@Entity("token_balance", { schema: "nft_market" })
export class TokenBalance {
  @Column("varchar", { primary: true, name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("decimal", {
    name: "amount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column("decimal", {
    name: "lockAuctionAmount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  lockAuctionAmount: string;

  @Column("decimal", {
    name: "lockSellAmount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  lockSellAmount: string;

  @Column("decimal", {
    name: "lockBuyAmount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  lockBuyAmount: string;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

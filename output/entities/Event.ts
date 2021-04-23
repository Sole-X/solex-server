import { Column, Entity } from "typeorm";

@Entity("event", { schema: "nft_market" })
export class Event {
  @Column("int", { primary: true, name: "id", unsigned: true })
  id: number;

  @Column("bigint", {
    name: "blockNumber",
    unsigned: true,
    default: () => "'0'",
  })
  blockNumber: string;

  @Column("varchar", { name: "txHash", length: 100 })
  txHash: string;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("varchar", { name: "fromAddress", length: 100 })
  fromAddress: string;

  @Column("varchar", { name: "toAddress", length: 100 })
  toAddress: string;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("decimal", {
    name: "tokenId",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  tokenId: string;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

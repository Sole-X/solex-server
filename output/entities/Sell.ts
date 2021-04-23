import { Column, Entity, Index } from "typeorm";

@Index("idx_nft", ["tokenAddress", "tokenId"], {})
@Index("idx_owner", ["ownerAddress"], {})
@Entity("sell", { schema: "nft_market" })
export class Sell {
  @Column("varchar", { primary: true, name: "id", length: 66 })
  id: string;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "tokenId", length: 100 })
  tokenId: string;

  @Column("varchar", { name: "currency", length: 100 })
  currency: string;

  @Column("datetime", { name: "startTime", default: () => "CURRENT_TIMESTAMP" })
  startTime: Date;

  @Column("datetime", { name: "endTime", default: () => "CURRENT_TIMESTAMP" })
  endTime: Date;

  @Column("decimal", {
    name: "basePrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  basePrice: string;

  @Column("decimal", {
    name: "currentPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  currentPrice: string;

  @Column("varchar", { name: "createTxHash", length: 100 })
  createTxHash: string;

  @Column("varchar", { name: "lastTxHash", length: 100 })
  lastTxHash: string;

  @Column("varchar", { name: "ownerAddress", length: 100 })
  ownerAddress: string;

  @Column("varchar", { name: "toAddress", length: 100 })
  toAddress: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "'0'" })
  type: number;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

import { Column, Entity, Index } from "typeorm";

@Index("idx_nft", ["tokenAddress", "tokenId"], {})
@Index("idx_buyer", ["buyerAddress"], {})
@Entity("buy", { schema: "nft_market" })
export class Buy {
  @Column("varchar", { primary: true, name: "id", length: 66 })
  id: string;

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
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  usdPrice: string;

  @Column("varchar", { name: "createTxHash", length: 100 })
  createTxHash: string;

  @Column("varchar", { name: "lastTxHash", length: 100 })
  lastTxHash: string;

  @Column("varchar", { name: "buyerAddress", length: 100 })
  buyerAddress: string;

  @Column("varchar", { name: "sellerAddress", length: 100 })
  sellerAddress: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

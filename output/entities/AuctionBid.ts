import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("idx_wallet", ["accountAddress"], {})
@Index("idx_auction", ["auctionId"], {})
@Entity("auction_bid", { schema: "nft_market" })
export class AuctionBid {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("varchar", { name: "auctionId", length: 66 })
  auctionId: string;

  @Column("smallint", {
    name: "bidIndex",
    unsigned: true,
    default: () => "'1'",
  })
  bidIndex: number;

  @Column("decimal", {
    name: "currentPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  currentPrice: string;

  @Column("decimal", {
    name: "bidPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  bidPrice: string;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  usdPrice: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

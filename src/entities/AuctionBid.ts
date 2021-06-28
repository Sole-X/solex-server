import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { Sale } from "./Sale";

@Index("idx_wallet", ["accountAddress"], {})
@Index("idx_auction", ["auctionId"], {})
@Entity("auction_bid")
export class AuctionBid extends ParentEntity {
  @Column("varchar", { primary: true, name: "id", length: 66 })
  id: string;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

  @ManyToOne((type) => Sale, (sale) => sale.id)
  @JoinColumn([{ name: "auctionId", referencedColumnName: "id" }])
  @Column("varchar", { name: "auctionId", length: 66 })
  auctionId: string;

  @Column("smallint", {
    name: "bidIndex",
    unsigned: true,
    default: () => "'1'",
  })
  bidIndex: number;

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
    scale: 8,
    default: () => "'0.00000000'",
  })
  usdPrice: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

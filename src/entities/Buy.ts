import { Column, Entity, Index, OneToOne, JoinColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { NftItemDesc } from "./NftItemDesc";

@Index("idx_nft", ["tokenAddress", "tokenId"], {})
@Index("idx_buyer", ["buyerAddress"], {})
@Index("idx_basePrice", ["basePrice"], {})
@Index("idx_currency", ["currency"], {})
@Index("idx_status", ["status"], {})
@Index("idx_liked", ["liked"], {})
@Index("idx_updatedAt", ["updatedAt"], {})
@Entity("buy")
export class Buy extends ParentEntity {
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

  @Column("varchar", { name: "tokenName", length: 100 })
  tokenName: string;

  @Column("varchar", { name: "currency", length: 100 })
  currency: string;

  @Column("datetime", { name: "startTime", default: () => "CURRENT_TIMESTAMP" })
  startTime: Date;

  @Column("datetime", { name: "endTime", nullable: true })
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
    scale: 8,
    default: () => "'0.00000000'",
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

  @Column("int", { name: "liked", unsigned: true, default: () => "1" })
  liked: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToOne((type) => NftItemDesc, (desc) => desc.nft)
  @JoinColumn([
    { name: "tokenAddress", referencedColumnName: "tokenAddress" },
    { name: "tokenId", referencedColumnName: "tokenId" },
  ])
  desc?: NftItemDesc;
}

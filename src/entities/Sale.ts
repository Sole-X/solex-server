import { Column, Entity, Index, OneToOne,OneToMany, JoinColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { AuctionBid } from './AuctionBid'
import { SellNego } from './SellNego'
import { NftItemDesc } from './NftItemDesc'

@Index("idx_nft", ["tokenAddress", "tokenId"], {})
@Index("idx_currency", ["currency"], {})
@Index("idx_currentPrice", ["currentPrice"], {})
@Index("idx_owner", ["ownerAddress"], {})
@Index("idx_type", ["type"], {})
@Index("idx_status", ["status"], {})
@Index("idx_liked", ["liked"], {})
@Index("idx_updatedAt", ["updatedAt"], {})
@Entity("sale")
export class Sale extends ParentEntity{
  @Column("varchar", { primary: true, name: "id", length: 66 })
  id: string;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "tokenId", length: 100 })
  tokenId: string;

  @Column("varchar", { name: "tokenName", length: 100 })
  tokenName: string;
  
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

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 8,
    default: () => "'0.00000000'",
  })
  usdPrice: string;
  
  @Column("decimal", {
    name: "straightPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  straightPrice: string;

  @Column("varchar", { name: "createTxHash", length: 100 })
  createTxHash: string;

  @Column("varchar", { name: "lastTxHash", length: 100 , default: () => "''"})
  lastTxHash: string;

  @Column("varchar", { name: "ownerAddress", length: 100 })
  ownerAddress: string;

  @Column("varchar", { name: "buyerAddress", length: 100, default: () => "''" })
  buyerAddress: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "'0'" })
  type: number;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("int", { name: "liked", unsigned: true, default: () => "0" })
  liked: number;

  @Column("smallint", { name: "participant", default: () => "0" })
  participant: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToMany(type => AuctionBid, (bid)=>bid.auctionId)
  @JoinColumn([
    { name: "id", referencedColumnName: "auctionId" }
  ])
  bids?:AuctionBid[];

  @OneToMany(type => SellNego, (nego)=>nego.sellId)
  @JoinColumn([
    { name: "id", referencedColumnName: "sellId" }
  ])
  negos?:SellNego[];

  @OneToOne((type) => NftItemDesc,(desc)=>desc.nft)
  @JoinColumn([
    { name: "tokenAddress", referencedColumnName: "tokenAddress" },
    { name: "tokenId", referencedColumnName: "tokenId" }
  ])
  desc?:NftItemDesc
}

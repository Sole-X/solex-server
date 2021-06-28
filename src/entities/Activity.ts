import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Index,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { NftItemDesc } from "./NftItemDesc";

@Index("idx_tradeId", ["tradeId"], {})
@Entity("activity")
export class Activity extends ParentEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("tinyint", { name: "eventType", default: () => "''" })
  eventType: number;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("tinyint", { name: "tradeType", default: () => "0" })
  tradeType: number;

  @Column("varchar", { name: "tradeId", length: 100, default: () => "''" })
  tradeId: string;

  @Column("varchar", { name: "txHash", length: 100, default: () => "''" })
  txHash: string;

  @Column("varchar", { name: "tokenAddress", length: 100, default: () => "''" })
  tokenAddress: string;

  @Column("varchar", { name: "tokenId", length: 100, default: () => "''" })
  tokenId: string;

  @Column("varchar", { name: "currency", length: 100, default: () => "''" })
  currency: string;

  @Column("decimal", {
    name: "amount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "'0'",
  })
  usdPrice: string;

  @Column("varchar", {
    name: "accountAddress",
    length: 100,
    default: () => "''",
  })
  accountAddress: string;

  @Column("varchar", { name: "fromAddress", length: 100, default: () => "''" })
  fromAddress: string;

  @Column("varchar", { name: "toAddress", length: 100, default: () => "''" })
  toAddress: string;

  @Column("int", { name: "bridgeId", default: () => "0" })
  bridgeId: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToOne((type) => NftItemDesc, (desc) => desc.nft)
  @JoinColumn([
    { name: "tokenAddress", referencedColumnName: "tokenAddress" },
    { name: "tokenId", referencedColumnName: "tokenId" },
  ])
  nftDesc?: NftItemDesc;
}

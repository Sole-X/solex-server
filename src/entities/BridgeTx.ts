import { Column, Entity, PrimaryGeneratedColumn,Index } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Index("idx_hash", ["hashId"], {})
@Entity("bridge_tx")
export class BridgeTx extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "platform", length: 20, default: () => "''" })
  platform: string;

  @Column("varchar", { name: "hashId", length: 100 })
  hashId: string;

  @Column("int", { name: "depositId", unsigned: true, default: () => "0" })
  depositId: number;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "tokenId", length: 100 })
  tokenId: string;

  @Column("decimal", {
    name: "amount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column("bigint", {
    name: "blockNumber",
    unsigned: true,
    default: () => "'0'",
  })
  blockNumber: string;

  @Column("varchar", { name: "txHash", length: 100 })
  txHash: string;

  @Column("varchar", { name: "fromAddress", length: 100 })
  fromAddress: string;

  @Column("varchar", { name: "toAddress", length: 100 })
  toAddress: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "0" })
  type: number;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "0" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

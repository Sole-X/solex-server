import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("solex_tx", { schema: "nft_market" })
export class SolexTx {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "hashId", length: 100 })
  hashId: string;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

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

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'0'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

import { Column, Entity } from "typeorm";

@Entity("block", { schema: "nft_market" })
export class Block {
  @Column("bigint", { primary: true, name: "blockNumber", unsigned: true })
  blockNumber: string;

  @Column("varchar", { name: "blockHash", length: 255 })
  blockHash: string;

  @Column("tinyint", { name: "version", unsigned: true })
  version: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

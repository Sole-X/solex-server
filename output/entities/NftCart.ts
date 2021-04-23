import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("idx_account", ["accountAddress"], {})
@Entity("nft_cart", { schema: "nft_market" })
export class NftCart {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

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

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

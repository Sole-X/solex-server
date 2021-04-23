import { Column, Entity, Index } from "typeorm";

@Index("idx_owner", ["ownerAddress"], {})
@Index("idx_platform", ["platform"], {})
@Index("idx_status", ["status"], {})
@Entity("nft_item", { schema: "nft_market" })
export class NftItem {
  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { primary: true, name: "tokenId", length: 100 })
  tokenId: string;

  @Column("varchar", { name: "tokenUri", length: 100 })
  tokenUri: string;

  @Column("varchar", { name: "ownerAddress", length: 100 })
  ownerAddress: string;

  @Column("tinyint", { name: "platform", unsigned: true, default: () => "'0'" })
  platform: number;

  @Column("decimal", {
    name: "price",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  price: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

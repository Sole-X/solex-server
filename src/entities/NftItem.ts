import { Column, Entity, Index, OneToOne, JoinColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { Sale } from "./Sale";
import { NftItemDesc } from "./NftItemDesc";

@Index("idx_owner", ["ownerAddress"], {})
@Index("idx_platform", ["platform"], {})
@Index("idx_status", ["status"], {})
@Index("idx_publisher", ["publisher"], {})
@Entity("nft_item")
export class NftItem extends ParentEntity {
  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { primary: true, name: "tokenId", length: 100 })
  tokenId: string;

  @Column("varchar", { name: "tokenUri", length: 100 })
  tokenUri: string;

  @Column("varchar", { name: "publisher", length: 50, default: () => "''" })
  publisher: string;

  @Column("varchar", { name: "ownerAddress", length: 100, default: () => "''" })
  ownerAddress: string;

  @Column("varchar", { name: "tradeId", length: 100, default: () => "''" })
  tradeId: string;

  @Column("tinyint", { name: "platform", unsigned: true, default: () => "0" })
  platform: number;

  @Column("varchar", { name: "currency", length: 100 })
  currency: string;

  @Column("decimal", {
    name: "price",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "0",
  })
  price: string;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "0",
  })
  usdPrice: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "1" })
  status: number;

  @Column("datetime", { name: "endTime", nullable: true })
  endTime: Date;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToOne((type) => Sale)
  @JoinColumn([{ name: "tradeId", referencedColumnName: "id" }])
  sale?: Sale;

  @OneToOne((type) => NftItemDesc, (desc) => desc.nft)
  @JoinColumn([
    { name: "tokenAddress", referencedColumnName: "tokenAddress" },
    { name: "tokenId", referencedColumnName: "tokenId" },
  ])
  desc?: NftItemDesc;
}

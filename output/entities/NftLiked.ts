import { Column, Entity } from "typeorm";

@Entity("nft_liked", { schema: "nft_market" })
export class NftLiked {
  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("decimal", {
    primary: true,
    name: "tokenId",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  tokenId: string;

  @Column("int", { name: "liked", unsigned: true, default: () => "'0'" })
  liked: number;
}

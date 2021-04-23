import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("nft_info", { schema: "nft_market" })
export class NftInfo {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "platform", length: 10, default: () => "'ETH'" })
  platform: string;

  @Column("varchar", { name: "tokenAddress", length: 255 })
  tokenAddress: string;

  @Column("varchar", { name: "name", length: 50 })
  name: string;

  @Column("varchar", { name: "symbol", length: 50 })
  symbol: string;

  @Column("int", { name: "total", unsigned: true, default: () => "'0'" })
  total: number;

  @Column("decimal", {
    name: "price",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  price: string;

  @Column("varchar", { name: "logoUrl", length: 255 })
  logoUrl: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;
}

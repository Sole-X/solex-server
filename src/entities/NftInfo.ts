import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("nft_info")
export class NftInfo extends ParentEntity{

  @Column("varchar", { primary: true,name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "platform", length: 10, default: () => "'ETH'" })
  platform: string;

  @Column("varchar", { name: "ethAddress", length: 255 })
  ethAddress: string;

  @Column("varchar", { name: "name", length: 50 })
  name: string;

  @Column("varchar", { name: "symbol", length: 50 })
  symbol: string;

  @Column("varchar", { name: "explorer", length: 255 })
  explorer: string;

  @Column("varchar", { name: "desc", length: 255 })
  desc: string;
  
  @Column("varchar", { name: "link", length: 255 })
  link: string;

  @Column("int", { name: "total", unsigned: true, default: () => "'0'" })
  total: number;

  @Column("varchar", { name: "logoUrl", length: 255 })
  logoUrl: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "'1'" })
  type: number;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("idx_wallet", ["accountAddress"], {})
@Index("idx_sell", ["sellId"], {})
@Entity("sell_nego", { schema: "nft_market" })
export class SellNego {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("varchar", { name: "sellId", length: 66 })
  sellId: string;

  @Column("int", { name: "index", unsigned: true, default: () => "'1'" })
  index: number;

  @Column("decimal", {
    name: "currentPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  currentPrice: string;

  @Column("decimal", {
    name: "negoPrice",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  negoPrice: string;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  usdPrice: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "'1'" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

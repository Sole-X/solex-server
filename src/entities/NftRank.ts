import { Column, Entity, PrimaryGeneratedColumn, Index } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("nft_rank")
@Index("idx_total", ["total"], {})
@Index("idx_week", ["week"], {})
@Index("idx_tradeCnt", ["tradeCnt"], {})
@Index("idx_nftCnt", ["nftCnt"], {})
@Index("idx_ownerCnt", ["ownerCnt"], {})
export class NftRank extends ParentEntity {
  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("bigint", {
    name: "dateKey",
    unsigned: true,
    default: () => "'0'",
  })
  dateKey: string;

  @Column("bigint", {
    name: "total",
    unsigned: true,
    default: () => "'0'",
  })
  total: string;

  @Column("bigint", {
    name: "beforeWeek",
    unsigned: true,
    default: () => "'0'",
  })
  beforeWeek: string;

  @Column("bigint", {
    name: "week",
    unsigned: true,
    default: () => "'0'",
  })
  week: string;

  @Column("decimal", {
    name: "change",
    precision: 12,
    scale: 2,
    default: () => "0",
  })
  change: string;

  @Column("float", {
    name: "avgPrice",
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "0",
  })
  avgPrice: string;

  @Column("bigint", {
    name: "tradeCnt",
    default: () => "'0'",
  })
  tradeCnt: string;

  @Column("bigint", {
    name: "nftCnt",
    default: () => "'0'",
  })
  nftCnt: string;

  @Column("bigint", {
    name: "ownerCnt",
    default: () => "'0'",
  })
  ownerCnt: string;
}

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("token_info")
export class TokenInfo extends ParentEntity{

  @Column("varchar", { primary: true,name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "platform", length: 10, default: () => "'ETH'" })
  platform: string;

  @Column("varchar", { name: "ethAddress", length: 100 })
  ethAddress: string;

  @Column("varchar", { name: "name", length: 50 })
  name: string;

  @Column("varchar", { name: "symbol", length: 50 })
  symbol: string;

  @Column("tinyint", { name: "decimals", unsigned: true, default: () => "18" })
  decimals: number;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 20,
    scale: 8,
    default: () => "'0'",
  })
  usdPrice: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "1" })
  status: number;

  //reward 사용 여부
  @Column("tinyint", { name: "reward", unsigned: true, default: () => "0" })
  reward: number;

  @Column("decimal", {
    name: "stakeIndex",
    unsigned: true,
    precision: 20,
    scale: 4,
    default: () => "0",
  })
  stakeIndex: string;

  @Column("decimal", {
    name: "stakeAccReward",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "0",
  })
  stakeAccReward: string;  

  @Column("decimal", {
    name: "feeReceiver",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "0",
  })
  feeReceiver: string;  

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

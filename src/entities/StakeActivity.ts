import { Column, Entity,PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("stake_activity")
export class StakeActivity extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "accountAddress", length: 100, default: () => "''" })
  accountAddress: string;

  @Column("varchar", { name: "currency", length: 100, default: () => "''" })
  currency: string;

  @Column("decimal", {
    name: "amount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column("decimal", {
    name: "usdPrice",
    unsigned: true,
    precision: 20,
    scale: 4,
    default: () => "'0'",
  })
  usdPrice: string;  

  @Column("int", { name: "index", unsigned: true, default: () => "1" })
  index: number;

  @Column("varchar", { name: "txHash", length: 100, default: () => "''"  })
  txHash: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "1" })
  type: number;

  @Column("datetime", { name: "due", default: () => null})
  due: Date;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

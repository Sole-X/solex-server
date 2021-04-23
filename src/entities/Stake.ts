import { Column, Entity,PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("stake")
export class Stake extends ParentEntity{
  @Column("varchar", { primary: true, name: "accountAddress", length: 100, default: () => "''" })
  accountAddress: string;

  @Column("decimal", {
    name: "amount",
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column("decimal", {
    name: "unstakingAmount",
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  unstakingAmount: string;  

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

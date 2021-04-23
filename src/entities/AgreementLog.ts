import { Column, Entity,PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";


@Entity("agreement_log")
export class AgreementLog extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("tinyint", { name: "agreementCate", unsigned: true, default: () => "0" })
  agreementCate: number;

  @Column("bit", { name: "status", default: () => "0" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

}

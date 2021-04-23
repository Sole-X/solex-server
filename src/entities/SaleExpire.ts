import { Column, Entity } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("sale_expire")
export class SaleExpire extends ParentEntity{
  @Column("varchar", { primary: true, name: "id", length: 66 })
  id: string;

  @Column("varchar", { name: "txHash", length: 100, default: () => "''" })
  txHash: string;

  @Column("tinyint", { name: "status", unsigned: true, default: () => "0" })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

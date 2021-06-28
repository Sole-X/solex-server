import { Column, Entity } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("block")
export class Block extends ParentEntity {
  @Column("bigint", { primary: true, name: "blockNumber", unsigned: true })
  blockNumber: string;

  @Column("tinyint", { name: "version", unsigned: true })
  version: number;
}

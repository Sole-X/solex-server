import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("migrations")
export class Migrations extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("bigint", { name: "timestamp" })
  timestamp: string;

  @Column("varchar", { name: "name", length: 255 })
  name: string;
}

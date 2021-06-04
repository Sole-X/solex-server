import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("mail_log")
export class MailLog extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("int", { name: "templateId", unsigned: true, default: () => "0" })
  templateId: number;

  @Column("varchar", { name: "email", length: 150, default: () => "''" })
  email: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;
}

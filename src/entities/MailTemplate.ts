import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("mail_template")
export class MailTemplate extends ParentEntity{
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number;

  @Column("varchar", { name: "subject", length: 10, default: () => "''" })
  subject: number;

  @Column("text", { name: "template", default: () => "''" })
  template: string;
}

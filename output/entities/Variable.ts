import { Column, Entity } from "typeorm";

@Entity("variable", { schema: "nft_market" })
export class Variable {
  @Column("varchar", { primary: true, name: "key", length: 45 })
  key: string;

  @Column("varchar", { name: "value", nullable: true, length: 45 })
  value: string | null;
}

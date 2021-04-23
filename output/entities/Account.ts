import { Column, Entity } from "typeorm";

@Entity("account", { schema: "nft_market" })
export class Account {
  @Column("varchar", { primary: true, name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("varchar", { name: "nickname", length: 45 })
  nickname: string;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

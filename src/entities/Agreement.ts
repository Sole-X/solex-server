import { Column, Entity, ValueTransformer } from "typeorm";
import { ParentEntity } from "./ParentEntity";

class BoolBitTransformer implements ValueTransformer {
  // To db from typeorm
  to(value: boolean | null): Buffer | null {
    if (value === null) {
      return null;
    }
    const res = Buffer.alloc(1);
    res[0] = value ? 1 : 0;
    return res;
  }
  // From db to typeorm
  from(value: Buffer): boolean | null {
    if (value === null) {
      return null;
    }
    return value[0] === 1;
  }
}

@Entity("agreement")
export class Agreement extends ParentEntity {
  @Column("varchar", { primary: true, name: "accountAddress", length: 100 })
  accountAddress: string;

  @Column("tinyint", {
    name: "agreementCate",
    unsigned: true,
    default: () => "'0'",
  })
  agreementCate: number;

  @Column("tinyint", {
    name: "status",
    transformer: new BoolBitTransformer(),
    default: () => "0",
  })
  status: number;

  @Column("datetime", { name: "createdAt", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column("datetime", { name: "updatedAt", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}

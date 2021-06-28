import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("nft_queue")
export class NftQueue extends ParentEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { name: "tokenId", length: 100 })
  tokenId: string;

  @Column("varchar", { name: "type", length: 10 })
  type: string;
}

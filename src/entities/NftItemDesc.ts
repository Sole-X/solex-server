import { Column, Entity, Index, OneToOne, JoinColumn } from "typeorm";
import { ParentEntity } from "./ParentEntity";
import { NftItem } from './NftItem'

@Entity("nft_item_desc")
export class NftItemDesc extends ParentEntity{
  @Column("varchar", { primary: true, name: "tokenAddress", length: 100 })
  tokenAddress: string;

  @Column("varchar", { primary: true, name: "tokenId", length: 100 })
  tokenId: string;

  @Column("text", { name: "tokenUri"  })
  tokenUri: string;

  @Column("varchar", { name: "name", length: 255, default: () => "''"  })
  name: string;

  @Column("text", { name: "description" })
  description: string;

  @Column("varchar", { name: "image", length: 255 , default: () => "''" })
  image: number;

  @Column("text", { name: "animationUrl", nullable:true  })
  animationUrl: string;

  @OneToOne(type => NftItem, (nft)=>nft.desc)
  @JoinColumn([
    { name: "tokenAddress", referencedColumnName: "tokenAddress" },
    { name: "tokenId", referencedColumnName: "tokenId" }
  ])
  nft?:NftItem
  
}

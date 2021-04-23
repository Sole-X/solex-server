import { Column, Entity, PrimaryGeneratedColumn,In } from "typeorm";
import { ParentEntity } from "./ParentEntity";

@Entity("category")
export class Category extends ParentEntity{

  @Column("varchar", { primary: true, name: "tokenAddress", length: 100, default: () => "''" })
  tokenAddress: string;

  @Column("varchar", { primary: true, name: "category", length: 45, default: () => "''" })
  category: string;

  @Column("tinyint", { name: "type", unsigned: true, default: () => "'1'" })
  type: number;

  static async getTokenAddrs(categories){
    var result = [];
    var cateArr = categories.split(",");
    const results = await this.createQueryBuilder()
    .select(['tokenAddress','category'])
    .distinct(true)
    .where({category:In(cateArr)})
    .getRawMany();

    result = await results.map(result => result.tokenAddress );

    cateArr.forEach(element => {
      var cateIndex = results.map(function(item) { return item.category; }).indexOf(element);
      if(cateIndex == -1) result.push(element)
    });

    return result;
  }
}

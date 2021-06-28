import { BaseEntity } from "typeorm";

export class ParentEntity extends BaseEntity {
  static async insertIfNotExist(where) {
    const result = await this.findOne(where);
    if (!result) {
      const insert = this.insert(where);
      return insert;
    } else {
      return result;
    }
  }

  static async pagination(
    page: any = 1,
    limit: any = 10,
    where,
    order,
    relation = [],
    select = null
  ) {
    const take = limit;
    const skip = (Number(page) - 1) * limit;
    const total = await this.count({
      select: select,
      where: where,
    });

    var items = await this.find({
      where: where,
      order: order,
      take: take,
      skip: skip,
      relations: relation,
    });

    items = items.reduce(function (result, element) {
      relation.forEach((res) => {
        if ((res = "desc")) return;
        element[res].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      });
      result.push(element);
      return result;
    }, []);

    return {
      maxPage: Math.ceil(total / take),
      currentPage: page,
      total: total,
      items: items,
    };
  }
}

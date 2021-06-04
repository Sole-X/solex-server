import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";
import { NftItemDesc } from '../entities/NftItemDesc'

export class animationUrlAdd1622185819515 implements MigrationInterface {
    name = 'animationUrlAdd1622185819515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        let nftItemDescTable = queryRunner.connection.getRepository(NftItemDesc).metadata.tableName

        await queryRunner.addColumn(nftItemDescTable, new TableColumn({
            name: "animationUrl",
            type: "text",
            isNullable: true
        }));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        let nftItemDescTable = queryRunner.connection.getRepository(NftItemDesc).metadata.tableName
        await queryRunner.dropColumn(nftItemDescTable, 'animationUrl')
    }

}

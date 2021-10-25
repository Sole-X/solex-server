import { MigrationInterface, QueryRunner } from 'typeorm';

export class publisherSearch1622525447208 implements MigrationInterface {
  name = 'publisherSearch1622525447208';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE `nft_item` ADD `publisher` varchar(50) NOT NULL DEFAULT '' AFTER tokenUri ");
    await queryRunner.query('CREATE INDEX `nft_publisher` ON `nft_item` (`publisher`)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `nft_publisher` ON `nft_item`');
    await queryRunner.query('ALTER TABLE `nft_item` DROP COLUMN `publisher`');
  }
}

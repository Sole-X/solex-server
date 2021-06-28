import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';
import { Newsletter } from '../entities/Newsletter';
import { MailLog } from '../entities/MailLog';
import { MailTemplate } from '../entities/MailTemplate';

export class newsletter1622189158104 implements MigrationInterface {
  name = 'newsletter1622189158104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    let newsletterTbl = queryRunner.connection.getRepository(Newsletter).metadata.tableName;
    let mailLogTbl = queryRunner.connection.getRepository(MailLog).metadata.tableName;
    let mailTemplateTbl = queryRunner.connection.getRepository(MailTemplate).metadata.tableName;

    await queryRunner.createTable(
      new Table({
        name: newsletterTbl,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar(150)',
            isNullable: false,
            default: "''",
          },
          {
            name: 'status',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            default: 1,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      newsletterTbl,
      new TableIndex({
        name: 'idx_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: mailLogTbl,
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'templateId',
            type: 'int',
            unsigned: true,
          },
          {
            name: 'email',
            type: 'varchar(150)',
            isNullable: false,
            default: "''",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      mailLogTbl,
      new TableIndex({
        name: 'idx_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: mailTemplateTbl,
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'subject',
            type: 'varchar(150)',
            isNullable: false,
            default: "''",
          },
          {
            name: 'template',
            type: 'text',
          },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `INSERT INTO ${mailTemplateTbl}(\`subject\`,\`template\`) VALUES ('test','{param0}님 안녕하세요')  `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    let newsletterTbl = queryRunner.connection.getRepository(Newsletter).metadata.tableName;
    let mailLogTbl = queryRunner.connection.getRepository(MailLog).metadata.tableName;
    let mailTemplateTbl = queryRunner.connection.getRepository(MailTemplate).metadata.tableName;

    await queryRunner.dropTable(newsletterTbl);
    await queryRunner.dropTable(mailLogTbl);
    await queryRunner.dropTable(mailTemplateTbl);
  }
}

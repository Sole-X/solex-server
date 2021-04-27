import {MigrationInterface, QueryRunner,Table,TableIndex} from "typeorm";

export class init1607056740631 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        if(!await queryRunner.hasTable('account')){
          await queryRunner.createTable(new Table({
            name: 'account',
            columns: [
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false                
              },
              {
                name: 'username',
                type: 'varchar(45)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'profile',
                type: 'varchar(255)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'display',
                type: 'tinyint',
                isNullable: false,
                default:"1"
              },
              {
                name: 'loginTime',
                type: 'varchar(45)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true);
        }

        if(!await queryRunner.hasTable('token_balance')){
          await queryRunner.createTable(new Table({
            name: 'token_balance',
            columns: [
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false                
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false
              },
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "lockAuctionAmount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "lockSellAmount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "lockBuyAmount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "lockStakeAmount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },   
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)

        }

        if(!await queryRunner.hasTable('nft_item')){
          await queryRunner.createTable(new Table({
            name: 'nft_item',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'tokenUri',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'ownerAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'tradeId',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'platform',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default:0
              },
              {
                name: 'currency',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: "price",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: '0'
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:2,
                unsigned:true,
                isNullable: false,
                default: 0
              },              
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'endTime',
                type: 'datetime',
                isNullable: true,
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
            ]
          }), true)

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_owner',
            columnNames: ['ownerAddress']
          }));

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_platform',
            columnNames: ['platform']
          }));

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_status',
            columnNames: ['status']
          }));

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_endtime',
            columnNames: ['endtime']
          }));

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_updatedAt',
            columnNames: ['updatedAt']
          }));

          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_currency',
            columnNames: ['currency']
          }));
          await queryRunner.createIndex('nft_item', new TableIndex({
            name: 'idx_price',
            columnNames: ['price']
          }));          
        }


        if(!await queryRunner.hasTable('nft_item_desc')){
          await queryRunner.createTable(new Table({
            name: 'nft_item_desc',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'tokenUri',
                type: 'text',
                isNullable: false
              },
              {
                name: 'name',
                type: 'varchar(255)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'description',
                type: 'text',
                isNullable: false
              },
              {
                name: 'image',
                type: 'varchar(255)',
                isNullable: false,
                default:"''"
              }
            ]
          }), true)
    
        }

        //nft_liked
        if(!await queryRunner.hasTable('nft_liked')){
          await queryRunner.createTable(new Table({
            name: 'nft_liked',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },                            
              {
                name: 'tradeId',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)

          await queryRunner.createIndex('nft_liked', new TableIndex({
            name: 'idx_account',
            columnNames: ['accountAddress']
          }));
          
          await queryRunner.createIndex('nft_liked', new TableIndex({
            name: 'idx_tradeId',
            columnNames: ['tradeId']
          }));
        }

        //sale
        if(!await queryRunner.hasTable('sale')){
          await queryRunner.createTable(new Table({
            name: 'sale',
            columns: [
              {
                name: 'id',
                type: 'varchar(66)',
                isPrimary: true,
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenName',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },             
              {
                name: 'currency',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'startTime',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'endTime',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: "basePrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "currentPrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:8,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "straightPrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "createTxHash",
                type: "varchar(100)",
                isNullable: false,
              },
              {
                name: "lastTxHash",
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'ownerAddress',
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'buyerAddress',
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'type',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'liked',
                type: 'int',
                isNullable: false,
                default:0
              },
              {
                name: 'participant',
                type: 'smallint',
                isNullable: false,
                default:0
              },              
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
            ]
          }), true)

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_nft',
            columnNames: ['tokenAddress','tokenId']
          }));

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_currency',
            columnNames: ['currency']
          }));

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_currentPrice',
            columnNames: ['currentPrice']
          }));
          
          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_owner',
            columnNames: ['ownerAddress']
          }));

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_type',
            columnNames: ['type']
          }));

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_status',
            columnNames: ['status']
          }));

          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_liked',
            columnNames: ['liked']
          }));
          await queryRunner.createIndex('sale', new TableIndex({
            name: 'idx_updatedAt',
            columnNames: ['updatedAt']
          }));

        }

        //sale_expire
        if(!await queryRunner.hasTable('sale_expire')){
          await queryRunner.createTable(new Table({
            name: 'sale_expire',
            columns: [
              {
                name: 'id',
                type: 'varchar(66)',
                isPrimary: true,
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },             
              {
                name: 'status',
                type: 'tinyint',
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)
        }

        //bid
        if(!await queryRunner.hasTable('auction_bid')){
          await queryRunner.createTable(new Table({
            name: 'auction_bid',
            columns: [
              {
                name: 'id',
                type: 'varchar(66)',
                isPrimary: true,
              },
              {
                name: 'accountAddress',
                type: "varchar(100)",
                isNullable: false,
                default:"''"
              },
              {
                name: 'auctionId',
                type: 'varchar(66)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'bidIndex',
                type: 'smallint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: "bidPrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:8,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
            ]
          }), true)

          await queryRunner.createIndex('auction_bid', new TableIndex({
            name: 'idx_wallet',
            columnNames: ['accountAddress']
          }));

          await queryRunner.createIndex('auction_bid', new TableIndex({
            name: 'idx_auction',
            columnNames: ['auctionId']
          }));

          await queryRunner.createIndex('auction_bid', new TableIndex({
            name: 'idx_index',
            columnNames: ['bidIndex']
          }));
        }


        //sale_nego
        if(!await queryRunner.hasTable('sell_nego')){
          await queryRunner.createTable(new Table({
            name: 'sell_nego',
            columns: [
              {
                name: 'id',
                type: 'varchar(66)',
                isPrimary: true,
              },
              {
                name: 'accountAddress',
                type: "varchar(100)",
                isNullable: false,
                default:"''"
              },
              {
                name: 'sellId',
                type: 'varchar(66)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'currency',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: "negoPrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:8,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'declineType',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'declineReason',
                type: 'varchar(300)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
            ]
          }), true)

          await queryRunner.createIndex('sell_nego', new TableIndex({
            name: 'idx_wallet',
            columnNames: ['accountAddress']
          }));

          await queryRunner.createIndex('sell_nego', new TableIndex({
            name: 'idx_sell',
            columnNames: ['sellId']
          }));

          await queryRunner.createIndex('sell_nego', new TableIndex({
            name: 'idx_createdAt',
            columnNames: ['createdAt']
          }));
        }

        if(!await queryRunner.hasTable('buy')){
          await queryRunner.createTable(new Table({
            name: 'buy',
            columns: [
              {
                name: 'id',
                type: 'varchar(66)',
                isPrimary: true,
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'tokenName',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },              
              {
                name: 'currency',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'startTime',
                type: 'datetime',
                isNullable: true,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'endTime',
                type: 'datetime',
                isNullable: true
              },
              {
                name: "basePrice",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:8,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "createTxHash",
                type: "varchar(100)",
                isNullable: false,
              },
              {
                name: "lastTxHash",
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'buyerAddress',
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'sellerAddress',
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'liked',
                type: 'int',
                isNullable: false,
                default:1
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
            ]
          }), true)

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_nft',
            columnNames: ['tokenAddress','tokenId']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_buyer',
            columnNames: ['buyerAddress']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_basePrice',
            columnNames: ['basePrice']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_currency',
            columnNames: ['currency']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_status',
            columnNames: ['status']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_liked',
            columnNames: ['liked']
          }));

          await queryRunner.createIndex('buy', new TableIndex({
            name: 'idx_updatedAt',
            columnNames: ['updatedAt']
          }));

        }

        //stake
        if(!await queryRunner.hasTable('stake')){
          await queryRunner.createTable(new Table({
            name: 'stake',
            columns: [
              {
                name: "accountAddress",
                isPrimary: true,
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "unstakingAmount",
                type: 'decimal',
                precision:65,
                scale:0,
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)

        }

        //stake_reward
        if(!await queryRunner.hasTable('stake_reward')){
          await queryRunner.createTable(new Table({
            name: 'stake_reward',
            columns: [
              {
                name: "accountAddress",
                type: "varchar(100)",
                isPrimary: true,
                isNullable: false,
                default: "''"
              },
              {
                name: "currency",
                type: "varchar(100)",
                isPrimary: true,
                isNullable: false,
                default: "''"
              },
              {
                name: "userIndex",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },              
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "totalReward",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)

        }

        //stake_activity
        if(!await queryRunner.hasTable('stake_activity')){
          await queryRunner.createTable(new Table({
            name: 'stake_activity',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: "accountAddress",
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: "currency",
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:4,
                unsigned:true,
                isNullable: false,
                default: 0
              },              
              {
                name: 'type',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'index',
                type: 'int',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: "txHash",
                type: "varchar(100)",
                isNullable: false,
                default: "''"
              },              
              {
                name: 'due',
                type: 'datetime',
                isNullable: true
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)

          await queryRunner.createIndex('stake_activity', new TableIndex({
            name: 'idx_account',
            columnNames: ['accountAddress']
          }));

          await queryRunner.createIndex('stake_activity', new TableIndex({
            name: 'idx_currency',
            columnNames: ['currency']
          }));

          await queryRunner.createIndex('stake_activity', new TableIndex({
            name: 'idx_type',
            columnNames: ['type']
          }));

          await queryRunner.createIndex('stake_activity', new TableIndex({
            name: 'idx_createdAt',
            columnNames: ['createdAt']
          }));          

        }

        //variable
        if(!await queryRunner.hasTable('variable')){
          await queryRunner.createTable(new Table({
            name: 'variable',
            columns: [
              {
                name: 'key',
                isPrimary: true,
                type: 'varchar(45)',
                isNullable: false,
              },
              {
                name: 'value',
                type: 'decimal',
                precision:65,
                scale:0,
                isNullable: false,
                default: 0
              }
            ]
          }), true)

          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('migrationVersion','1')  `);
          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('migrationRange',0)  `);
          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('currentBlockNo',57476589)  `);
          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('currentEthBlockNo',12306758)  `);
          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('totalStaking',0)  `);
          await queryRunner.query(`INSERT INTO variable(\`key\`,\`value\`) VALUES ('totalReward',0)  `);
        }

        if(!await queryRunner.hasTable('nft_info')){
          await queryRunner.createTable(new Table({
            name: 'nft_info',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(255)',
                isPrimary: true,
                isNullable: false,
              },
              {
                name: 'platform',
                type: 'varchar(10)',
                isNullable: false,
                default:"'ETH'"
              },
              {
                name: 'ethAddress',
                type: 'varchar(255)',
                isNullable: false,
                default:"''"

              },
              {
                name: 'name',
                type: 'varchar(50)',
                isNullable: false,
                default:"''"                
              },
              {
                name: 'symbol',
                type: 'varchar(50)',
                isNullable: true,
                default:"''"                
              }, 
              {
                name: 'explorer',
                type: 'varchar(255)',
                isNullable: true,
                default:"''"                
              }, 
              {
                name: 'desc',
                type: 'varchar(255)',
                isNullable: true,
                default:"''"                
              }, 
              {
                name: 'link',
                type: 'varchar(255)',
                isNullable: true,
                default:"''"                
              },                                           
              {
                name: 'total',
                type: 'int',
                unsigned:true,
                isNullable: true,
                default: 0
              },
              {
                name: 'logoUrl',
                type: 'varchar(255)',
                isNullable: true,
              },
              {
                name: 'type',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)
        }

        if(!await queryRunner.hasTable('category')){
          await queryRunner.createTable(new Table({
            name: 'category',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isPrimary: true,
                default:"''"
              },
              {
                name: 'category',
                type: 'varchar(45)',
                isPrimary: true,
                default:"''"
              },
              {
                name: 'type',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
            ]
          }), true)
        }

        if(!await queryRunner.hasTable('solex_tx')){
          await queryRunner.createTable(new Table({
            name: 'solex_tx',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'hashId',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'blockNumber',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'fromAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'toAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }

            ]
          }), true)

        }

        if(!await queryRunner.hasTable('event')){
          await queryRunner.createTable(new Table({
            name: 'event',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'blockNumber',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'address',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'log',
                type: 'text'
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }

            ]
          }), true)

        }

        //activity
        if(!await queryRunner.hasTable('activity')){
          await queryRunner.createTable(new Table({
            name: 'activity',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'eventType',
                type: 'tinyint',
                default:"0"          
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned: true,
                default:"0"          
              },
              {
                name: 'tradeType',
                type: 'tinyint',
                default:"0"          
              },
              {
                name: 'tradeId',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'currency',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:2,
                unsigned:true,
                isNullable: false,
                default: 0
              },              
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'fromAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'toAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'bridgeId',
                type: 'int',
                unsigned: true,
                default:"0"          
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }

            ]
          }), true)

          await queryRunner.createIndex('activity', new TableIndex({
            name: 'idx_eventType',
            columnNames: ['eventType']
          }));

          await queryRunner.createIndex('activity', new TableIndex({
            name: 'idx_tradeId',
            columnNames: ['tradeId']
          }));

          await queryRunner.createIndex('activity', new TableIndex({
            name: 'idx_status',
            columnNames: ['status']
          }));

          await queryRunner.createIndex('activity', new TableIndex({
            name: 'idx_updatedAt',
            columnNames: ['updatedAt']
          }));

        }

        //block
        if(!await queryRunner.hasTable('block')){
          await queryRunner.createTable(new Table({
            name: 'block',
            columns: [
              {
                name: 'blockNumber',
                type: 'bigint',
                isPrimary: true,
                unsigned: true,
              },
              {
                name: 'version',
                type: 'tinyint',
                unsigned: true              
              }
            ]
          }), true)

        }

        if(!await queryRunner.hasTable('solex_tx')){
          await queryRunner.createTable(new Table({
            name: 'solex_tx',
            columns: [
              {
                name: 'hash',
                isPrimary: true,
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }

            ]
          }), true)

        }

        if(!await queryRunner.hasTable('bridge_tx')){
          await queryRunner.createTable(new Table({
            name: 'bridge_tx',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'platform',
                type: 'varchar(20)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'hashId',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'depositId',
                type: 'int',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: "amount",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'blockNumber',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'txHash',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'fromAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'toAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'type',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }

            ]
          }), true)


          await queryRunner.createIndex('bridge_tx', new TableIndex({
            name: 'idx_hash',
            columnNames: ['hashId']
          }));
        }

        if(!await queryRunner.hasTable('token_info')){
          await queryRunner.createTable(new Table({
            name: 'token_info',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                isPrimary: true,
                default:"''"
              },
              {
                name: 'platform',
                type: 'varchar(10)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'ethAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },

              {
                name: 'name',
                type: 'varchar(50)',
                isNullable: false,
              },
              {
                name: 'symbol',
                type: 'varchar(50)',
                isNullable: false,
              },
              {
                name: 'decimals',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 18
              },
              {
                name: "usdPrice",
                type: 'decimal',
                precision:25,
                scale:8,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 1
              },
              {
                name: 'reward',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "stakeIndex",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "stakeAccReward",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: "feeReceiver",
                type: 'decimal',
                precision:65,
                scale:0,
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)
        }

        if(!await queryRunner.hasTable('nft_rank')){
          await queryRunner.createTable(new Table({
            name: 'nft_rank',
            columns: [
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isPrimary: true,
                isNullable: false,
                default:"''"
              },
              {
                name: 'dateKey',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default:0
              },
              {
                name: 'total',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'beforeWeek',
                type: 'bigint',
                isNullable: false,
                default: 0
              },
              {
                name: 'week',
                type: 'bigint',
                isNullable: false,
                default: 0
              },
              {
                name: "change",
                type: 'decimal',
                precision:30,
                scale:2,
                isNullable: false,
                default: 0
              },
              {
                name: "avgPrice",
                type: 'decimal',
                precision:30,
                scale:2,
                isNullable: false,
                default: 0
              },
              {
                name: 'tradeCnt',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'nftCnt',
                type: 'bigint',
                isNullable: false,
                default: 0
              },
              {
                name: 'ownerCnt',
                type: 'bigint',
                unsigned:true,
                isNullable: false,
                default: 0
              },                                                                      
              
            ]
          }), true)

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_total',
            columnNames: ['total']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_week',
            columnNames: ['week']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_tradeCnt',
            columnNames: ['tradeCnt']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_change',
            columnNames: ['change']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_avgPrice',
            columnNames: ['avgPrice']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_nftCnt',
            columnNames: ['nftCnt']
          }));

          await queryRunner.createIndex('nft_rank', new TableIndex({
            name: 'idx_ownerCnt',
            columnNames: ['ownerCnt']
          }));                              

          await queryRunner.query(`INSERT INTO nft_rank(\`tokenAddress\`) VALUES ('0x49E508C437AF1F0Cad0b52A31963A2cfF02cc666')  `);

        }

        if(!await queryRunner.hasTable('nft_queue')){
          await queryRunner.createTable(new Table({
            name: 'nft_queue',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'tokenAddress',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'tokenId',
                type: 'varchar(100)',
                isNullable: false,
                default:"''"
              },
              {
                name: 'type',
                type: 'varchar(10)',
                isNullable: false,
                default:"''"
              }
            ]
          }), true)
        }

        //agreement
        if(!await queryRunner.hasTable('agreement')){
          await queryRunner.createTable(new Table({
            name: 'agreement',
            columns: [
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isPrimary: true
              },
              {
                name: 'agreementCate',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'bit',
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              },
              {
                name: 'updatedAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)
        }

        //agreement_log
        if(!await queryRunner.hasTable('agreement_log')){
          await queryRunner.createTable(new Table({
            name: 'agreement_log',
            columns: [
              {
                name: 'id',
                type: 'bigint',
                isPrimary: true,
                isGenerated: true,
                unsigned: true,
                generationStrategy: 'increment'
              },
              {
                name: 'accountAddress',
                type: 'varchar(100)',
                isNullable: false,
                default: "''"                
              },
              {
                name: 'agreementCate',
                type: 'tinyint',
                unsigned:true,
                isNullable: false,
                default: 0
              },
              {
                name: 'status',
                type: 'bit',
                isNullable: false,
                default: 0
              },
              {
                name: 'createdAt',
                type: 'datetime',
                isNullable: false,
                default:"CURRENT_TIMESTAMP"
              }
            ]
          }), true)
        }
      }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

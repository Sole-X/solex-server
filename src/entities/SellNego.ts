import { Column, Entity, Index, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ParentEntity } from './ParentEntity';
import { Sale } from './Sale';

@Index('idx_wallet', ['accountAddress'], {})
@Index('idx_sell', ['sellId'], {})
@Entity('sell_nego')
export class SellNego extends ParentEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('varchar', { name: 'accountAddress', length: 100 })
  accountAddress: string;

  @ManyToOne((type) => Sale, (sale) => sale.id)
  @JoinColumn([{ name: 'sellId', referencedColumnName: 'id' }])
  @Column('varchar', { name: 'sellId', length: 66 })
  sellId: string;

  @Column('varchar', { name: 'currency', length: 100, default: () => "''" })
  currency: string;

  @Column('decimal', {
    name: 'negoPrice',
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  negoPrice: string;

  @Column('decimal', {
    name: 'usdPrice',
    unsigned: true,
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  usdPrice: string;

  @Column('tinyint', {
    name: 'declineType',
    unsigned: true,
    default: () => '0',
  })
  declineType: number;

  @Column('varchar', {
    name: 'declineReason',
    length: 300,
    default: () => "''",
  })
  declineReason: string;

  @Column('tinyint', { name: 'status', unsigned: true, default: () => '1' })
  status: number;

  @Column('datetime', { name: 'createdAt', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('datetime', { name: 'updatedAt', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

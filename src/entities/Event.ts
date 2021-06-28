import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ParentEntity } from './ParentEntity';

@Entity('event')
export class Event extends ParentEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'blockNumber',
    unsigned: true,
    default: () => "'0'",
  })
  blockNumber: string;

  @Column('varchar', { name: 'txHash', length: 100, default: () => "''" })
  txHash: string;

  @Column('varchar', { name: 'address', length: 100, default: () => "''" })
  address: string;

  @Column('text', { name: 'log' })
  log: string;

  @Column('datetime', { name: 'createdAt', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ParentEntity } from './ParentEntity';

@Entity('stake_reward')
export class StakeReward extends ParentEntity {
  @Column('varchar', {
    primary: true,
    name: 'accountAddress',
    length: 100,
    default: () => "''",
  })
  accountAddress: string;

  @Column('varchar', {
    primary: true,
    name: 'currency',
    length: 100,
    default: () => "''",
  })
  currency: string;

  @Column('decimal', {
    name: 'userIndex',
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  userIndex: string;

  @Column('decimal', {
    name: 'amount',
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  amount: string;

  @Column('decimal', {
    name: 'totalReward',
    unsigned: true,
    precision: 65,
    scale: 0,
    default: () => "'0'",
  })
  totalReward: string;

  @Column('datetime', { name: 'createdAt', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('datetime', { name: 'updatedAt', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
